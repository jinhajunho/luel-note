'use client'

import { useEffect, useMemo, useState } from 'react'
import { LessonStatusBadge, LessonTypeBadge } from '@/components/common/LessonBadges'
import PopoverSelect, { PopoverOption } from '@/components/common/PopoverSelect'
import { useAuth } from '@/lib/auth-context'
import { getMemberIdByProfileId } from '@/app/actions/member-data'
import { getMemberClasses, type MemberClass } from '@/app/actions/member-classes'
import { formatInstructorName } from '@/lib/utils/text'

type LessonRecord = MemberClass

export default function MemberHistoryPage() {
  const { profile, loading: authLoading } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [lessons, setLessons] = useState<LessonRecord[]>([])
  const [modalId, setModalId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'전체' | LessonRecord['type']>('전체')
  const [statusFilter, setStatusFilter] = useState<'전체' | LessonRecord['status']>('전체')

  useEffect(() => {
    if (authLoading) return
    if (!profile) return
    if (profile.role !== 'member') {
      setError('회원 전용 페이지입니다.')
      setLessons([])
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const memberId = await getMemberIdByProfileId(profile.id)
        if (!memberId) {
          setError('회원 정보를 찾을 수 없습니다.')
          setLessons([])
          return
        }
        const data = await getMemberClasses(memberId)
        setLessons(data)
      } catch (err) {
        console.error('회원 레슨 기록 로드 실패:', err)
        setError('레슨 기록을 불러오는 중 문제가 발생했습니다.')
        setLessons([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [profile, authLoading])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalId(null)
      }
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [])

  const formatMonth = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`
  const changeMonth = (delta: number) => {
    const nd = new Date(currentDate)
    nd.setMonth(nd.getMonth() + delta)
    setCurrentDate(nd)
  }

  const monthFiltered = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth() + 1
    const prefix = `${y}-${String(m).padStart(2, '0')}`
    return lessons.filter((lesson) => lesson.date.startsWith(prefix))
  }, [lessons, currentDate])

  const stats = useMemo(() => {
    const rows = monthFiltered
    const total = rows.length
    const attended = rows.filter((r) => r.attended === true).length
    const absent = rows.filter((r) => r.attended === false).length
    return { total, attended, absent }
  }, [monthFiltered])

  const filteredLessons = monthFiltered.filter(
    (lesson) =>
      (typeFilter === '전체' || lesson.type === typeFilter) &&
      (statusFilter === '전체' || lesson.status === statusFilter)
  )

  const modalLesson = lessons.find((lesson) => lesson.id === modalId) ?? null

  return (
    <div className="px-5 py-6 pb-24 space-y-4">
      {/* 월 네비게이션 */}
      <div className="bg-white px-4 py-3 border border-[#f0ebe1] rounded-xl flex items-center gap-3">
        <button
          onClick={() => changeMonth(-1)}
          className="w-8 h-8 border border-[#f0ebe1] rounded-lg text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-colors"
        >
          ‹
        </button>
        <div className="flex-1 text-center text-base font-semibold text-gray-900">{formatMonth(currentDate)}</div>
        <button
          onClick={() => changeMonth(1)}
          className="w-8 h-8 border border-[#f0ebe1] rounded-lg text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-colors"
        >
          ›
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">{loading ? '-' : stats.total}</div>
          <div className="text-xs text-[#7a6f61]">총 레슨</div>
        </div>
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{loading ? '-' : stats.attended}</div>
          <div className="text-xs text-[#7a6f61]">출석</div>
        </div>
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-500 mb-1">{loading ? '-' : stats.absent}</div>
          <div className="text-xs text-[#7a6f61]">결석</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="grid grid-cols-2 gap-3">
        <PopoverSelect
          label="수업유형"
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as any)}
          options={[
            { label: '전체', value: '전체', colorDot: 'bg-gray-400' },
            { label: '인트로', value: '인트로', colorDot: 'bg-gray-400' },
            { label: '개인레슨', value: '개인레슨', colorDot: 'bg-purple-500' },
            { label: '듀엣레슨', value: '듀엣레슨', colorDot: 'bg-pink-500' },
            { label: '그룹레슨', value: '그룹레슨', colorDot: 'bg-orange-500' },
          ] as PopoverOption[]}
        />
        <PopoverSelect
          label="진행상태"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as any)}
          options={[
            { label: '전체', value: '전체', colorDot: 'bg-gray-400' },
            { label: '예정', value: '예정', colorDot: 'bg-blue-500' },
            { label: '완료', value: '완료', colorDot: 'bg-green-500' },
            { label: '취소', value: '취소', colorDot: 'bg-red-500' },
          ] as PopoverOption[]}
        />
      </div>

      {/* 목록 */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-[#f0ebe1] rounded-xl p-6 text-center text-sm text-[#7a6f61]">
            기록을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="bg-white border border-[#f0ebe1] rounded-xl p-6 text-center text-sm text-[#7a6f61]">
            선택한 조건에 해당하는 레슨 기록이 없습니다.
          </div>
        ) : (
          filteredLessons.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              onClick={() => setModalId(lesson.id)}
              className="w-full text-left bg-white border border-[#f0ebe1] rounded-xl p-4 hover:border-blue-300 transition-colors"
            >
              <div className="text-xs text-[#7a6f61] mb-1">{lesson.date}</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-[#1a1a1a]">
                  {lesson.startTime}
                  <span className="text-sm text-[#7a6f61] ml-1">~ {lesson.endTime}</span>
                </span>
                <LessonTypeBadge type={lesson.type} />
                <LessonStatusBadge status={lesson.status} />
                {lesson.attended === true && (
                  <span className="text-xs text-green-600 border border-green-200 rounded-full px-2 py-0.5">
                    출석완료
                  </span>
                )}
                {lesson.attended === false && lesson.status !== '취소' && (
                  <span className="text-xs text-[#7a6f61] border border-[#f0ebe1] rounded-full px-2 py-0.5">
                    결석
                  </span>
                )}
              </div>
              <div className="text-sm text-[#7a6f61]">
                {formatInstructorName(lesson.instructor)}
                {lesson.checkInTime && lesson.attended === true && (
                  <span className="text-xs text-green-600 ml-2">출석 {lesson.checkInTime}</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {modalLesson && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/50"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setModalId(null)
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalLesson.startTime} · {modalLesson.type}
              </h2>
              <button
                onClick={() => setModalId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <LessonTypeBadge type={modalLesson.type} />
                <LessonStatusBadge status={modalLesson.status} />
                {modalLesson.attended === true && (
                  <span className="text-xs text-green-600 border border-green-200 rounded-full px-2 py-0.5">
                    출석 완료
                  </span>
                )}
                {modalLesson.attended === false && modalLesson.status !== '취소' && (
                  <span className="text-xs text-[#7a6f61] border border-[#f0ebe1] rounded-full px-2 py-0.5">
                    결석
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-3">
                  <div className="text-[#7a6f61] mb-1">날짜</div>
                  <div className="text-[#1a1a1a] font-semibold">{modalLesson.date}</div>
                </div>
                <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-3">
                  <div className="text-[#7a6f61] mb-1">시간</div>
                  <div className="text-[#1a1a1a] font-semibold">
                    {modalLesson.startTime} ~ {modalLesson.endTime}
                  </div>
                </div>
                <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-3">
                  <div className="text-[#7a6f61] mb-1">강사</div>
                  <div className="text-[#1a1a1a] font-semibold">{formatInstructorName(modalLesson.instructor)}</div>
                </div>
                <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-3">
                  <div className="text-[#7a6f61] mb-1">결제 유형</div>
                  <div className="text-[#1a1a1a] font-semibold">{modalLesson.paymentType || '-'}</div>
                </div>
              </div>
              <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-3">
                <div className="text-[#7a6f61] mb-2">참여 회원</div>
                <div className="flex flex-wrap gap-1.5 text-xs text-[#1a1a1a]">
                  {modalLesson.members.map((member) => (
                    <span
                      key={member.memberId}
                      className="px-2.5 py-1 rounded-md bg-white border border-[#f0ebe1]"
                    >
                      {member.name}
                      {member.attended === true && <span className="text-green-600 ml-1">✓</span>}
                      {member.attended === false && <span className="text-[#7a6f61] ml-1">✕</span>}
                    </span>
                  ))}
                </div>
              </div>
              {modalLesson.checkInTime && modalLesson.attended === true && (
                <div className="text-xs text-green-600">
                  출석 시간: {modalLesson.checkInTime}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

