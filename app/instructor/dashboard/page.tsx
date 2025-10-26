'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import StatusBadge from '@/components/common/StatusBadge'
import Loading from '@/components/common/Loading'

// 타입 정의
type LessonMember = {
  memberId: string
  memberName: string
  attended: boolean | null
}

type Lesson = {
  id: string
  date: string
  time: string
  classType: string
  paymentType: string
  members: LessonMember[]
  status: 'scheduled' | 'completed'
}

// 캘린더 컴포넌트
function Calendar({ 
  value, 
  onChange,
  lessonDates
}: { 
  value: Date
  onChange: (date: Date) => void
  lessonDates: string[]
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

  const hasLesson = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return lessonDates.includes(dateStr)
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:border-gray-900 hover:text-gray-900 text-gray-600 transition-colors"
        >
          ←
        </button>
        <div className="font-semibold text-gray-900">
          {year}년 {month + 1}월
        </div>
        <button 
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:border-gray-900 hover:text-gray-900 text-gray-600 transition-colors"
        >
          →
        </button>
      </div>
      
      {/* 요일 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div 
            key={day}
            className={`
              text-center text-xs font-semibold py-2
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
                    ? 'bg-gray-900 text-white' 
                    : isToday(day)
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {day}
                {hasLesson(day) && (
                  <div className={`
                    absolute bottom-1 left-1/2 transform -translate-x-1/2
                    w-1 h-1 rounded-full
                    ${isSelected(day) ? 'bg-white' : 'bg-gray-900'}
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
function LessonCard({ 
  lesson, 
  onComplete 
}: { 
  lesson: Lesson
  onComplete: (lessonId: string) => void
}) {
  const allAttended = lesson.members.every(m => m.attended === true)
  const isCompleted = lesson.status === 'completed'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* 시간 + 레슨 타입 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-lg font-bold text-gray-900">{lesson.time}</div>
        <StatusBadge type="class" value={lesson.classType} size="sm" />
        <StatusBadge type="payment" value={lesson.paymentType} size="sm" />
      </div>

      {/* 회원 태그 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {lesson.members.map((member) => (
          <span 
            key={member.memberId}
            className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border
              ${member.attended === true 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : member.attended === false
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-gray-50 text-gray-700 border-gray-200'
              }
            `}
          >
            <span className={`
              w-1.5 h-1.5 rounded-full
              ${member.attended === true 
                ? 'bg-green-500' 
                : member.attended === false
                ? 'bg-red-500'
                : 'bg-gray-400'
              }
            `} />
            {member.memberName}
          </span>
        ))}
      </div>

      {/* 수업 완료 버튼 */}
      {!isCompleted && (
        <button
          onClick={() => onComplete(lesson.id)}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          수업 완료
        </button>
      )}

      {isCompleted && (
        <div className="w-full py-2.5 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg text-center">
          ✓ 수업 완료
        </div>
      )}
    </div>
  )
}

export default function InstructorDashboardPage() {
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
      // instructor_id로 필터링해서 담당 레슨만 가져오기
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockLessons: Lesson[] = [
        {
          id: '1',
          date: '2025-01-20',
          time: '10:00',
          classType: '개인레슨',
          paymentType: '정규수업',
          members: [
            { memberId: '1', memberName: '홍길동', attended: true }
          ],
          status: 'completed'
        },
        {
          id: '2',
          date: '2025-01-20',
          time: '14:00',
          classType: '그룹레슨',
          paymentType: '정규수업',
          members: [
            { memberId: '2', memberName: '김철수', attended: null },
            { memberId: '3', memberName: '박영희', attended: null },
            { memberId: '4', memberName: '이민수', attended: null }
          ],
          status: 'scheduled'
        },
        {
          id: '3',
          date: '2025-01-20',
          time: '16:00',
          classType: '듀엣레슨',
          paymentType: '센터제공',
          members: [
            { memberId: '5', memberName: '박민정', attended: null },
            { memberId: '6', memberName: '이현우', attended: null }
          ],
          status: 'scheduled'
        }
      ]
      
      setLessons(mockLessons)
    } catch (error) {
      console.error('❌ 레슨 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteLesson = async (lessonId: string) => {
    if (!confirm('수업을 완료하시겠습니까?\n모든 회원이 출석 처리됩니다.')) {
      return
    }

    try {
      // TODO: Supabase 업데이트
      // 1. classes 테이블: status = 'completed'
      // 2. class_members 테이블: attended = true
      // 3. membership_packages 테이블: remaining_lessons 차감
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 로컬 상태 업데이트
      setLessons(prev => prev.map(lesson => {
        if (lesson.id === lessonId) {
          return {
            ...lesson,
            status: 'completed' as const,
            members: lesson.members.map(m => ({ ...m, attended: true }))
          }
        }
        return lesson
      }))

      alert('수업이 완료되었습니다!')
    } catch (error) {
      console.error('❌ 수업 완료 오류:', error)
      alert('수업 완료에 실패했습니다.')
    }
  }

  // 선택된 날짜의 레슨 필터링
  const selectedDateString = selectedDate.toISOString().split('T')[0]
  const todayLessons = lessons.filter(lesson => lesson.date === selectedDateString)

  // 레슨이 있는 날짜 목록
  const lessonDates = [...new Set(lessons.map(lesson => lesson.date))]

  // 오늘의 통계
  const totalLessons = todayLessons.length
  const completedLessons = todayLessons.filter(l => l.status === 'completed').length

  if (!profile) {
    return <Loading text="로딩 중..." />
  }

  return (
    <>
      <Header profile={profile} />
      
      <main className="pb-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* 오늘의 요약 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm font-medium text-gray-600 mb-2">
              {selectedDate.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              오늘의 일정
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 font-medium mb-2">
                  오늘 레슨 수
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalLessons}<span className="text-sm font-medium text-gray-600 ml-1">개</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 font-medium mb-2">
                  완료된 레슨
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {completedLessons}<span className="text-sm font-medium text-gray-600 ml-1">개</span>
                </div>
              </div>
            </div>
          </div>

          {/* 캘린더 */}
          <Calendar 
            value={selectedDate} 
            onChange={setSelectedDate}
            lessonDates={lessonDates}
          />

          {/* 오늘의 레슨 목록 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}의 레슨
            </h3>

            {loading ? (
              <Loading />
            ) : todayLessons.length > 0 ? (
              <div className="space-y-3">
                {todayLessons.map(lesson => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onComplete={handleCompleteLesson}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                선택한 날짜에 예정된 레슨이 없습니다
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNavigation profile={profile} />
    </>
  )
}
