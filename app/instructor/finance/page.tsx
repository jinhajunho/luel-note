"use client"

import { useState, useEffect } from 'react'
import { LessonTypeBadge } from '@/components/common/LessonBadges'
import StatusBadge from '@/components/common/StatusBadge'
import { useAuth } from '@/lib/auth-context'

interface Lesson {
  id: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  type: '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
  status: '예정' | '완료' | '취소'
  paymentType: string
  members: {
    memberId?: string
    name: string
    phone?: string
    paymentType?: string
  }[]
}

interface SettlementSummary {
  totalCount: number
  lessonTypeCounts: {
    type: '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
    count: number
  }[]
  paymentTypeCounts: {
    type: string
    count: number
  }[]
}

export default function InstructorFinancePage() {
  const { profile } = useAuth()
  const isInstructorContext =
    profile?.role === 'instructor' || profile?.role === 'admin'
  const instructorId = isInstructorContext && profile?.id ? profile.id : null

  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [summary, setSummary] = useState<SettlementSummary>({
    totalCount: 0,
    lessonTypeCounts: [],
    paymentTypeCounts: []
  })
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [selectedLessonType, setSelectedLessonType] = useState<string | null>(null)
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 년도 목록 생성
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  useEffect(() => {
    if (!instructorId) {
      setLessons([])
      if (profile && !isInstructorContext) {
        setError('강사 전용 페이지입니다.')
      }
      return
    }

    const loadLessons = async () => {
      setLoading(true)
      setError(null)
      try {
        const { getAllClasses } = await import('@/app/actions/classes')
        const result = await getAllClasses()
        if (result.success && result.data) {
          const mapped: Lesson[] = result.data
            .filter((lesson) => lesson.instructorId === instructorId)
            .map((lesson) => ({
              id: lesson.id,
              date: lesson.date,
              startTime: lesson.startTime,
              endTime: lesson.endTime,
              type: lesson.type,
              status: lesson.status,
              paymentType: lesson.paymentType,
              members: lesson.members.map((member) => ({
                memberId: member.memberId ?? undefined,
                name: member.name,
                phone: member.phone ?? undefined,
                paymentType: member.paymentType ?? undefined,
              })),
            }))
          setLessons(mapped)
        } else {
          setLessons([])
          if (result.error) {
            setError(result.error)
          }
        }
      } catch (error) {
        console.error('강사 레슨 정산 데이터 로드 실패:', error)
        setLessons([])
        setError('레슨 데이터를 불러오는 중 문제가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadLessons()
  }, [instructorId, isInstructorContext, profile])

  // 년/월 변경 시 필터링 및 집계
  useEffect(() => {
    // 기본 필터: 년/월 + 완료 상태
    let baseFiltered = lessons.filter(lesson => {
      const lessonDate = new Date(lesson.date)
      return lessonDate.getFullYear() === year &&
             lessonDate.getMonth() + 1 === month &&
             lesson.status === '완료'
    })

    // 집계 계산 (필터 전 모든 완료 레슨)
    const lessonTypeMap = new Map<string, number>()
    const paymentTypeMap = new Map<string, number>()

    baseFiltered.forEach(lesson => {
      // 수업 유형별 집계
      lessonTypeMap.set(lesson.type, (lessonTypeMap.get(lesson.type) || 0) + 1)

      // 결제 타입별 집계
      paymentTypeMap.set(lesson.paymentType, (paymentTypeMap.get(lesson.paymentType) || 0) + 1)
    })

    // 레슨 유형 필터
    let filtered = baseFiltered
    if (selectedLessonType) {
      filtered = filtered.filter(lesson => lesson.type === selectedLessonType)
    }

    // 결제 타입 필터
    if (selectedPaymentType) {
      filtered = filtered.filter(lesson => lesson.paymentType === selectedPaymentType)
    }

    // 날짜순 정렬
    filtered.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      return a.startTime.localeCompare(b.startTime)
    })

    setFilteredLessons(filtered)

    setSummary({
      totalCount: filtered.length,
      lessonTypeCounts: [
        { type: '인트로', count: lessonTypeMap.get('인트로') || 0 },
        { type: '개인레슨', count: lessonTypeMap.get('개인레슨') || 0 },
        { type: '듀엣레슨', count: lessonTypeMap.get('듀엣레슨') || 0 },
        { type: '그룹레슨', count: lessonTypeMap.get('그룹레슨') || 0 }
      ],
      paymentTypeCounts: Array.from(paymentTypeMap.entries()).map(([type, count]) => ({ type, count }))
    })
  }, [year, month, lessons, selectedLessonType, selectedPaymentType])

  // 필터 초기화 (년/월 변경 시)
  useEffect(() => {
    setSelectedLessonType(null)
    setSelectedPaymentType(null)
  }, [year, month])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    return `${year}년 ${month}월 ${day}일 (${weekday})`
  }

  const openModal = (lesson: Lesson) => {
    setSelectedLesson(lesson)
  }

  const closeModal = () => {
    setSelectedLesson(null)
  }

  if (!profile || !isInstructorContext) {
    return (
      <div className="px-5 py-10 text-center text-sm text-[#7a6f61]">
        강사 전용 페이지입니다.
      </div>
    )
  }

  return (
    <div className="pb-24 overflow-x-hidden">
      {/* 년/월 선택 */}
      <div className="bg-white border-b border-[#f0ebe1] px-5 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#7a6f61] mb-2">
              년도
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-[#f0ebe1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#1a1a1a]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-[#7a6f61] mb-2">
              월
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-[#f0ebe1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[#1a1a1a]"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* 정산 요약 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-sm">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">
              {year}년 {month}월 총 레슨
            </p>
            <p className="text-5xl font-bold">{summary.totalCount}회</p>
          </div>
        </div>

        {/* 수업 유형별 집계 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">수업 유형별</h3>
            {selectedLessonType && (
              <button
                onClick={() => setSelectedLessonType(null)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                필터 해제
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {summary.lessonTypeCounts.map((item) => (
              item.count > 0 && (
                <div
                  key={item.type}
                  onClick={() => setSelectedLessonType(selectedLessonType === item.type ? null : item.type)}
                  className={`bg-white border rounded-lg p-4 shadow-sm cursor-pointer transition-colors ${
                    selectedLessonType === item.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-[#f0ebe1] hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <LessonTypeBadge type={item.type} />
                  </div>
                  <p className="text-2xl font-bold text-[#1a1a1a]">{item.count}회</p>
                </div>
              )
            ))}
          </div>
        </div>

        {/* 결제 타입별 집계 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">결제 타입별</h3>
            {selectedPaymentType && (
              <button
                onClick={() => setSelectedPaymentType(null)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                필터 해제
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {summary.paymentTypeCounts.map((item) => (
              <div
                key={item.type}
                onClick={() => setSelectedPaymentType(selectedPaymentType === item.type ? null : item.type)}
                className={`bg-white border rounded-lg p-4 shadow-sm cursor-pointer transition-colors ${
                  selectedPaymentType === item.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-[#f0ebe1] hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge type="payment" value={item.type as any} size="sm" />
                </div>
                <p className="text-2xl font-bold text-[#1a1a1a]">{item.count}회</p>
              </div>
            ))}
          </div>
        </div>

        {/* 레슨 목록 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">레슨 목록</h3>
            {(selectedLessonType || selectedPaymentType) && (
              <button
                onClick={() => {
                  setSelectedLessonType(null)
                  setSelectedPaymentType(null)
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                필터 전체 해제
              </button>
            )}
          </div>
          {loading ? (
            <div className="bg-white border border-[#f0ebe1] rounded-lg p-8 text-center text-sm text-[#7a6f61]">
              레슨을 불러오는 중입니다...
            </div>
          ) : error ? (
            <div className="bg-white border border-red-200 rounded-lg p-8 text-center text-sm text-red-600">
              {error}
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="bg-white border border-[#f0ebe1] rounded-lg p-8 text-center">
              <p className="text-[#7a6f61]">해당 기간에 완료된 레슨이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => openModal(lesson)}
                  className="bg-white border border-[#f0ebe1] rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-[#7a6f61]">
                      {formatDate(lesson.date)}
                    </span>
                    <span className="text-sm font-semibold text-[#1a1a1a]">
                      {lesson.startTime} - {lesson.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <LessonTypeBadge type={lesson.type} />
                    <StatusBadge type="payment" value={lesson.paymentType as any} size="sm" />
                  </div>
                  {lesson.members.length > 0 && (
                    <div className="text-sm text-[#7a6f61]">
                      참여 회원: {lesson.members.map((m) => m.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 레슨 상세 모달 */}
      {selectedLesson && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/50" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">
                {formatDate(selectedLesson.date)}
              </h2>
              <button
                onClick={closeModal}
                className="text-[#7a6f61] hover:text-[#1a1a1a] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  {selectedLesson.startTime} - {selectedLesson.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <LessonTypeBadge type={selectedLesson.type} />
                <StatusBadge type="payment" value={selectedLesson.paymentType as any} size="sm" />
              </div>
              {selectedLesson.members.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-[#1a1a1a] mb-3">참여 회원</h4>
                  <div className="space-y-2">
                    {selectedLesson.members.map((member, idx) => (
                      <div
                        key={member.memberId || idx}
                        className="flex items-center justify-between p-3 border border-[#f0ebe1] rounded-lg bg-white"
                      >
                        <div>
                          <span className="text-[#1a1a1a] font-medium">{member.name}</span>
                          {member.phone && (
                            <span className="text-sm text-[#7a6f61] ml-2">({member.phone})</span>
                          )}
                        </div>
                        {member.paymentType && (
                          <StatusBadge 
                            type="payment" 
                            value={member.paymentType as any} 
                            size="sm" 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#7a6f61]">
                  <p className="text-sm">참여 회원이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

