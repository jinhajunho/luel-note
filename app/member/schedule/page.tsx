'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import StatusBadge from '@/components/common/StatusBadge'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'

// 타입 정의
type Lesson = {
  id: string
  date: string
  time: string
  classType: string
  paymentType: string
  instructor: string
  status: 'scheduled' | 'completed' | 'cancelled'
  attended: boolean | null
}

// 캘린더 컴포넌트
function Calendar({ 
  value, 
  onChange,
  lessonDates
}: { 
  value: Date
  onChange: (date: Date) => void
  lessonDates: number[]
}) {
  const year = value.getFullYear()
  const month = value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const days: (number | null)[] = []
  
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  const prevMonth = () => onChange(new Date(year, month - 1, 1))
  const nextMonth = () => onChange(new Date(year, month + 1, 1))
  const selectDate = (day: number) => onChange(new Date(year, month, day))
  
  const today = new Date()
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }
  
  const isSelected = (day: number) => {
    return (
      day === value.getDate() &&
      month === value.getMonth() &&
      year === value.getFullYear()
    )
  }

  const hasLesson = (day: number) => lessonDates.includes(day)
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="font-bold text-gray-900">
          {year}년 {month + 1}월
        </div>
        <button 
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* 요일 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div 
            key={day}
            className={`
              text-center text-xs font-bold py-2
              ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}
            `}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <div key={idx} className="aspect-square">
            {day ? (
              <button
                onClick={() => selectDate(day)}
                className={`
                  w-full h-full rounded-lg text-sm font-medium transition-colors relative
                  ${isSelected(day) 
                    ? 'bg-blue-600 text-white' 
                    : isToday(day)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {day}
                {hasLesson(day) && (
                  <div className={`
                    absolute bottom-1 left-1/2 transform -translate-x-1/2
                    w-1 h-1 rounded-full
                    ${isSelected(day) ? 'bg-white' : 'bg-blue-600'}
                  `} />
                )}
              </button>
            ) : (
              <div />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// 레슨 카드
function LessonCard({ lesson }: { lesson: Lesson }) {
  const statusConfig = {
    scheduled: { text: '예정', color: 'text-blue-600' },
    completed: { text: '완료', color: 'text-gray-500' },
    cancelled: { text: '취소', color: 'text-red-600' }
  }

  const attendanceConfig = {
    true: { text: '출석 완료', color: 'bg-green-100 text-green-700' },
    false: { text: '결석', color: 'bg-red-100 text-red-700' },
    null: { text: '출석 대기', color: 'bg-blue-100 text-blue-700' }
  }

  const config = statusConfig[lesson.status]
  const attendanceStatus = attendanceConfig[String(lesson.attended) as 'true' | 'false' | 'null']

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* 헤더: 시간 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-gray-900">{lesson.time}</span>
        </div>
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>

      {/* 레슨 유형 + 결제 타입 */}
      <div className="flex items-center gap-2 mb-3">
        <StatusBadge type="class" value={lesson.classType} size="sm" />
        <StatusBadge type="payment" value={lesson.paymentType} size="sm" />
      </div>

      {/* 강사 */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-sm text-gray-600">{lesson.instructor}</span>
      </div>

      {/* 출석 상태 */}
      {lesson.status === 'completed' && (
        <div className={`
          inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
          ${attendanceStatus.color}
        `}>
          {lesson.attended ? '✓' : '✗'} {attendanceStatus.text}
        </div>
      )}
    </div>
  )
}

// 메인 컴포넌트
export default function MemberSchedulePage() {
  const { profile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadLessons()
    }
  }, [profile, selectedDate])

  const loadLessons = async () => {
    try {
      setLoading(true)
      
      // TODO: Supabase에서 데이터 로드
      // 지금은 목 데이터
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockLessons: Lesson[] = [
        {
          id: '1',
          date: '2025-01-20',
          time: '10:00',
          classType: '개인레슨',
          paymentType: '정규수업',
          instructor: '김강사',
          status: 'completed',
          attended: true
        },
        {
          id: '2',
          date: '2025-01-20',
          time: '14:00',
          classType: '그룹레슨',
          paymentType: '정규수업',
          instructor: '이강사',
          status: 'scheduled',
          attended: null
        }
      ]
      
      setLessons(mockLessons)
    } catch (error) {
      console.error('❌ 레슨 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 선택된 날짜의 레슨 필터링
  const selectedDateString = selectedDate.toISOString().split('T')[0]
  const todayLessons = lessons.filter(lesson => lesson.date === selectedDateString)

  // 레슨이 있는 날짜 추출 (캘린더 표시용)
  const lessonDates = lessons
    .filter(lesson => {
      const lessonDate = new Date(lesson.date)
      return (
        lessonDate.getMonth() === selectedDate.getMonth() &&
        lessonDate.getFullYear() === selectedDate.getFullYear()
      )
    })
    .map(lesson => new Date(lesson.date).getDate())

  if (!profile) {
    return <Loading text="로딩 중..." />
  }

  return (
    <>
      <Header profile={profile} />
      
      <main className="pb-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* 페이지 제목 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">내 일정</h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedDate.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>

          {/* 캘린더 */}
          <Calendar 
            value={selectedDate} 
            onChange={setSelectedDate}
            lessonDates={lessonDates}
          />

          {/* 레슨 목록 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              오늘의 레슨 {todayLessons.length > 0 && `(${todayLessons.length})`}
            </h3>

            {loading ? (
              <Loading />
            ) : todayLessons.length > 0 ? (
              <div className="space-y-3">
                {todayLessons.map(lesson => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="예정된 레슨이 없습니다"
                description="선택하신 날짜에 예약된 레슨이 없습니다."
              />
            )}
          </div>
        </div>
      </main>

      <BottomNavigation profile={profile} />
    </>
  )
}
