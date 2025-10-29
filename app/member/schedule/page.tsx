'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import Button from '@/components/common/Button'
import StatusBadge from '@/components/common/StatusBadge'
import EmptyState from '@/components/common/EmptyState'
import Loading from '@/components/common/Loading'

// ==================== 타입 정의 ====================
type Lesson = {
  id: string
  date: string
  time: string
  classType: '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
  paymentType: '체험수업' | '정규수업' | '강사제공' | '센터제공'
  instructor: string
  room: string
  status: '예정' | '완료' | '취소'
  members: string[]
}

// ==================== 메인 컴포넌트 ====================
export default function MemberSchedulePage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [weekScheduled, setWeekScheduled] = useState(0)
  const [remainingSessions, setRemainingSessions] = useState(0)
  const [loading, setLoading] = useState(true)

  const memberName = '홍길동'

  useEffect(() => {
    loadLessons()
  }, [currentDate])

  const loadLessons = async () => {
    setLoading(true)
    // TODO: Supabase
    const mockData: Lesson[] = [
      {
        id: '1',
        date: '2025-10-22',
        time: '10:00',
        classType: '개인레슨',
        paymentType: '정규수업',
        instructor: '김강사',
        room: 'A룸',
        status: '완료',
        members: ['홍길동']
      },
      {
        id: '2',
        date: '2025-10-22',
        time: '14:00',
        classType: '그룹레슨',
        paymentType: '정규수업',
        instructor: '이강사',
        room: 'B룸',
        status: '예정',
        members: ['홍길동', '김철수', '이영희', '박민수', '최지은', '정다은']
      },
      {
        id: '3',
        date: '2025-10-22',
        time: '19:00',
        classType: '그룹레슨',
        paymentType: '정규수업',
        instructor: '박강사',
        room: 'A룸',
        status: '예정',
        members: ['홍길동', '김철수', '이영희', '박민수']
      }
    ]
    
    setTimeout(() => {
      setLessons(mockData)
      setWeekScheduled(3)
      setRemainingSessions(12)
      setLoading(false)
    }, 500)
  }

  // 캘린더 생성
  const generateCalendar = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    const today = new Date()
    
    const sessionDays = [16, 18, 20, 22, 25, 27, 29]

    const days = []
    
    // 빈 칸
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>)
    }
    
    // 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear()
      
      const isSelected = 
        day === currentDate.getDate() && 
        month === currentDate.getMonth() && 
        year === currentDate.getFullYear()
      
      const hasSession = sessionDays.includes(day)
      
      days.push(
        <div
          key={day}
          onClick={() => setCurrentDate(new Date(year, month, day))}
          className={`
            aspect-square flex items-center justify-center rounded-lg
            text-[13px] font-medium cursor-pointer transition-all relative
            ${isToday ? 'bg-[#f0ebe1] font-semibold' : ''}
            ${isSelected ? 'bg-[#1a1a1a] text-white font-semibold' : 'text-gray-900'}
            ${hasSession && !isSelected ? 'after:content-[""] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-[#1a1a1a] after:rounded-full' : ''}
            ${hasSession && isSelected ? 'after:content-[""] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-white after:rounded-full' : ''}
            ${!isSelected && !isToday ? 'hover:bg-[#f5f1e8]' : ''}
          `}
        >
          {day}
        </div>
      )
    }
    
    return days
  }

  // 출석 체크
  const checkAttendance = (id: string) => {
    alert('출석 체크되었습니다!')
    const updatedLessons = lessons.map(lesson =>
      lesson.id === id ? { ...lesson, status: '완료' as const } : lesson
    )
    setLessons(updatedLessons)
  }

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()]
    return `${month}월 ${day}일 (${weekday})`
  }

  const formatFullDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7]">
        <Header />
        <Loading />
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <Header />
      
      {/* 메인 컨텐츠 */}
      <div className="max-w-[672px] mx-auto px-5 py-5 pb-24">
        {/* 오늘의 요약 카드 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5 mb-4">
          <div className="text-sm text-[#7a6f61] mb-2 font-medium">
            {formatFullDate(new Date())}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            오늘의 스케줄
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-[10px] p-4">
              <div className="text-xs text-[#7a6f61] mb-1.5 font-medium">
                이번 주 예정
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {weekScheduled}
                <span className="text-sm font-medium text-[#7a6f61] ml-1">회</span>
              </div>
            </div>
            
            <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-[10px] p-4">
              <div className="text-xs text-[#7a6f61] mb-1.5 font-medium">
                잔여 레슨
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {remainingSessions}
                <span className="text-sm font-medium text-[#7a6f61] ml-1">회</span>
              </div>
            </div>
          </div>
        </div>

        {/* 캘린더 카드 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월
            </h3>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newDate = new Date(calendarDate)
                  newDate.setMonth(newDate.getMonth() - 1)
                  setCalendarDate(newDate)
                }}
                className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-sm text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-all font-semibold"
              >
                ←
              </button>
              
              <button
                onClick={() => {
                  const newDate = new Date(calendarDate)
                  newDate.setMonth(newDate.getMonth() + 1)
                  setCalendarDate(newDate)
                }}
                className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-sm text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-all font-semibold"
              >
                →
              </button>
            </div>
          </div>
          
          {/* 요일 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-center text-[11px] font-semibold text-[#9d917f] py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* 날짜 */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendar()}
          </div>
        </div>

        {/* 레슨 목록 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            {formatDate(currentDate)}
          </h2>
          
          {lessons.length === 0 ? (
            <EmptyState
              icon="📅"
              title="예정된 레슨이 없습니다"
            />
          ) : (
            <div className="space-y-3">
              {lessons.map(lesson => {
                let participantsText = memberName
                if (lesson.members.length > 1) {
                  participantsText += ` 외 ${lesson.members.length - 1}명`
                }
                
                return (
                  <div key={lesson.id} className="border border-[#f0ebe1] rounded-[10px] p-4">
                    {/* 상단: 시간, 타입, 상태 */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-sm font-semibold text-gray-900">
                        {lesson.time}
                      </div>
                      <StatusBadge type="class" value={lesson.classType} />
                      <StatusBadge type="status" value={lesson.status} className="ml-auto" />
                    </div>
                    
                    {/* 강사, 룸 */}
                    <div className="text-xs text-[#7a6f61] mb-2">
                      {lesson.instructor} · {lesson.room}
                    </div>
                    
                    {/* 참가자 */}
                    <div className="text-sm text-gray-900 mb-3">
                      {participantsText}
                    </div>
                    
                    {/* 액션 */}
                    {lesson.status === '완료' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#dcfce7] text-[#16a34a] text-sm font-medium">
                        ✓ 출석 완료
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        onClick={() => checkAttendance(lesson.id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        출석 체크
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
