"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { LessonStatusBadge, LessonTypeBadge } from '@/components/common/LessonBadges'
import { useAuth } from '@/lib/auth-context'
import { getMemberIdByProfileId } from '@/app/actions/member-data'
import { getMemberClasses } from '@/app/actions/member-classes'
import { getMemberTotalRemaining } from '@/app/actions/membership'
import type { MemberClass } from '@/app/actions/member-classes'
import { formatInstructorName } from '@/lib/utils/text'
import { getBus } from '@/lib/bus'

export default function MemberSchedulePage() {
  const today = new Date()
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [filter, setFilter] = useState("전체")
  const [statusFilter, setStatusFilter] = useState<'전체' | '예정' | '완료' | '취소'>("전체")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLessonId, setModalLessonId] = useState<string | null>(null)
  const [lessons, setLessons] = useState<MemberClass[]>([])
  const [remainingLessons, setRemainingLessons] = useState(0)
  const [loading, setLoading] = useState(true)

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

  // 회원 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return
      if (profile.role !== 'member') return // 회원만 데이터 로드
      
      try {
        setLoading(true)
        // 회원 ID 가져오기
        const memberId = await getMemberIdByProfileId(profile.id)
        if (!memberId) {
          console.warn('회원 정보를 찾을 수 없습니다.')
          setLessons([])
          setRemainingLessons(0)
          setLoading(false)
          return
        }

        // 레슨 데이터 가져오기
        const memberLessons = await getMemberClasses(memberId)
        setLessons(memberLessons)

        // 잔여 레슨 수 가져오기
        const remaining = await getMemberTotalRemaining(memberId)
        setRemainingLessons(remaining)
      } catch (error) {
        console.error('데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [profile])

  // Cross-tab sync: class/attendance updates
  useEffect(() => {
    const bus = getBus()
    if (!bus) return
    const reload = () => {
      // 간단히 현재 페이지 전체를 새로 데이터 로드
      if (profile?.id && profile.role === 'member') {
        // 재호출을 위해 강제로 상태 변경 트리거
        (async () => {
          try {
            const memberId = await getMemberIdByProfileId(profile.id!)
            if (!memberId) return
            const memberLessons = await getMemberClasses(memberId)
            setLessons(memberLessons)
          } catch (e) {
            // no-op
          }
        })()
      }
    }
    const onMessage = (e: MessageEvent) => {
      const data = e.data
      if (!data || typeof data !== 'object') return
      if (data.type === 'class-updated' || data.type === 'attendance-updated') {
        reload()
      }
    }
    bus.addEventListener('message', onMessage as EventListener)
    return () => bus.removeEventListener('message', onMessage as EventListener)
  }, [profile])

  // 레슨이 있는 날짜 추출
  const daysWithLessons = lessons
    .filter(lesson => {
      const lessonDate = new Date(lesson.date)
      return lessonDate.getFullYear() === currentYear && 
             lessonDate.getMonth() + 1 === currentMonth
    })
    .map(lesson => new Date(lesson.date).getDate())
    .filter((value, index, self) => self.indexOf(value) === index) // 중복 제거

  // 선택한 날짜의 레슨 필터링
  const selectedDateLessons = lessons.filter((lesson) => {
    const lessonDate = new Date(lesson.date)
    return lessonDate.getFullYear() === currentYear &&
           lessonDate.getMonth() + 1 === currentMonth &&
           lessonDate.getDate() === selectedDay
  })

  // 이번 주 예정 레슨 수 계산
  const thisWeekLessons = lessons.filter((lesson) => {
    const lessonDate = new Date(lesson.date)
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6))
    return lessonDate >= startOfWeek && lessonDate <= endOfWeek && lesson.status === '예정'
  }).length

  const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()
  const firstDayOfWeek = (year: number, month: number) => new Date(year, month - 1, 1).getDay()

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const filteredLessons = selectedDateLessons.filter((l) => {
    const typeOk = filter === '전체' || l.type === filter
    const statusOk = statusFilter === '전체' || l.status === statusFilter
    return typeOk && statusOk
  })

  const openModal = (id: string) => {
    setModalLessonId(id)
    setModalOpen(true)
    document.body.style.overflow = "hidden"
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalLessonId(null)
    document.body.style.overflow = ""
  }

  const currentLesson = lessons.find((l) => l.id === modalLessonId)

  const renderCalendar = () => {
    const total = daysInMonth(currentYear, currentMonth)
    const start = firstDayOfWeek(currentYear, currentMonth)
    const cells = []

    for (let i = 0; i < start; i++) {
      cells.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let d = 1; d <= total; d++) {
      const isSelected = d === selectedDay
      const hasLesson = daysWithLessons.includes(d)

      cells.push(
        <button
          key={d}
          onClick={() => setSelectedDay(d)}
          className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors ${
            isSelected ? "bg-blue-600 text-white font-semibold" : "text-[#1a1a1a] hover:bg-[#f5f1e8]"
          }`}
        >
          {d}
          {hasLesson && !isSelected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-600" />}
        </button>,
      )
    }

    return cells
  }

  // filter options no longer used in UI

  return (
    <div className="px-5 py-6 pb-24 space-y-6">
        {/* Today Summary */}
        <section className="bg-white border border-[#f0ebe1] rounded-xl p-5">
          <div className="mb-4">
            <p className="text-sm text-[#7a6f61]">오늘</p>
            <p className="text-lg font-semibold text-[#1a1a1a]">
              {new Intl.DateTimeFormat("ko-KR", { dateStyle: "full" }).format(today)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-4">
              <p className="text-sm text-[#7a6f61] mb-1">이번 주 예정</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{thisWeekLessons}회</p>
            </div>
            <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-4">
              <p className="text-sm text-[#7a6f61] mb-1">잔여 레슨</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{remainingLessons}회</p>
            </div>
          </div>
        </section>

        {/* Calendar */}
        <section className="bg-white border border-[#f0ebe1] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">
              {currentYear}년 {currentMonth}월
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-[#7a6f61] py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
          </div>
        </section>

        {/* Lesson List */}
        <section className="space-y-3">
          <div className="px-1">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">오늘의 레슨</h2>
          </div>
          <div className="space-y-3">
            {filteredLessons.map((lesson) => {
              const attended = lesson.attended === true
              return (
                <div key={lesson.id} className="bg-white border border-[#f0ebe1] rounded-lg p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-[#1a1a1a]">{lesson.startTime}</span>
                      <LessonTypeBadge type={lesson.type as any} />
                      <LessonStatusBadge status={lesson.status as any} />
                    </div>
                    {attended && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm text-[#7a6f61]">{formatInstructorName(lesson.instructor)}</p>
                    {attended && lesson.checkInTime && (
                      <p className="text-xs text-green-600">출석 {lesson.checkInTime}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      {/* Modal */}
      {modalOpen && currentLesson && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentLesson.startTime} · {currentLesson.type}
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
                참여자
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="space-y-3">
                <div className="p-3 border border-[#f0ebe1] rounded-lg bg-white">
                  <div className="text-sm text-[#7a6f61] mb-2">레슨 정보</div>
                  <div className="text-[#1a1a1a] font-medium mb-1">날짜: {currentLesson.date}</div>
                  <div className="text-[#1a1a1a] font-medium mb-1">시간: {currentLesson.startTime} - {currentLesson.endTime}</div>
                  <div className="text-[#1a1a1a] font-medium mb-1">강사: {formatInstructorName(currentLesson.instructor)}</div>
                  <div className="text-[#1a1a1a] font-medium">결제 유형: {currentLesson.paymentType}</div>
                  {currentLesson.attended !== null && (
                    <div className="mt-2">
                      <span className={`text-xs ${currentLesson.attended ? 'text-green-700' : 'text-[#7a6f61]'}`}>
                        {currentLesson.attended ? '출석 완료' : '결석'}
                      </span>
                      {currentLesson.checkInTime && (
                        <span className="text-xs text-[#7a6f61] ml-2">({currentLesson.checkInTime})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}