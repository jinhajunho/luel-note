'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, Hand, X } from 'lucide-react'
import { LessonTypeBadge } from '@/components/common/LessonBadges'
import { formatInstructorName } from '@/lib/utils/text'

import { useAuth } from '@/lib/auth-context'
import { getMemberIdByProfileId } from '@/app/actions/member-data'
import { getMemberClasses } from '@/app/actions/member-classes'
import { toggleAttendance } from '@/lib/actions/attendance-actions'
import { addSystemLog } from '@/lib/utils/system-log'

type LessonInfo = {
  classId: string
  date: string
  start: Date
  end: Date
  startLabel: string
  endLabel: string
  instructor: string
  type: '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
  attended: boolean | null
  checkInTime: string | null
}

const parseLocalDateTime = (dateStr: string, timeStr: string): Date | null => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [rawHour, rawMinute] = timeStr.split(':')
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    rawHour === undefined ||
    rawMinute === undefined
  ) {
    return null
  }
  const hour = Number(rawHour)
  const minute = Number(rawMinute)
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null
  }
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

const formatNow = (now: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const getLessonStatusText = (lesson: LessonInfo) => {
  if (lesson.attended === true) {
    return lesson.checkInTime ? `출석 완료 · ${lesson.checkInTime}` : '출석 완료'
  }
  if (lesson.attended === false) {
    return '결석'
  }
  return '미체크'
}

export default function MemberAttendancePage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [nowTick, setNowTick] = useState(new Date())
  const [todayLessons, setTodayLessons] = useState<LessonInfo[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [submittingLessonId, setSubmittingLessonId] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNowTick(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // 역할 체크: 강사나 관리자는 해당 페이지로 리다이렉트
  useEffect(() => {
    if (authLoading) return
    if (!profile) return

    if (profile.role === 'instructor') {
      router.replace('/instructor/schedule')
      return
    }
    if (profile.role === 'admin') {
      router.replace('/admin/schedule')
      return
    }
  }, [profile, authLoading, router])

  const loadTodayLessons = useCallback(async () => {
    if (!profile?.id || profile.role !== 'member') {
      setLoading(false)
      setTodayLessons([])
      return
    }

    try {
      setLoading(true)
      const memberId = await getMemberIdByProfileId(profile.id)
      setMemberId(memberId)
      if (!memberId) {
        setTodayLessons([])
        setLoading(false)
        return
      }

      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
      const lessons = await getMemberClasses(memberId, todayStr, todayStr)

      const mapped = lessons
        .map((lesson) => {
          if (!lesson.startTime || !lesson.endTime) {
            return null
          }
          const start = parseLocalDateTime(lesson.date, lesson.startTime)
          const rawEnd = parseLocalDateTime(lesson.date, lesson.endTime)
          if (!start || !rawEnd) {
            return null
          }
          let end = rawEnd
          if (end <= start) {
            end = new Date(end.getTime() + 24 * 60 * 60 * 1000)
          }
          return {
            classId: lesson.id,
            date: lesson.date,
            start,
            end,
            startLabel: `${lesson.date} ${lesson.startTime}`,
            endLabel: lesson.endTime,
            instructor: lesson.instructor,
            type: lesson.type,
            attended: lesson.attended ?? null,
            checkInTime: lesson.checkInTime ?? null,
          } as LessonInfo
        })
        .filter((value): value is LessonInfo => Boolean(value))
        .sort((a, b) => a.start.getTime() - b.start.getTime())

      setTodayLessons(mapped)
    } catch (error) {
      console.error('오늘의 레슨 로드 실패:', error)
      setTodayLessons([])
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    loadTodayLessons()
  }, [loadTodayLessons])

  useEffect(() => {
    if (!selectedLessonId) return
    if (!todayLessons.some((lesson) => lesson.classId === selectedLessonId)) {
      setSelectedLessonId(null)
    }
  }, [todayLessons, selectedLessonId])

  useEffect(() => {
    if (selectedLessonId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedLessonId])

  const computeWindowInfo = useCallback(
    (lesson: LessonInfo, referenceDate?: Date) => {
      if (Number.isNaN(lesson.start.getTime()) || Number.isNaN(lesson.end.getTime())) {
        return { windowOpen: false, startWindow: null, endWindow: null }
      }
      const startWindow = new Date(lesson.start.getTime() - 60 * 60 * 1000)
      const endWindow = new Date(lesson.end.getTime() + 60 * 60 * 1000)
      const now = referenceDate ?? nowTick
      const windowOpen = now >= startWindow && now <= endWindow
      return { windowOpen, startWindow, endWindow }
    },
    [nowTick]
  )

  const handleToggleAttendance = useCallback(
    async (lesson: LessonInfo) => {
      if (!memberId || submittingLessonId) {
        return
      }

      const { windowOpen } = computeWindowInfo(lesson, new Date())
      if (!windowOpen) {
        alert('출석을 변경할 수 있는 시간이 아닙니다.')
        return
      }

      try {
        setSubmittingLessonId(lesson.classId)
        const result = await toggleAttendance(lesson.classId, memberId, lesson.attended ?? null, {
          actor: 'member',
        })
        if (!result.success) {
          alert(result.message)
          return
        }

        const newStatus = result.newStatus ?? (lesson.attended === true ? null : true)
        const formattedCheckIn = result.checkInTime
          ? new Date(result.checkInTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          : null

        setTodayLessons((prev) =>
          prev.map((item) =>
            item.classId === lesson.classId
              ? {
                  ...item,
                  attended: newStatus,
                  checkInTime: formattedCheckIn,
                }
              : item
          )
        )

        const actionLabel =
          newStatus === true ? '출석 완료' : newStatus === false ? '결석 처리' : '출석 취소'
        addSystemLog({
          type: 'data_change',
          user: profile?.name || '회원',
          action: `회원 출석 ${actionLabel}`,
          details: `일시: ${lesson.startLabel} ~ ${lesson.endLabel}, 강사: ${formatInstructorName(lesson.instructor)}, 수업 유형: ${lesson.type}`,
        })

        await loadTodayLessons()
      } catch (error) {
        console.error('출석 처리 실패:', error)
        alert('출석 처리 중 오류가 발생했습니다.')
      } finally {
        setSubmittingLessonId(null)
      }
    },
    [memberId, submittingLessonId, loadTodayLessons, profile?.name, computeWindowInfo]
  )

  const nowText = useMemo(() => formatNow(nowTick), [nowTick])
  const selectedLesson = useMemo(() => {
    if (!selectedLessonId) return null
    return todayLessons.find((lesson) => lesson.classId === selectedLessonId) ?? null
  }, [selectedLessonId, todayLessons])

  return (
    <div className="px-5 py-16 pb-24 space-y-8">
      <div className="flex items-center justify-center gap-2 text-[#1a1a1a]">
        <Clock className="w-5 h-5 text-blue-600" />
        <span className="text-xl font-semibold">현재 시각 {nowText}</span>
      </div>

      {loading ? (
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-6 text-center text-sm text-[#7a6f61]">
          오늘의 레슨을 불러오는 중입니다...
        </div>
      ) : todayLessons.length === 0 ? (
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-6 text-center text-sm text-[#7a6f61]">
          오늘 예정된 수업이 없습니다
        </div>
      ) : (
        <div className="space-y-4">
          {todayLessons.map((lesson) => {
            const { windowOpen } = computeWindowInfo(lesson)
            const isSubmitting = submittingLessonId === lesson.classId
            const statusText = getLessonStatusText(lesson)

            return (
              <button
                key={lesson.classId}
                type="button"
                onClick={() => setSelectedLessonId(lesson.classId)}
                className="w-full text-left bg-white border border-[#f0ebe1] rounded-2xl p-5 shadow-sm space-y-3 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <LessonTypeBadge type={lesson.type} />
                    <div className="text-base font-semibold text-[#1a1a1a]">
                      {lesson.startLabel} ~ {lesson.endLabel}
                    </div>
                    <div className="text-sm text-[#7a6f61]">
                      {formatInstructorName(lesson.instructor)}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      lesson.attended === true
                        ? 'bg-green-100 text-green-700'
                        : lesson.attended === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {statusText}
                  </div>
                </div>

                <div className="text-xs text-[#7a6f61]">
                  {windowOpen
                    ? lesson.attended === true
                      ? '현재 출석 완료 상태입니다. 누르면 상세 모달이 열립니다.'
                      : '출석 가능 시간입니다. 눌러서 출석을 진행하세요.'
                    : '현재는 출석을 변경할 수 있는 시간이 아닙니다.'}
                  {isSubmitting && (
                    <span className="block text-blue-600 mt-1">출석 정보를 저장하는 중...</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedLessonId(null)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 space-y-5 animate-fade-in">
            <button
              type="button"
              onClick={() => setSelectedLessonId(null)}
              className="absolute top-4 right-4 text-[#7a6f61] hover:text-[#1a1a1a]"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 text-center">
              <div className="flex justify-center">
                <LessonTypeBadge type={selectedLesson.type} />
              </div>
              <div className="text-lg font-semibold text-[#1a1a1a]">
                {selectedLesson.startLabel} ~ {selectedLesson.endLabel}
              </div>
              <div className="text-sm text-[#7a6f61]">
                {formatInstructorName(selectedLesson.instructor)}
              </div>
              <div className="text-xs text-[#7a6f61]">
                상태: {getLessonStatusText(selectedLesson)}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                disabled={!computeWindowInfo(selectedLesson).windowOpen || submittingLessonId === selectedLesson.classId}
                onClick={() => handleToggleAttendance(selectedLesson)}
                className={`w-36 h-36 rounded-full flex items-center justify-center shadow-md transition-colors ${
                  selectedLesson.attended === true
                    ? computeWindowInfo(selectedLesson).windowOpen
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-200 text-gray-500'
                    : computeWindowInfo(selectedLesson).windowOpen
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500'
                } ${submittingLessonId === selectedLesson.classId ? 'opacity-70 cursor-not-allowed' : ''}`}
                aria-label="출석하기"
              >
                {selectedLesson.attended === true ? <Check className="w-12 h-12" /> : <Hand className="w-12 h-12" />}
              </button>
              <div className="text-sm font-semibold text-[#1a1a1a]">
                {selectedLesson.attended === true ? '출석 취소' : '출석하기'}
              </div>
              <div className="text-xs text-[#7a6f61] text-center whitespace-pre-line">
                {computeWindowInfo(selectedLesson).windowOpen
                  ? selectedLesson.attended === true
                    ? '버튼을 누르면 출석이 취소됩니다.'
                    : '출석 가능 시간입니다. (레슨 시작 1시간 전 ~ 종료 후 1시간)'
                  : '현재는 출석을 변경할 수 있는 시간이 아닙니다.'}
                {submittingLessonId === selectedLesson.classId && (
                  <span className="block text-blue-600 mt-1">출석 정보를 저장하는 중...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
