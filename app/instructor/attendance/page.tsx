'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar, CheckCircle } from 'lucide-react'
import { LessonStatusBadge, LessonTypeBadge } from '@/components/common/LessonBadges'
import CalendarModal from '@/components/common/CalendarModal'
import { useAuth } from '@/lib/auth-context'
import { getAllClasses } from '@/app/actions/classes'
import { formatInstructorName } from '@/lib/utils/text'
import { usePathname, useRouter } from 'next/navigation'
import { addSystemLog } from '@/lib/utils/system-log'

type TabType = 'today' | 'history'
type LessonTypeName = '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
type LessonStatusName = '예정' | '완료' | '취소'

type LessonMember = {
  memberId: string
  name: string
  phone?: string
  remainingLessons: number | null
  totalLessons: number | null
  attended: boolean | null
  checkInTime?: string
  hasPackage: boolean
  paymentType?: string
}

interface Lesson {
  id: string
  date: string
  startTime: string
  endTime: string
  type: LessonTypeName
  status: LessonStatusName
  instructor?: string
  instructorId?: string | null
  paymentType: string
  members: LessonMember[]
}

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const formatDisplayDate = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00`)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`
}

const formatCheckInTime = (iso?: string | null) => {
  if (!iso) return undefined
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return undefined
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export default function InstructorAttendancePage() {
  const { profile, loading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<TabType>('today')
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const isInstructorContext =
    profile?.role === 'instructor' || profile?.role === 'admin'
  const instructorId = isInstructorContext && profile?.id ? profile.id : null
  const instructorName = profile?.name ? formatInstructorName(profile.name) : ''

  const loadLessons = useCallback(async () => {
    if (!instructorId) return
    setLoading(true)
    setError(null)
    try {
      const result = await getAllClasses()
      if (!result.success || !result.data) {
        setLessons([])
        if (result.error) {
          setError(result.error)
        }
        return
      }

      const mapped: Lesson[] = result.data
        .filter((lesson) => lesson.instructorId === instructorId)
        .map((lesson) => ({
          id: lesson.id,
          date: lesson.date,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          type: lesson.type as LessonTypeName,
          status: lesson.status as LessonStatusName,
          instructor: instructorName,
          instructorId: lesson.instructorId ?? null,
          paymentType: lesson.paymentType,
          members: lesson.members.map((member, index) => ({
            memberId: member.memberId || `member-${lesson.id}-${index}`,
            name: member.name,
            phone: member.phone ?? undefined,
            remainingLessons: member.remainingLessons ?? null,
            totalLessons: member.totalLessons ?? null,
            attended: member.attended ?? null,
            checkInTime: formatCheckInTime(member.checkInTime),
            hasPackage: Boolean(member.hasPackage),
            paymentType: member.paymentType ?? lesson.paymentType,
          })),
        }))

      setLessons(mapped)
    } catch (err) {
      console.error('레슨 목록 로드 실패:', err)
      setLessons([])
      setError('레슨 데이터를 불러오는 중 문제가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [instructorId, instructorName])

  useEffect(() => {
    if (authLoading) return
    if (!profile || !isInstructorContext) {
      setLessons([])
      setError('강사 전용 페이지입니다.')
      return
    }
    loadLessons()
  }, [authLoading, profile, isInstructorContext, loadLessons])

  const todayKey = formatDateKey(new Date())
  const selectedDateKey = formatDateKey(selectedDate)

  const todayLessons = useMemo(
    () => lessons.filter((lesson) => lesson.date === todayKey),
    [lessons, todayKey]
  )
  const historyLessons = useMemo(
    () => lessons.filter((lesson) => lesson.date === selectedDateKey),
    [lessons, selectedDateKey]
  )

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId]
  )

  const currentLessons = activeTab === 'today' ? todayLessons : historyLessons

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setCalendarModalOpen(false)
  }

  const openModal = (lessonId: string) => {
    setSelectedLessonId(lessonId)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setSelectedLessonId(null)
    document.body.style.overflow = ''
  }

  const handleToggleAttendance = useCallback(
    async (lessonId: string, memberId: string) => {
      if (actionLoading) return
      const lesson = lessons.find((l) => l.id === lessonId)
      const member = lesson?.members.find((m) => m.memberId === memberId)
      if (!lesson || !member) return

      try {
        setActionLoading(true)
        const actions = await import('@/lib/actions/attendance-actions')
        const result = await actions.toggleAttendance(lessonId, memberId, member.attended ?? null, {
          actor: 'instructor',
        })
        if (!result.success) {
          alert(result.message)
          return
        }
        await loadLessons()
      } catch (err) {
        console.error('출석 처리 실패:', err)
        alert('출석 처리 중 오류가 발생했습니다.')
      } finally {
        setActionLoading(false)
      }
    },
    [lessons, loadLessons, actionLoading]
  )

  const handleCompleteLesson = useCallback(
    async (lessonId: string) => {
      if (actionLoading) return
      const lesson = lessons.find((l) => l.id === lessonId)
      try {
        setActionLoading(true)
        const actions = await import('@/lib/actions/attendance-actions')
        const result = await actions.completeClass(lessonId)
        if (!result.success) {
          alert(result.message)
          return
        }
        if (lesson) {
          addSystemLog({
            type: 'data_change',
            user: profile?.name || instructorName,
            action: '레슨 완료 처리',
            details: `일자: ${lesson.date}, 시간: ${lesson.startTime}~${lesson.endTime}, 강사: ${instructorName}, 참여자: ${lesson.members
              .map((m) => m.name)
              .join(', ') || '없음'}`,
          })
        }
        closeModal()
        await loadLessons()
      } catch (err) {
        console.error('레슨 완료 처리 실패:', err)
        alert('레슨 완료 처리 중 오류가 발생했습니다.')
      } finally {
        setActionLoading(false)
      }
    },
    [loadLessons, actionLoading, lessons, instructorName, profile?.name]
  )

  const handleCancelLesson = useCallback(
    async (lessonId: string) => {
      if (actionLoading) return
      const lesson = lessons.find((l) => l.id === lessonId)
      try {
        const confirmMessage = lesson?.status === '완료'
          ? '레슨 완료 상태를 취소하시겠습니까?'
          : '레슨을 취소하시겠습니까? 참석한 회원의 출석 기록이 초기화됩니다.'
        if (!confirm(confirmMessage)) {
          return
        }
        setActionLoading(true)
        const actions = await import('@/lib/actions/attendance-actions')
        const result = await actions.cancelClass(lessonId)
        if (!result.success) {
          alert(result.message)
          return
        }
        if (lesson) {
          const actionLabel = result.nextStatus === 'scheduled' ? '레슨 완료 취소' : '레슨 취소'
          addSystemLog({
            type: 'data_change',
            user: profile?.name || instructorName,
            action: actionLabel,
            details: `일자: ${lesson.date}, 시간: ${lesson.startTime}~${lesson.endTime}, 강사: ${instructorName}, 참여자: ${lesson.members
              .map((m) => m.name)
              .join(', ') || '없음'}\n결과: ${result.message}`,
          })
        }
        closeModal()
        await loadLessons()
      } catch (err) {
        console.error('레슨 취소 처리 실패:', err)
        alert('레슨 취소 처리 중 오류가 발생했습니다.')
      } finally {
        setActionLoading(false)
      }
    },
    [actionLoading, lessons, instructorName, profile?.name, loadLessons]
  )

  useEffect(() => {
    if (activeTab === 'today') {
      setSelectedDate(new Date())
    }
  }, [activeTab])

  if (authLoading) {
    return (
      <div className="px-5 py-10 text-center text-sm text-[#7a6f61]">
        정보를 불러오는 중입니다...
      </div>
    )
  }

  if (!profile || !isInstructorContext) {
    return (
      <div className="px-5 py-10 text-center text-sm text-[#7a6f61]">
        강사 전용 페이지입니다.
      </div>
    )
  }

  const todayLabel = formatDisplayDate(todayKey)

  return (
    <div className="pb-24 overflow-x-hidden">
      <div className="bg-white border-x-0 border-t border-[#f0ebe1] border-b border-[#f0ebe1] rounded-none px-4 py-2 shadow-sm min-h-[56px] flex items-center">
        {activeTab === 'today' ? (
          <div className="flex items-center justify-center w-full">
            <span className="text-sm font-semibold text-[#1a1a1a]">
              {todayLabel}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => changeDate(-1)}
              className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCalendarModalOpen(true)}
              className="flex-1 mx-4 flex items-center justify-center gap-2 px-4 py-2 border border-[#f0ebe1] rounded-lg hover:border-blue-300 transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#7a6f61]" />
              <span className="text-sm font-semibold text-[#1a1a1a]">
                {formatDisplayDate(selectedDateKey)}
              </span>
            </button>
            <button
              onClick={() => changeDate(1)}
              className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    <div className="bg-white border-b border-[#f0ebe1] px-5 shadow-sm">
      <div className="flex">
        <button
          onClick={() => {
            setActiveTab('today')
            setSelectedLessonId(null)
          }}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'today'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          오늘 레슨
        </button>
        <button
          onClick={() => {
            setActiveTab('history')
            setSelectedLessonId(null)
          }}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          출석 기록
        </button>
      </div>
    </div>

    <div className="space-y-3 px-5 py-6 max-h-[calc(100vh-260px)] overflow-y-auto">
      {loading ? (
        <div className="bg-white border border-[#f0ebe1] rounded-lg p-12 text-center text-sm text-[#7a6f61]">
          레슨을 불러오는 중입니다...
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-lg p-12 text-center text-sm text-red-600">
          {error}
        </div>
      ) : currentLessons.length === 0 ? (
        <div className="bg-white border border-[#f0ebe1] rounded-lg p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <div className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === 'today' ? '오늘 예정된 레슨이 없습니다' : '선택한 날짜에 기록이 없습니다'}
          </div>
        </div>
      ) : (
        currentLessons.map((lesson) => (
          <div
            key={lesson.id}
            onClick={() => openModal(lesson.id)}
            className="bg-white border border-[#f0ebe1] rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-[#7a6f61]">
                {formatDisplayDate(lesson.date)}
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
                <span>{lesson.startTime} - {lesson.endTime}</span>
              </div>
              {lesson.members.some((m) => m.attended === true) && (
                <div className="ml-auto text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <LessonTypeBadge type={lesson.type} />
              <LessonStatusBadge status={lesson.status} />
              <span className="text-xs text-[#7a6f61]">{lesson.paymentType}</span>
            </div>
            {lesson.members.length > 0 && (
              <p className="text-sm text-[#7a6f61]">
                참여 회원: {lesson.members.map((m) => m.name).join(', ')}
              </p>
            )}
          </div>
        ))
      )}
    </div>

    <CalendarModal
      isOpen={calendarModalOpen}
      onClose={() => setCalendarModalOpen(false)}
      selectedDate={selectedDate}
      onSelectDate={handleDateSelect}
      lessonDates={[...new Set(lessons.map((lesson) => lesson.date))]}
    />

    {selectedLesson && (
      <div
        className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/50"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal()
        }}
      >
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedLesson.startTime} - {selectedLesson.endTime} · {selectedLesson.type}
            </h2>
            <button
              onClick={closeModal}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex border-b border-[#f0ebe1]">
            <button className="px-4 py-2 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">
              출석 체크
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {selectedLesson.members.length === 0 ? (
              <div className="text-center py-8 text-[#7a6f61]">
                <p className="text-sm">참여 회원이 없습니다</p>
                {selectedLesson.type === '인트로' && (
                  <p className="text-xs mt-2 text-[#7a6f61]">인트로 레슨은 회원 없이 진행됩니다</p>
                )}
              </div>
            ) : (
              selectedLesson.members.map((member, idx) => {
                const isPresent = member.attended === true
                const isAbsent = member.attended === false
                const isUnchecked = member.attended === null

                return (
                  <div
                    key={member.memberId || `member-${idx}`}
                    className="flex items-center justify-between p-3 border border-[#f0ebe1] rounded-lg bg-white"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#1a1a1a] font-medium">{member.name}</span>
                        {!member.hasPackage && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-semibold rounded">
                            회원권 없음
                          </span>
                        )}
                        {isPresent && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            출석 완료
                          </span>
                        )}
                        {isAbsent && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                            결석
                          </span>
                        )}
                      </div>
                      {member.checkInTime && (
                        <div className="text-xs text-green-600 mt-1">출석: {member.checkInTime}</div>
                      )}
                      {member.remainingLessons !== null && member.totalLessons !== null && (
                        <div className="text-xs text-[#7a6f61] mt-1">
                          잔여 {member.remainingLessons}회 / 총 {member.totalLessons}회
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {selectedLesson.status === '예정' && activeTab === 'today' && (
                        <button
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!member.hasPackage && isUnchecked) {
                              if (!confirm(`${member.name} 회원은 사용 가능한 회원권이 없습니다.\n출석 체크하시겠습니까?`)) {
                                return
                              }
                            }
                            handleToggleAttendance(selectedLesson.id, member.memberId)
                          }}
                          className={`px-3 py-2 text-sm min-h-[36px] font-semibold rounded-lg transition-colors ${
                            isPresent
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : isUnchecked
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          } ${actionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {isPresent ? '출석 취소' : isUnchecked ? '출석 체크' : '결석 취소'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {selectedLesson.status !== '취소' && (
            <div className="p-4 border-t border-[#f0ebe1] space-y-2">
              {selectedLesson.status !== '완료' && (
                <button
                  disabled={actionLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    const hasUnchecked = selectedLesson.members.some((m) => m.attended === null)
                    if (hasUnchecked && !confirm('아직 체크하지 않은 회원이 있습니다.\n체크하지 않은 회원은 자동으로 결석 처리됩니다.\n레슨을 완료하시겠습니까?')) {
                      return
                    }
                    handleCompleteLesson(selectedLesson.id)
                  }}
                  className={`w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors ${
                    actionLoading ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  레슨 완료
                </button>
              )}
              <button
                disabled={actionLoading}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancelLesson(selectedLesson.id)
                }}
                className={`w-full py-3 ${
                  selectedLesson.status === '완료'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                } text-sm font-semibold rounded-lg transition-colors ${
                  actionLoading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {selectedLesson.status === '완료' ? '레슨 완료 취소' : '레슨 취소'}
              </button>
            </div>
          )}
        </div>
      </div>
    )}


    </div>
  )
}
