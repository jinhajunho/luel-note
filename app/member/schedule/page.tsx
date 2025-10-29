'use client'

import { useState } from 'react'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import Button from '@/components/common/Button'
import StatusBadge from '@/components/common/StatusBadge'

export default function MemberSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(15)
  const [currentMonth, setCurrentMonth] = useState({ month: 1, year: 2025 })

  // 레슨 데이터
  const lessons = [
    {
      id: 1,
      time: '10:00',
      type: '개인레슨',
      status: '예정',
      instructor: '김민지',
      room: 'A룸',
      participants: 1,
      maxParticipants: 1,
    },
    {
      id: 2,
      time: '14:00',
      type: '듀엣레슨',
      status: '예정',
      instructor: '박서연',
      room: 'B룸',
      participants: 2,
      maxParticipants: 2,
    },
    {
      id: 3,
      time: '16:30',
      type: '그룹레슨',
      status: '예정',
      instructor: '이지은',
      room: 'C룸',
      participants: 4,
      maxParticipants: 6,
    },
  ]

  // 레슨 있는 날짜
  const daysWithLessons = [12, 14, 15, 18, 20, 22, 25]

  // 캘린더 날짜 생성
  const generateCalendarDays = () => {
    const daysInMonth = 31
    const firstDayOfWeek = 3 // 수요일
    const days = []

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  const checkAttendance = (lessonId: number) => {
    alert('출석 체크되었습니다!')
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      {/* 공통 헤더 */}
      <Header />

      <main className="max-w-2xl mx-auto px-5 py-6 pb-24 space-y-6">
        {/* 오늘의 요약 카드 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5">
          <div className="mb-4">
            <p className="text-sm text-[#7a6f61]">오늘</p>
            <p className="text-lg font-semibold text-[#1a1a1a]">2025년 1월 15일 수요일</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-4">
              <p className="text-sm text-[#7a6f61] mb-1">이번 주 예정</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">3회</p>
            </div>
            <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-4">
              <p className="text-sm text-[#7a6f61] mb-1">잔여 레슨</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">12회</p>
            </div>
          </div>
        </div>

        {/* 캘린더 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">
              {currentMonth.year}년 {currentMonth.month}월
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentMonth((prev) => ({
                    ...prev,
                    month: prev.month === 1 ? 12 : prev.month - 1,
                    year: prev.month === 1 ? prev.year - 1 : prev.year,
                  }))
                }
                className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setCurrentMonth((prev) => ({
                    ...prev,
                    month: prev.month === 12 ? 1 : prev.month + 1,
                    year: prev.month === 12 ? prev.year + 1 : prev.year,
                  }))
                }
                className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
              >
                ›
              </button>
            </div>
          </div>

          {/* 캘린더 그리드 */}
          <div className="space-y-2">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-[#9d917f] py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => day && setSelectedDate(day)}
                  disabled={!day}
                  className={`
                    relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium
                    transition-colors
                    ${!day ? 'invisible' : ''}
                    ${day === 15 ? 'bg-[#f0ebe1] font-semibold' : ''}
                    ${day === selectedDate ? 'bg-blue-600 text-white font-semibold' : 'text-[#1a1a1a] hover:bg-[#f5f1e8]'}
                  `}
                >
                  {day}
                  {day && daysWithLessons.includes(day) && day !== selectedDate && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 레슨 목록 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1a1a1a] px-1">오늘의 레슨</h2>
          {lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white border border-[#f0ebe1] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-semibold text-[#1a1a1a]">{lesson.time}</span>
                <StatusBadge type="class" value={lesson.type} />
                <StatusBadge type="status" value={lesson.status} />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-[#7a6f61]">
                  {lesson.instructor} · {lesson.room}
                </p>
                <p className="text-sm text-[#1a1a1a]">
                  참가자: {lesson.participants}/{lesson.maxParticipants}명
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => checkAttendance(lesson.id)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                출석 체크
              </Button>
            </div>
          ))}
        </div>
      </main>

      {/* 공통 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  )
}
