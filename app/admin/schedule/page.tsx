'use client'

import { useState, useEffect } from 'react'

// ==================== 타입 정의 ====================
type LessonType = 'intro' | 'personal' | 'duet' | 'group'
type LessonStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

interface Lesson {
  id: string
  date: string
  time: string
  classTypeId: string
  paymentTypeId: string
  instructorId: string
  instructorName: string
  status: LessonStatus
  members: string[]
}

interface Instructor {
  id: string
  name: string
  fullName: string
}

// ==================== 메인 컴포넌트 ====================
export default function AdminSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  // 강사 목록 (실제로는 DB에서 가져옴)
  const instructors: Instructor[] = [
    { id: 'inst-001', name: '이지은', fullName: '이지은 강사' },
    { id: 'inst-002', name: '박서준', fullName: '박서준 강사' },
    { id: 'inst-003', name: '김민지', fullName: '김민지 강사' },
    { id: 'inst-004', name: '최우식', fullName: '최우식 강사' },
    { id: 'inst-005', name: '정다은', fullName: '정다은 강사' },
  ]

  // 시간대 (06:00 ~ 21:00)
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ]

  // 레슨 타입 색상
  const lessonTypeColors: Record<string, string> = {
    'type-intro': 'bg-gray-400',
    'type-personal': 'bg-purple-500',
    'type-duet': 'bg-pink-500',
    'type-group': 'bg-orange-500',
  }

  // 날짜 형식 변환
  const formatDate = (date: Date) => {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${month}월 ${day}일 ${weekday}`
  }

  // 날짜 변경
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate)
  }

  // 오늘로 이동
  const goToday = () => {
    setCurrentDate(new Date())
  }

  // 레슨 데이터 로드
  useEffect(() => {
    loadLessons()
  }, [currentDate])

  const loadLessons = async () => {
    setLoading(true)
    try {
      // TODO: Supabase에서 해당 날짜의 레슨 조회
      // const dateStr = currentDate.toISOString().split('T')[0]
      // const { data, error } = await supabase
      //   .from('classes')
      //   .select(`
      //     *,
      //     instructor:profiles!classes_instructor_id_fkey(name),
      //     class_members(member:members(name))
      //   `)
      //   .eq('date', dateStr)
      //   .order('time')

      // 임시 목 데이터
      setLessons([
        {
          id: '1',
          date: '2025-01-15',
          time: '09:00',
          classTypeId: 'type-personal',
          paymentTypeId: 'payment-regular',
          instructorId: 'inst-001',
          instructorName: '이지은 강사',
          status: 'scheduled',
          members: ['홍길동'],
        },
        {
          id: '2',
          date: '2025-01-15',
          time: '10:00',
          classTypeId: 'type-duet',
          paymentTypeId: 'payment-regular',
          instructorId: 'inst-002',
          instructorName: '박서준 강사',
          status: 'scheduled',
          members: ['김철수', '이영희'],
        },
      ])
    } catch (error) {
      console.error('레슨 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 특정 시간/강사의 레슨 찾기
  const getLessonAt = (time: string, instructorId: string) => {
    return lessons.find(
      (l) => l.time === time && l.instructorId === instructorId
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] pb-20">
      <div className="mx-auto bg-[#fdfbf7] min-h-screen">
        {/* ==================== 헤더 ==================== */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#f0ebe1]">
          <div className="flex items-center justify-between px-5 py-4">
            <h1 className="text-lg font-semibold text-gray-900">일정</h1>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 text-2xl">🔔</button>
              <button className="w-9 h-9 text-xl opacity-70 hover:opacity-100">
                👤
              </button>
            </div>
          </div>
        </header>

        {/* ==================== 타임테이블 카드 ==================== */}
        <div className="p-4">
          <div className="bg-white border border-[#f0ebe1] rounded-xl overflow-hidden">
            {/* 날짜 선택기 */}
            <div className="flex items-center justify-center gap-2.5 py-3.5 px-4 border-b border-[#f0ebe1]">
              <button
                onClick={() => changeDate(-7)}
                className="w-8 h-8 flex items-center justify-center bg-[#f5f1e8] hover:bg-[#e8e3d8] rounded-lg text-sm font-semibold text-[#7a6f61] transition-colors"
              >
                ◀◀
              </button>
              <button
                onClick={() => changeDate(-1)}
                className="w-8 h-8 flex items-center justify-center bg-[#f5f1e8] hover:bg-[#e8e3d8] rounded-lg text-sm font-semibold text-[#7a6f61] transition-colors"
              >
                ◀
              </button>
              <button
                onClick={goToday}
                className="w-11 h-8 flex items-center justify-center bg-gray-900 hover:bg-gray-700 rounded-lg text-[11px] font-semibold text-white transition-colors"
              >
                오늘
              </button>
              <button
                onClick={() => setShowCalendar(true)}
                className="min-w-[130px] px-3 py-1.5 text-center text-base font-semibold text-gray-900 hover:bg-[#f5f1e8] rounded-lg transition-colors cursor-pointer"
              >
                {formatDate(currentDate)}
              </button>
              <button
                onClick={() => changeDate(1)}
                className="w-8 h-8 flex items-center justify-center bg-[#f5f1e8] hover:bg-[#e8e3d8] rounded-lg text-sm font-semibold text-[#7a6f61] transition-colors"
              >
                ▶
              </button>
              <button
                onClick={() => changeDate(7)}
                className="w-8 h-8 flex items-center justify-center bg-[#f5f1e8] hover:bg-[#e8e3d8] rounded-lg text-sm font-semibold text-[#7a6f61] transition-colors"
              >
                ▶▶
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
                <div className="flex items-center gap-1.5 text-[11px] text-[#7a6f61]">
                  <span className="w-2 h-2 rounded-full bg-gray-400 shadow-sm"></span>
                  인트로
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#7a6f61]">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm"></span>
                  개인레슨
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#7a6f61]">
                  <span className="w-2 h-2 rounded-full bg-pink-500 shadow-sm"></span>
                  듀엣레슨
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#7a6f61]">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm"></span>
                  그룹레슨
                </div>
              </div>
            </div>

            {/* 타임테이블 그리드 */}
            <div className="overflow-x-auto">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: '48px repeat(5, 1fr)',
                  minWidth: '600px',
                }}
              >
                {/* 사선 헤더 */}
                <div className="relative bg-[#f5f1e8] border-r border-b border-[#f0ebe1] h-9">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to bottom left, transparent 0%, transparent calc(50% - 0.5px), #d1c7b8 calc(50% - 0.5px), #d1c7b8 calc(50% + 0.5px), transparent calc(50% + 0.5px), transparent 100%)',
                    }}
                  />
                </div>

                {/* 강사명 헤더 */}
                {instructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex items-center justify-center h-9 bg-[#f5f1e8] border-r border-b border-[#f0ebe1] text-xs font-semibold text-gray-900"
                  >
                    {instructor.name}
                  </div>
                ))}

                {/* 시간대별 행 */}
                {timeSlots.map((time) => (
                  <>
                    {/* 시간 셀 */}
                    <div
                      key={`time-${time}`}
                      className="flex items-center justify-center bg-[#f5f1e8] border-r border-b border-[#f0ebe1] text-xs font-semibold text-gray-700 h-7"
                    >
                      {time}
                    </div>

                    {/* 강사별 레슨 셀 */}
                    {instructors.map((instructor) => {
                      const lesson = getLessonAt(time, instructor.id)
                      return (
                        <div
                          key={`cell-${time}-${instructor.id}`}
                          className="flex items-center justify-center border-r border-b border-[#f0ebe1] h-7 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => lesson && setSelectedLesson(lesson)}
                        >
                          {lesson && (
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                lessonTypeColors[lesson.classTypeId]
                              } shadow-sm`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 레슨 상세 모달 ==================== */}
        {selectedLesson && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLesson(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900">레슨 상세</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">시간</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedLesson.time}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">강사</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedLesson.instructorName}
                  </span>
                </div>

                <div className="py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600 mb-2 block">
                    참여 회원 ({selectedLesson.members.length}명)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedLesson.members.map((member, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded-lg"
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLesson(null)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* ==================== 하단 네비게이션 ==================== */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0ebe1] z-40">
          <div className="max-w-2xl mx-auto flex justify-around py-2">
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900 font-semibold">
              <span className="text-xl">📅</span>
              <span className="text-xs">일정</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">📝</span>
              <span className="text-xs">레슨</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">👥</span>
              <span className="text-xs">회원</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">✅</span>
              <span className="text-xs">출석</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">💰</span>
              <span className="text-xs">정산</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
