'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import LessonCard from '@/components/common/LessonCard'
import EmptyState from '@/components/common/EmptyState'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'

// ==================== 타입 정의 ====================
type Lesson = {
  id: string
  date: string
  time: string
  classType: 'intro' | 'personal' | 'duet' | 'group'
  classTypeName: string
  paymentType: 'trial' | 'regular' | 'instructor' | 'center'
  paymentTypeName: string
  instructor: string
  room: string
  status: 'scheduled' | 'completed' | 'cancelled'
  members: string[]
  totalMembers: number
}

// ==================== 메인 컴포넌트 ====================
export default function MemberSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [weekScheduled, setWeekScheduled] = useState(0)
  const [remainingSessions, setRemainingSessions] = useState(0)

  // 회원 이름
  const memberName = '홍길동'

  useEffect(() => {
    loadLessons()
    loadStats()
  }, [currentDate])

  // 레슨 데이터 로드
  const loadLessons = async () => {
    setLoading(true)
    try {
      // TODO: 실제 API 호출로 교체
      // const { data, error } = await supabase
      //   .from('lessons')
      //   .select('*')
      //   .eq('date', formatDate(currentDate))
      //   .eq('member_id', memberId)
      
      // 더미 데이터
      setTimeout(() => {
        const dummyLessons: Lesson[] = [
          {
            id: '1',
            date: formatDate(currentDate),
            time: '10:00',
            classType: 'personal',
            classTypeName: '개인레슨',
            paymentType: 'regular',
            paymentTypeName: '정규수업',
            instructor: '김강사',
            room: 'A룸',
            status: 'completed',
            members: [memberName],
            totalMembers: 1
          },
          {
            id: '2',
            date: formatDate(currentDate),
            time: '14:00',
            classType: 'group',
            classTypeName: '그룹레슨',
            paymentType: 'regular',
            paymentTypeName: '정규수업',
            instructor: '이강사',
            room: 'B룸',
            status: 'scheduled',
            members: [memberName, '김철수', '박영희', '이민수', '최수진', '정다은'],
            totalMembers: 6
          },
          {
            id: '3',
            date: formatDate(currentDate),
            time: '19:00',
            classType: 'group',
            classTypeName: '그룹레슨',
            paymentType: 'regular',
            paymentTypeName: '정규수업',
            instructor: '박강사',
            room: 'A룸',
            status: 'scheduled',
            members: [memberName, '홍길순', '김영수', '이수지'],
            totalMembers: 4
          }
        ]
        setLessons(dummyLessons)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('레슨 로드 실패:', error)
      setLoading(false)
    }
  }

  // 통계 데이터 로드
  const loadStats = async () => {
    try {
      // TODO: 실제 API 호출로 교체
      setWeekScheduled(3)
      setRemainingSessions(12)
    } catch (error) {
      console.error('통계 로드 실패:', error)
    }
  }

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 날짜 변경
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate)
  }

  // 캘린더 날짜 변경
  const changeMonth = (months: number) => {
    const newDate = new Date(calendarDate)
    newDate.setMonth(newDate.getMonth() + months)
    setCalendarDate(newDate)
  }

  // 캘린더 날짜 선택
  const selectDate = (day: number) => {
    const newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)
    setCurrentDate(newDate)
    setCalendarDate(newDate)
  }

  // 출석 체크
  const checkAttendance = (lessonId: string) => {
    // TODO: 실제 출석 체크 로직 구현
    alert('출석 체크되었습니다!\n(실제로는 출석 확인 페이지로 이동하거나 QR 스캔)')
    
    // 상태 업데이트 시뮬레이션
    setLessons(prev => prev.map(lesson => 
      lesson.id === lessonId 
        ? { ...lesson, status: 'completed' as const }
        : lesson
    ))
  }

  // 로딩 상태
  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      {/* 헤더 */}
      <Header />

      {/* 메인 콘텐츠 */}
      <div className="max-w-2xl mx-auto pb-20 px-5">
        {/* 오늘의 요약 카드 */}
        <TodaySummary
          date={currentDate}
          weekScheduled={weekScheduled}
          remainingSessions={remainingSessions}
        />

        {/* 캘린더 */}
        <Calendar
          currentDate={calendarDate}
          selectedDate={currentDate}
          onMonthChange={changeMonth}
          onDateSelect={selectDate}
          lessonDays={[16, 18, 20, 22, 25, 27, 29]} // TODO: 실제 레슨 날짜로 교체
        />

        {/* 레슨 목록 */}
        <LessonList
          date={currentDate}
          lessons={lessons}
          memberName={memberName}
          onCheckAttendance={checkAttendance}
        />
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
    </div>
  )
}

