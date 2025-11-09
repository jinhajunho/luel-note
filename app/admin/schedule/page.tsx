'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CalendarModal from '@/components/common/CalendarModal'
import { LessonTypeBadge } from '@/components/common/LessonBadges'
import StatusBadge from '@/components/common/StatusBadge'
import { getAllProfiles } from '@/app/actions/members'
import { getAllClasses } from '@/app/actions/classes'

// ==================== 타입 정의 ====================
type Instructor = {
  id: string
  name: string
}

import type { Lesson, ClassType } from '@/types/lesson'

type LessonType = {
  id: string
  name: string
  color: string // dot 색상 클래스
}

// ==================== 메인 컴포넌트 ====================
export default function AdminSchedulePage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null)

  // 시간대 (06:00 ~ 23:00)
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ]

  // 강사 목록 (실제 데이터로 로드)
  const [instructors, setInstructors] = useState<Instructor[]>([])

  // 강사 목록 로드
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const result = await getAllProfiles()
        
        if (result.success && result.data) {
          // role이 'instructor' 또는 'admin'인 프로필만 필터링
          const instructorList: Instructor[] = result.data
            .filter(p => p.role === 'instructor' || p.role === 'admin')
            .map(p => ({
              id: p.id,
              name: (p.name || '이름 없음').normalize('NFC')
            }))
          
          console.log('✅ 로드된 강사 목록:', instructorList)
          setInstructors(instructorList)
        } else {
          console.warn('⚠️ 강사 목록을 불러올 수 없습니다:', result.error)
          setInstructors([])
        }
      } catch (err) {
        console.error('강사 목록 로드 오류:', err)
        setInstructors([])
      }
    }

    loadInstructors()
  }, [])

  // 레슨 타입 (범례 순서대로)
  const lessonTypes: LessonType[] = [
    { id: 'type-intro', name: '인트로', color: 'bg-gray-400' },
    { id: 'type-personal', name: '개인레슨', color: 'bg-purple-500' },
    { id: 'type-duet', name: '듀엣레슨', color: 'bg-pink-500' },
    { id: 'type-group', name: '그룹레슨', color: 'bg-orange-500' }
  ]

  // 날짜 변경
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate)
  }

  // 캘린더에서 날짜 선택
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    setShowCalendar(false)
  }

  // 날짜 포맷팅 (2025년 10월 26일 일요일)
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const weekday = weekdays[date.getDay()]
    return `${year}년 ${month}월 ${day}일 ${weekday}`
  }

  // 시간 포맷팅 (09시00분 형식)
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':')
    return `${hour}시${minute}분`
  }

  // 시작/종료 시간 포맷팅
  const getTimeRange = (startTime: string, endTime?: string) => {
    if (endTime) {
      return `${formatTime(startTime)}~${formatTime(endTime)}`
    }
    // endTime이 없으면 기본 60분
    const [hour, minute] = startTime.split(':').map(Number)
    const start = new Date()
    start.setHours(hour, minute, 0, 0)
    const end = new Date(start.getTime() + 60 * 60000)
    const endHour = String(end.getHours()).padStart(2, '0')
    const endMinute = String(end.getMinutes()).padStart(2, '0')
    return `${formatTime(startTime)}~${formatTime(`${endHour}:${endMinute}`)}`
  }

  // 레슨 데이터 로드
  const loadLessons = useCallback(async () => {
    setLoading(true)
    try {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
      const result = await getAllClasses()

      if (!result.success || !result.data) {
        console.warn('⚠️ 레슨 데이터를 불러올 수 없습니다:', result.error)
        setLessons([])
        return
      }

      const colorMap: Record<string, string> = {
        인트로: 'bg-gray-400',
        개인레슨: 'bg-purple-500',
        듀엣레슨: 'bg-pink-500',
        그룹레슨: 'bg-orange-500',
      }

      const mapped = result.data
        .filter((lesson) => lesson.date === dateStr && lesson.instructorId)
        .map((lesson) => ({
          id: lesson.id,
          date: lesson.date,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          instructorId: lesson.instructorId!,
          instructorName: lesson.instructor || '',
          classTypeName: lesson.type,
          classTypeColor: colorMap[lesson.type] ?? 'bg-purple-500',
          members: lesson.members.map((member) => member.name),
          paymentType: lesson.paymentType,
          status: lesson.status,
        }))

      setLessons(mapped)
    } catch (error) {
      console.error('레슨 로드 실패:', error)
      setLessons([])
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  // 특정 시간/강사의 레슨들 찾기 (시작 시간의 시(hour)만 사용)
  const getLessonsForCell = (time: string, instructorId: string): any[] => {
    const [hour] = time.split(':').map(Number)
    return lessons.filter((l) => {
      const lessonStartTime = l.startTime || l.time || '09:00'
      const [lessonHour] = lessonStartTime.split(':').map(Number)
      return lessonHour === hour && l.instructorId === instructorId
    })
  }

  // 레슨 클릭 핸들러
  const handleLessonClick = (lesson: any) => {
    setSelectedLesson(lesson)
  }

  return (
    <div className="pb-24 overflow-x-hidden">
      {/* ==================== 타임테이블 카드 ==================== */}
      <div className="p-4">
        <div className="bg-white border border-[#f0ebe1] rounded-xl overflow-hidden">
          {/* 날짜 선택기 */}
          <div className="flex items-center justify-center gap-2.5 py-3.5 px-4 border-b border-[#f0ebe1]">
            <button
              onClick={() => changeDate(-1)}
              className="w-8 h-8 flex items-center justify-center bg-[#f5f1e8] hover:bg-[#e8e3d8] rounded-lg text-sm font-semibold text-[#7a6f61] transition-colors"
            >
              ◀
            </button>
            <button
              onClick={() => setShowCalendar(true)}
              className="min-w-[180px] px-3 py-1.5 text-center text-base font-semibold text-gray-900 hover:bg-[#f5f1e8] rounded-lg transition-colors cursor-pointer"
            >
              {formatDate(currentDate)}
            </button>
            <button
              onClick={() => changeDate(1)}
              className="w-8 h-8 flex items-center justify-center bg-[#f5f1e8] hover:bg-[#e8e3d8] rounded-lg text-sm font-semibold text-[#7a6f61] transition-colors"
            >
              ▶
            </button>
          </div>

          {/* 타임테이블 헤더 - 설명 */}
          <div className="px-4 py-3.5 border-b border-[#f0ebe1]">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">
              전체 강사 타임테이블
            </h2>
            <p className="text-[11px] text-[#7a6f61] leading-relaxed mb-2.5">
              점을 클릭하면 레슨 상세 정보를 확인할 수 있습니다
            </p>

            {/* 범례 */}
            <div className="flex flex-wrap gap-3 mt-2">
              {lessonTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-1.5 text-[11px] text-[#7a6f61]">
                  <span className={`w-2 h-2 rounded-full ${type.color} shadow-sm`}></span>
                  {type.name}
                </div>
              ))}
            </div>
          </div>

          {/* 타임테이블 그리드 */}
          <div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `48px repeat(${instructors.length || 1}, 1fr)`,
              }}
            >
              {/* 사선 헤더 (빈 셀) */}
              <div className="relative bg-[#f5f1e8] border-r border-b border-[#f0ebe1] h-9">
              </div>

              {/* 강사명 헤더 */}
              {instructors.length > 0 ? (
                instructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex items-center justify-center h-9 bg-[#f5f1e8] border-r border-b border-[#f0ebe1] text-xs font-semibold text-gray-900"
                  >
                    {instructor.name}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-9 bg-[#f5f1e8] border-r border-b border-[#f0ebe1] text-xs font-semibold text-gray-900 text-[#7a6f61]">
                  강사 없음
                </div>
              )}

              {/* 시간대별 행 */}
              {timeSlots.map((time) => (
                <div key={time} className="contents">
                  {/* 시간 셀 */}
                  <div
                    className="flex items-center justify-center bg-[#f5f1e8] border-r border-b border-[#f0ebe1] text-xs font-semibold text-[#7a6f61] h-7"
                  >
                    {time}
                  </div>

                  {/* 각 강사별 레슨 셀 */}
                  {instructors.length > 0 ? (
                    instructors.map((instructor) => {
                      const cellLessons = getLessonsForCell(time, instructor.id)
                      return (
                        <div
                          key={`${time}-${instructor.id}`}
                          className={`flex items-center justify-center gap-1.5 h-7 border-r border-b border-[#f0ebe1] ${
                            cellLessons.length > 0
                              ? 'cursor-pointer hover:bg-[#f5f1e8] transition-colors'
                              : 'bg-[#fdfbf7]'
                          }`}
                        >
                          {cellLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLessonClick(lesson)
                              }}
                              className={`w-2 h-2 rounded-full ${lesson.classTypeColor} shadow-sm hover:scale-125 transition-transform cursor-pointer`}
                              title={`${lesson.classTypeName} - ${lesson.members.map((m: any) => typeof m === 'string' ? m : m.name).join(', ')}`}
                            />
                          ))}
                        </div>
                      )
                    })
                  ) : (
                    <div className="h-7 border-r border-b border-[#f0ebe1] bg-[#fdfbf7]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 레슨 상세 모달 ==================== */}
      {selectedLesson && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[2000]"
          onClick={() => setSelectedLesson(null)}
        >
          <div
            className="bg-white rounded-xl max-w-sm w-full overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">레슨 상세</h3>
              <button
                onClick={() => setSelectedLesson(null)}
                className="text-[#7a6f61] hover:text-[#1a1a1a] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 레슨 유형 */}
              <div className="flex items-center gap-2">
                <LessonTypeBadge type={selectedLesson.classTypeName as any} />
              </div>

              {/* 정보 섹션 */}
              <div className="space-y-4">
                {/* 강사 */}
                <div className="flex items-start gap-4 pb-4 border-b border-[#f0ebe1]">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#f5f1e8] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#7a6f61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#7a6f61] font-medium mb-1">강사</div>
                    <div className="text-lg font-bold text-[#1a1a1a]">{selectedLesson.instructorName}</div>
                  </div>
                </div>

                {/* 시간 */}
                <div className="flex items-start gap-4 pb-4 border-b border-[#f0ebe1]">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#f5f1e8] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#7a6f61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[#7a6f61] font-medium mb-1">시간</div>
                    <div className="text-lg font-bold text-[#1a1a1a]">
                      {getTimeRange(selectedLesson.startTime || selectedLesson.time || '09:00', selectedLesson.endTime)}
                    </div>
                  </div>
                </div>

                {/* 참여 회원 */}
                {selectedLesson.members.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#f5f1e8] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#7a6f61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-[#7a6f61] font-medium mb-3">
                        참여 회원 ({selectedLesson.members.length}명)
                      </div>
                      <div className="space-y-2">
                        {selectedLesson.members.map((member: any, idx: number) => {
                          const memberName = typeof member === 'string' ? member : member.name
                          const paymentType = typeof member === 'string' ? '정규수업' : (member.paymentType || '정규수업')
                          return (
                            <div key={idx} className="flex items-center justify-between gap-2 py-2.5 px-3 bg-white border border-[#f0ebe1] rounded-lg">
                              <div className="text-sm font-medium text-[#1a1a1a]">{memberName}</div>
                              <StatusBadge type="payment" value={paymentType as any} size="sm" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 캘린더 모달 */}
      <CalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedDate={currentDate}
        onSelectDate={handleDateSelect}
        lessonDates={[...new Set(lessons.map(l => l.date))]}
      />
    </div>
  )
}
