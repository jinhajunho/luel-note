'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ==================== 타입 정의 ====================
type Instructor = {
  id: string
  name: string
}

type LessonType = {
  id: string
  name: string
  color: string // dot 색상 클래스
}

type Lesson = {
  id: string
  date: string
  time: string
  classTypeId: string
  classTypeName: string
  classTypeColor: string
  instructorId: string
  instructorName: string
  members: string[]
}

// ==================== 메인 컴포넌트 ====================
export default function AdminSchedulePage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  // 시간대 (06:00 ~ 21:00)
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ]

  // 강사 목록
  const instructors: Instructor[] = [
    { id: 'inst-001', name: '이지은' },
    { id: 'inst-002', name: '박서준' },
    { id: 'inst-003', name: '김민지' },
    { id: 'inst-004', name: '최우식' },
    { id: 'inst-005', name: '정다은' }
  ]

  // 레슨 타입 (범례 순서대로)
  const lessonTypes: LessonType[] = [
    { id: 'type-intro', name: '인트로', color: 'bg-gray-400' },
    { id: 'type-personal', name: '개인레슨', color: 'bg-purple-500' },
    { id: 'type-duet', name: '듀엣레슨', color: 'bg-pink-500' },
    { id: 'type-group', name: '그룹레슨', color: 'bg-orange-500' }
  ]

  useEffect(() => {
    loadLessons()
  }, [currentDate])

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

  // 날짜 포맷팅 (10월 26일 일요일)
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const weekday = weekdays[date.getDay()]
    return `${month}월 ${day}일 ${weekday}`
  }

  // 레슨 데이터 로드
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
      //     class_type:class_types(name, color),
      //     class_members(member:members(name))
      //   `)
      //   .eq('date', dateStr)
      //   .order('time')

      // 임시 목 데이터 (오늘 날짜)
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      setLessons([
        // 이지은 강사
        {
          id: '1',
          date: todayStr,
          time: '09:00',
          classTypeId: 'type-personal',
          classTypeName: '개인레슨',
          classTypeColor: 'bg-purple-500',
          instructorId: 'inst-001',
          instructorName: '이지은',
          members: ['홍길동']
        },
        {
          id: '2',
          date: todayStr,
          time: '10:00',
          classTypeId: 'type-duet',
          classTypeName: '듀엣레슨',
          classTypeColor: 'bg-pink-500',
          instructorId: 'inst-001',
          instructorName: '이지은',
          members: ['김철수', '이영희']
        },
        // 박서준 강사
        {
          id: '3',
          date: todayStr,
          time: '09:00',
          classTypeId: 'type-intro',
          classTypeName: '인트로',
          classTypeColor: 'bg-gray-400',
          instructorId: 'inst-002',
          instructorName: '박서준',
          members: ['박민수']
        },
        {
          id: '4',
          date: todayStr,
          time: '11:00',
          classTypeId: 'type-group',
          classTypeName: '그룹레슨',
          classTypeColor: 'bg-orange-500',
          instructorId: 'inst-002',
          instructorName: '박서준',
          members: ['정수진', '최유리', '강민호']
        },
        // 김민지 강사
        {
          id: '5',
          date: todayStr,
          time: '10:00',
          classTypeId: 'type-personal',
          classTypeName: '개인레슨',
          classTypeColor: 'bg-purple-500',
          instructorId: 'inst-003',
          instructorName: '김민지',
          members: ['윤서아']
        },
        // 최우식 강사
        {
          id: '6',
          date: todayStr,
          time: '14:00',
          classTypeId: 'type-duet',
          classTypeName: '듀엣레슨',
          classTypeColor: 'bg-pink-500',
          instructorId: 'inst-004',
          instructorName: '최우식',
          members: ['조서희', '남궁민']
        },
        // 정다은 강사
        {
          id: '7',
          date: todayStr,
          time: '15:00',
          classTypeId: 'type-group',
          classTypeName: '그룹레슨',
          classTypeColor: 'bg-orange-500',
          instructorId: 'inst-005',
          instructorName: '정다은',
          members: ['이금주', '서지현', '백서진', '진민아']
        }
      ])
    } catch (error) {
      console.error('레슨 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 특정 시간/강사의 레슨들 찾기
  const getLessonsForCell = (time: string, instructorId: string): Lesson[] => {
    return lessons.filter((l) => l.time === time && l.instructorId === instructorId)
  }

  // 레슨 클릭 핸들러
  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson)
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
                  gridTemplateColumns: '48px repeat(5, 1fr)',
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
                  <span className="absolute bottom-1 left-3 text-[10px] font-semibold text-[#7a6f61]">
                    시간
                  </span>
                  <span className="absolute top-1 right-3 text-[10px] font-semibold text-[#7a6f61]">
                    강사
                  </span>
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
                      className="flex items-center justify-center bg-[#f5f1e8] border-r border-b border-[#f0ebe1] text-xs font-semibold text-[#7a6f61] h-7"
                    >
                      {time}
                    </div>

                    {/* 각 강사별 레슨 셀 */}
                    {instructors.map((instructor) => {
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
                              onClick={() => handleLessonClick(lesson)}
                              className={`w-2 h-2 rounded-full ${lesson.classTypeColor} shadow-sm hover:scale-125 transition-transform cursor-pointer`}
                              title={`${lesson.classTypeName} - ${lesson.members.join(', ')}`}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0ebe1] flex justify-around py-2 z-40">
          <button className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-900">
            <div className="text-xl">📅</div>
            <div className="text-[11px] font-medium">일정</div>
          </button>
          <button
            onClick={() => router.push('/admin/classes')}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-[#7a6f61] hover:text-gray-900"
          >
            <div className="text-xl">📊</div>
            <div className="text-[11px] font-medium">레슨</div>
          </button>
          <button
            onClick={() => router.push('/admin/members')}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-[#7a6f61] hover:text-gray-900"
          >
            <div className="text-xl">👥</div>
            <div className="text-[11px] font-medium">회원</div>
          </button>
          <button
            onClick={() => router.push('/admin/attendance')}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-[#7a6f61] hover:text-gray-900"
          >
            <div className="text-xl">✓</div>
            <div className="text-[11px] font-medium">출석</div>
          </button>
          <button
            onClick={() => router.push('/admin/settlements')}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-[#7a6f61] hover:text-gray-900"
          >
            <div className="text-xl">💰</div>
            <div className="text-[11px] font-medium">정산</div>
          </button>
        </nav>
      </div>

      {/* ==================== 레슨 상세 모달 ==================== */}
      {selectedLesson && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLesson(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#f0ebe1]">
              <h3 className="text-lg font-semibold text-gray-900">레슨 상세</h3>
              <button
                onClick={() => setSelectedLesson(null)}
                className="text-gray-400 hover:text-gray-600 transition-all hover:rotate-90"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedLesson.classTypeName}
                </h4>
                <div className="text-base text-gray-600">
                  {selectedLesson.date} {selectedLesson.time}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  강사: {selectedLesson.instructorName}
                </div>
              </div>

              {selectedLesson.members.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">
                    참여 회원 ({selectedLesson.members.length}명)
                  </h5>
                  <div className="space-y-1">
                    {selectedLesson.members.map((member, idx) => (
                      <div key={idx} className="text-sm text-gray-700 py-1">
                        {member}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
