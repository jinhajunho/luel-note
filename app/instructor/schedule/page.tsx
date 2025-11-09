"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { LessonStatusBadge, LessonTypeBadge } from '@/components/common/LessonBadges'
import { useAuth } from '@/lib/auth-context'
import { getAllClasses } from '@/app/actions/classes'
import { getInstructorMembers } from '@/app/actions/members'
import { formatInstructorName } from '@/lib/utils/text'

type LessonStatusName = '예정' | '완료' | '취소'
type LessonTypeName = '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'

type LessonMember = {
  id: string
  name: string
  attended: boolean | null
}

type Lesson = {
  id: string
  date: string
  startTime: string
  endTime: string
  type: LessonTypeName
  status: LessonStatusName
  instructor: string
  members: LessonMember[]
}

type InstructorMember = {
  id: string
  name: string
  phone: string
  status: 'active' | 'inactive'
  type: 'member' | 'guest'
  joinDate: string
  remainingLessons: number
  totalLessons: number
  notes?: string | null
}

export default function InstructorSchedulePage() {
  const today = new Date()
  const { profile, loading: authLoading } = useAuth()

  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [filter] = useState("전체")
  const [statusFilter, setStatusFilter] = useState<'전체' | '예정' | '완료' | '취소'>("전체")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLessonId, setModalLessonId] = useState<string | null>(null)

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [members, setMembers] = useState<InstructorMember[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isInstructorContext = profile && (profile.role === 'instructor' || profile.role === 'admin')
  const instructorId = isInstructorContext ? profile?.id ?? null : null
  const instructorName = profile?.name ? formatInstructorName(profile.name) : ''

  const loadData = useCallback(async () => {
    if (!instructorId) {
      setLessons([])
      setMembers([])
      setLoadingData(false)
      return
    }

    setLoadingData(true)
    setError(null)

    try {
      const [classesResult, membersResult] = await Promise.all([
        getAllClasses(),
        getInstructorMembers(instructorId),
      ])

      if (classesResult.success && classesResult.data) {
        const mapped = classesResult.data
          .filter((lesson) => lesson.instructorId === instructorId)
          .map((lesson) => ({
            id: lesson.id,
            date: lesson.date,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
            type: lesson.type as LessonTypeName,
            status: lesson.status as LessonStatusName,
            instructor: instructorName,
            members: lesson.members.map((member, index) => ({
              id: member.memberId || `member-${lesson.id}-${index}`,
              name: member.name,
              attended: member.attended ?? null,
            })),
          }))
          .sort((a, b) => {
            const aDate = new Date(`${a.date}T${a.startTime}:00`)
            const bDate = new Date(`${b.date}T${b.startTime}:00`)
            return aDate.getTime() - bDate.getTime()
          })

        setLessons(mapped)
      } else {
        setLessons([])
        if (classesResult.error) {
          setError(classesResult.error)
        }
      }

      if (membersResult.success && membersResult.data) {
        setMembers(membersResult.data)
      } else {
        setMembers([])
        if (membersResult.error) {
          setError((prev) => prev ?? membersResult.error ?? null)
        }
      }
    } catch (err) {
      console.error('강사 일정 데이터 로드 실패:', err)
      setLessons([])
      setMembers([])
      setError('일정 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoadingData(false)
    }
  }, [instructorId, instructorName])

  useEffect(() => {
    if (authLoading) return
    if (!isInstructorContext) {
      setLessons([])
      setMembers([])
      setError('강사 전용 페이지입니다.')
      setLoadingData(false)
      return
    }
    loadData()
  }, [authLoading, isInstructorContext, loadData])

  // 아래 코드는 임시 주석 처리 (목 데이터 제거)
  /*
  const tempLessons = [
    // 오늘 레슨
    {
      id: 1,
      date: getTodayString(),
      time: "10:00",
      type: "개인레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "홍길동", attended: null as boolean | null },
      ],
    },
    {
      id: 2,
      date: getTodayString(),
      time: "14:00",
      type: "듀엣레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "김철수", attended: null as boolean | null },
        { name: "박영희", attended: null as boolean | null },
      ],
    },
    {
      id: 3,
      date: getTodayString(),
      time: "16:30",
      type: "그룹레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "이민수", attended: null as boolean | null },
        { name: "최가영", attended: null as boolean | null },
        { name: "정수진", attended: null as boolean | null },
        { name: "조영호", attended: null as boolean | null },
      ],
    },
    // 어제 레슨 (완료)
    {
      id: 4,
      date: getDateString(-1),
      time: "09:00",
      type: "개인레슨",
      status: "완료",
      instructor: "김민지",
      members: [
        { name: "홍길동", attended: true as boolean | null },
      ],
    },
    {
      id: 5,
      date: getDateString(-1),
      time: "15:00",
      type: "듀엣레슨",
      status: "완료",
      instructor: "김민지",
      members: [
        { name: "김철수", attended: true as boolean | null },
        { name: "박영희", attended: true as boolean | null },
      ],
    },
    // 내일 레슨
    {
      id: 6,
      date: getDateString(1),
      time: "11:00",
      type: "개인레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "이민수", attended: null as boolean | null },
      ],
    },
    {
      id: 7,
      date: getDateString(1),
      time: "17:00",
      type: "그룹레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "최가영", attended: null as boolean | null },
        { name: "정수진", attended: null as boolean | null },
        { name: "조영호", attended: null as boolean | null },
        { name: "한소희", attended: null as boolean | null },
      ],
    },
    // 이번 주 다른 날들
    {
      id: 8,
      date: getDateString(2),
      time: "10:30",
      type: "개인레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "홍길동", attended: null as boolean | null },
      ],
    },
    {
      id: 9,
      date: getDateString(2),
      time: "14:30",
      type: "듀엣레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "김철수", attended: null as boolean | null },
        { name: "박영희", attended: null as boolean | null },
      ],
    },
    {
      id: 10,
      date: getDateString(3),
      time: "09:30",
      type: "인트로",
      status: "예정",
      instructor: "김민지",
      members: [],
    },
    {
      id: 11,
      date: getDateString(3),
      time: "15:00",
      type: "개인레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "이민수", attended: null as boolean | null },
      ],
    },
    {
      id: 12,
      date: getDateString(4),
      time: "11:00",
      type: "그룹레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "최가영", attended: null as boolean | null },
        { name: "정수진", attended: null as boolean | null },
        { name: "조영호", attended: null as boolean | null },
        { name: "한소희", attended: null as boolean | null },
      ],
    },
    {
      id: 13,
      date: getDateString(5),
      time: "10:00",
      type: "개인레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "홍길동", attended: null as boolean | null },
      ],
    },
    {
      id: 14,
      date: getDateString(5),
      time: "16:00",
      type: "듀엣레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "김철수", attended: null as boolean | null },
        { name: "박영희", attended: null as boolean | null },
      ],
    },
    // 이번 주 마지막
    {
      id: 15,
      date: getDateString(6),
      time: "13:00",
      type: "개인레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "이민수", attended: null as boolean | null },
      ],
    },
    {
      id: 16,
      date: getDateString(6),
      time: "17:30",
      type: "그룹레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "최가영", attended: null as boolean | null },
        { name: "정수진", attended: null as boolean | null },
        { name: "조영호", attended: null as boolean | null },
        { name: "한소희", attended: null as boolean | null },
      ],
    },
    // 다음 주
    {
      id: 17,
      date: getDateString(7),
      time: "10:00",
      type: "개인레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "홍길동", attended: null as boolean | null },
      ],
    },
    {
      id: 18,
      date: getDateString(8),
      time: "14:00",
      type: "듀엣레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "김철수", attended: null as boolean | null },
        { name: "박영희", attended: null as boolean | null },
      ],
    },
    {
      id: 19,
      date: getDateString(10),
      time: "11:30",
      type: "개인레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "이민수", attended: null as boolean | null },
      ],
    },
    {
      id: 20,
      date: getDateString(12),
      time: "15:30",
      type: "그룹레슨",
      status: "예정",
      instructor: "김민지",
      members: [
        { name: "최가영", attended: null as boolean | null },
        { name: "정수진", attended: null as boolean | null },
        { name: "조영호", attended: null as boolean | null },
        { name: "한소희", attended: null as boolean | null },
      ],
    },
  ])
  */

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

  // 선택한 날짜의 레슨 필터링
  const selectedDateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
  const todayLessons = lessons.filter((lesson) => lesson.date === selectedDateString)

  const filteredLessons = todayLessons.filter((l) => {
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

  // 레슨이 있는 날짜 계산 (선택한 월 기준)
  const getDaysWithLessons = () => {
    const monthLessons = lessons.filter((lesson) => {
      const lessonDate = new Date(`${lesson.date}T00:00:00`)
      return lessonDate.getFullYear() === currentYear && lessonDate.getMonth() + 1 === currentMonth
    })
    return [...new Set(monthLessons.map((lesson) => new Date(`${lesson.date}T00:00:00`).getDate()))]
  }
  const daysWithLessonsInMonth = getDaysWithLessons()

  // 이번 주 예정 레슨 수 계산
  const thisWeekLessons = (() => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0(일) ~ 6(토)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek) // 이번 주 월요일
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // 이번 주 일요일
    weekEnd.setHours(23, 59, 59, 999)

    return lessons.filter((lesson) => {
      const lessonDate = new Date(`${lesson.date}T12:00:00`)
      return lessonDate >= weekStart && lessonDate <= weekEnd && lesson.status === '예정'
    }).length
  })()

  const renderCalendar = () => {
    const total = daysInMonth(currentYear, currentMonth)
    const start = firstDayOfWeek(currentYear, currentMonth)
    const cells = []

    for (let i = 0; i < start; i++) {
      cells.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    for (let d = 1; d <= total; d++) {
      const isSelected = d === selectedDay
      const hasLesson = daysWithLessonsInMonth.includes(d)

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
            <p className="text-sm text-[#7a6f61] mb-1">내 담당 회원</p>
            <p className="text-2xl font-bold text-[#1a1a1a]">{members.length}명</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

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
          <h2 className="text-lg font-semibold text-[#1a1a1a]">
            {new Date(selectedDateString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} 레슨
          </h2>
        </div>
        <div className="space-y-3">
          {filteredLessons.length === 0 ? (
            <div className="bg-white border border-[#f0ebe1] rounded-lg p-8 text-center text-[#7a6f61]">
              {loadingData ? '레슨 정보를 불러오는 중입니다...' : '선택한 날짜에 예정된 레슨이 없습니다'}
            </div>
          ) : (
            filteredLessons.map((lesson) => (
              <div 
                key={lesson.id} 
                onClick={() => openModal(lesson.id)}
                className="bg-white border border-[#f0ebe1] rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-semibold text-[#1a1a1a]">
                    {lesson.startTime} ~ {lesson.endTime}
                  </span>
                  <LessonTypeBadge type={lesson.type as any} />
                  <LessonStatusBadge status={lesson.status as any} />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[#7a6f61]">{lesson.instructor} 강사</p>
                  {lesson.members.length > 0 && (
                    <p className="text-sm text-[#7a6f61]">
                      참여 회원: {lesson.members.map(m => m.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
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
                {currentLesson.startTime} ~ {currentLesson.endTime} · {currentLesson.type}
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
              {currentLesson.members.length === 0 ? (
                <div className="text-center py-8 text-[#7a6f61]">
                  <p className="text-sm">참여 회원이 없습니다</p>
                  {currentLesson.type === '인트로' && (
                    <p className="text-xs mt-2 text-[#7a6f61]">인트로 레슨은 회원 없이 진행됩니다</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentLesson.members.map((member, idx) => {
                    const isPresent = member.attended === true
                    const statusText = isPresent ? "출석" : ""
                    const statusClass = isPresent ? "text-green-700" : "text-[#7a6f61]"
                    const btnLabel = isPresent ? "출석 취소" : "출석"
                    const btnClass = isPresent
                      ? "px-3 py-2 text-sm min-h-[36px] font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "px-3 py-2 text-sm min-h-[36px] font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border border-[#f0ebe1] rounded-lg bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-[#1a1a1a] font-medium">{member.name}</div>
                          {isPresent && (
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700`}>
                              출석 완료
                            </span>
                          )}
                          {!isPresent && currentLesson.status === '완료' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                              결석
                            </span>
                          )}
                          {!isPresent && currentLesson.status === '예정' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-600">
                              미체크
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