// ==================== 오늘의 요약 카드 ====================
function TodaySummary({ 
  date, 
  weekScheduled, 
  remainingSessions 
}: { 
  date: Date
  weekScheduled: number
  remainingSessions: number
}) {
  const formatSummaryDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date)
  }

  return (
    <div className="bg-white border border-[#f0ebe1] rounded-xl p-5 mb-4 mt-5">
      <div className="text-sm text-[#7a6f61] mb-2 font-medium">
        {formatSummaryDate(date)}
      </div>
      <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">
        오늘의 일정
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-[10px] p-4">
          <div className="text-xs text-[#7a6f61] mb-1.5 font-medium">
            이번 주 예정
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-[#1a1a1a]">{weekScheduled}</span>
            <span className="text-sm font-medium text-[#7a6f61] ml-1">회</span>
          </div>
        </div>
        
        <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-[10px] p-4">
          <div className="text-xs text-[#7a6f61] mb-1.5 font-medium">
            잔여 레슨
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-[#1a1a1a]">{remainingSessions}</span>
            <span className="text-sm font-medium text-[#7a6f61] ml-1">회</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== 캘린더 컴포넌트 ====================
function Calendar({
  currentDate,
  selectedDate,
  onMonthChange,
  onDateSelect,
  lessonDays
}: {
  currentDate: Date
  selectedDate: Date
  onMonthChange: (months: number) => void
  onDateSelect: (day: number) => void
  lessonDays: number[]
}) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const today = new Date()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  
  // 빈 칸 + 날짜 배열 생성
  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  return (
    <div className="bg-white border border-[#f0ebe1] rounded-xl p-5 mb-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1a1a1a]">
          {year}년 {month + 1}월
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onMonthChange(-1)}
            className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => onMonthChange(1)}
            className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-semibold text-[#9d917f] py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />
          }

          const isToday = 
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
          
          const isSelected = 
            day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear()
          
          const hasLesson = lessonDays.includes(day)

          return (
            <button
              key={day}
              onClick={() => onDateSelect(day)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-[13px] font-medium
                transition-all relative
                ${isToday ? 'bg-[#f0ebe1] font-semibold' : ''}
                ${isSelected ? 'bg-blue-600 text-white font-semibold' : 'text-[#1a1a1a] hover:bg-[#f5f1e8]'}
              `}
            >
              {day}
              {hasLesson && !isSelected && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ==================== 레슨 목록 ====================
function LessonList({
  date,
  lessons,
  memberName,
  onCheckAttendance
}: {
  date: Date
  lessons: Lesson[]
  memberName: string
  onCheckAttendance: (id: string) => void
}) {
  const formatListDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()]
    return `${month}월 ${day}일 (${weekday})`
  }

  return (
    <div className="bg-white border border-[#f0ebe1] rounded-xl p-5">
      <h3 className="text-base font-semibold text-[#1a1a1a] mb-4">
        {formatListDate(date)}
      </h3>

      {lessons.length === 0 ? (
        <EmptyState
          icon="📅"
          title="예정된 레슨이 없습니다"
          description="다른 날짜를 선택해보세요"
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            // 참가자 정보
            let participantsText = memberName
            if (lesson.totalMembers > 1) {
              participantsText += ` 외 ${lesson.totalMembers - 1}명`
            }

            return (
              <div
                key={lesson.id}
                className="border border-[#f0ebe1] rounded-lg p-4"
              >
                {/* 상단: 시간, 타입, 상태 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-[#1a1a1a]">
                    {lesson.time}
                  </span>
                  <span className={`
                    px-2 py-0.5 rounded-md text-xs font-medium text-white
                    ${lesson.classType === 'intro' ? 'bg-gray-400' : ''}
                    ${lesson.classType === 'personal' ? 'bg-purple-500' : ''}
                    ${lesson.classType === 'duet' ? 'bg-pink-500' : ''}
                    ${lesson.classType === 'group' ? 'bg-orange-500' : ''}
                  `}>
                    {lesson.classTypeName}
                  </span>
                  <span className={`
                    px-2 py-0.5 rounded-md text-xs font-medium ml-auto
                    ${lesson.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : ''}
                    ${lesson.status === 'completed' ? 'bg-green-50 text-green-600' : ''}
                    ${lesson.status === 'cancelled' ? 'bg-red-50 text-red-600' : ''}
                  `}>
                    {lesson.status === 'scheduled' ? '예정' : ''}
                    {lesson.status === 'completed' ? '완료' : ''}
                    {lesson.status === 'cancelled' ? '취소' : ''}
                  </span>
                </div>

                {/* 정보 */}
                <div className="text-sm text-[#7a6f61] mb-2">
                  {lesson.instructor} · {lesson.room}
                </div>

                {/* 참가자 */}
                <div className="text-sm text-[#1a1a1a] mb-3">
                  {participantsText}
                </div>

                {/* 출석 상태/버튼 */}
                {lesson.status === 'completed' && (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    출석 완료
                  </div>
                )}
                
                {lesson.status === 'scheduled' && (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => onCheckAttendance(lesson.id)}
                  >
                    ✓ 출석 체크
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
