'use client'

import { useState, useEffect } from 'react'

// ==================== 타입 정의 ====================
type LessonStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

interface Lesson {
  id: string
  date: string
  time: string
  classTypeName: string
  classTypeColor: string
  paymentTypeName: string
  paymentTypeColor: string
  instructorName: string
  status: LessonStatus
  members: string[]
}

// ==================== 메인 컴포넌트 ====================
export default function AdminClassesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)

  // 레슨 타입 색상 매핑
  const classTypeColors: Record<string, string> = {
    인트로: 'bg-gray-400',
    개인레슨: 'bg-purple-500',
    듀엣레슨: 'bg-pink-500',
    그룹레슨: 'bg-orange-500',
  }

  const paymentTypeColors: Record<string, string> = {
    체험수업: 'bg-orange-400',
    정규수업: 'bg-blue-500',
    강사제공: 'bg-green-500',
    센터제공: 'bg-yellow-400',
  }

  // 상태 텍스트
  const statusText: Record<LessonStatus, string> = {
    scheduled: '예정',
    ongoing: '진행중',
    completed: '완료',
    cancelled: '취소',
  }

  // 상태 색상
  const statusColors: Record<LessonStatus, string> = {
    scheduled: 'text-blue-600 bg-blue-50',
    ongoing: 'text-green-600 bg-green-50',
    completed: 'text-gray-600 bg-gray-50',
    cancelled: 'text-red-600 bg-red-50',
  }

  // 레슨 데이터 로드
  useEffect(() => {
    loadLessons()
  }, [])

  // 검색 필터
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLessons(lessons)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredLessons(
        lessons.filter(
          (lesson) =>
            lesson.instructorName.toLowerCase().includes(query) ||
            lesson.members.some((m) => m.toLowerCase().includes(query)) ||
            lesson.classTypeName.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, lessons])

  const loadLessons = async () => {
    setLoading(true)
    try {
      // TODO: Supabase에서 레슨 조회
      // const { data, error } = await supabase
      //   .from('classes')
      //   .select(`
      //     *,
      //     class_type:class_types(name, color),
      //     payment_type:payment_types(name, color),
      //     instructor:profiles!classes_instructor_id_fkey(name),
      //     class_members(member:members(name))
      //   `)
      //   .order('date', { ascending: false })
      //   .order('time', { ascending: false })

      // 임시 목 데이터
      const mockData: Lesson[] = [
        {
          id: '1',
          date: '2025-01-15',
          time: '10:00',
          classTypeName: '개인레슨',
          classTypeColor: 'bg-purple-500',
          paymentTypeName: '정규수업',
          paymentTypeColor: 'bg-blue-500',
          instructorName: '이지은',
          status: 'scheduled',
          members: ['홍길동'],
        },
        {
          id: '2',
          date: '2025-01-15',
          time: '14:00',
          classTypeName: '그룹레슨',
          classTypeColor: 'bg-orange-500',
          paymentTypeName: '정규수업',
          paymentTypeColor: 'bg-blue-500',
          instructorName: '박서준',
          status: 'scheduled',
          members: ['김철수', '이영희', '박민지'],
        },
        {
          id: '3',
          date: '2025-01-14',
          time: '09:00',
          classTypeName: '듀엣레슨',
          classTypeColor: 'bg-pink-500',
          paymentTypeName: '강사제공',
          paymentTypeColor: 'bg-green-500',
          instructorName: '김민지',
          status: 'completed',
          members: ['최지훈', '정수진'],
        },
      ]

      setLessons(mockData)
      setFilteredLessons(mockData)
    } catch (error) {
      console.error('레슨 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 레슨 등록 페이지로 이동
  const handleRegisterLesson = () => {
    alert('레슨 등록 페이지로 이동합니다')
    // TODO: router.push('/admin/classes/register')
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] pb-20">
      <div className="max-w-2xl mx-auto bg-[#fdfbf7] min-h-screen shadow-xl">
        {/* ==================== 헤더 ==================== */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#f0ebe1]">
          <div className="flex items-center justify-between px-5 py-4">
            <h1 className="text-lg font-semibold text-gray-900">레슨</h1>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 text-2xl">🔔</button>
              <button className="w-9 h-9 text-xl opacity-70 hover:opacity-100">
                👤
              </button>
            </div>
          </div>
        </header>

        {/* ==================== 검색 & 등록 ==================== */}
        <div className="px-5 py-4 bg-white border-b border-[#f0ebe1]">
          <button
            onClick={handleRegisterLesson}
            className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl transition-all mb-3"
          >
            + 새 레슨 등록
          </button>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="강사, 회원, 레슨 유형으로 검색"
            className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors"
          />
        </div>

        {/* ==================== 레슨 목록 ==================== */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">
              로딩 중...
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 레슨이 없습니다'}
            </div>
          ) : (
            filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                className="bg-white border border-[#f0ebe1] rounded-xl p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* 날짜 & 시간 & 상태 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {lesson.date} {lesson.time}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        statusColors[lesson.status]
                      }`}
                    >
                      {statusText[lesson.status]}
                    </span>
                  </div>
                </div>

                {/* 레슨 타입 & 결제 타입 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${lesson.classTypeColor} text-white text-xs font-medium rounded-lg`}
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    {lesson.classTypeName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${lesson.paymentTypeColor} text-white text-xs font-medium rounded-lg`}
                  >
                    {lesson.paymentTypeName}
                  </span>
                </div>

                {/* 강사 */}
                <div className="text-sm text-gray-600">
                  강사: <span className="font-medium text-gray-900">{lesson.instructorName}</span>
                </div>

                {/* 회원 */}
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">
                    참여 회원 ({lesson.members.length}명)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.members.map((member, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-gray-100 text-xs text-gray-700 rounded-lg"
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
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
                {/* 날짜 & 시간 */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">날짜 & 시간</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedLesson.date} {selectedLesson.time}
                  </span>
                </div>

                {/* 강사 */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">강사</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedLesson.instructorName}
                  </span>
                </div>

                {/* 레슨 타입 */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">레슨 유형</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${selectedLesson.classTypeColor} text-white text-xs font-medium rounded-lg`}
                  >
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    {selectedLesson.classTypeName}
                  </span>
                </div>

                {/* 결제 타입 */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">결제 유형</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${selectedLesson.paymentTypeColor} text-white text-xs font-medium rounded-lg`}
                  >
                    {selectedLesson.paymentTypeName}
                  </span>
                </div>

                {/* 상태 */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">상태</span>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      statusColors[selectedLesson.status]
                    }`}
                  >
                    {statusText[selectedLesson.status]}
                  </span>
                </div>

                {/* 참여 회원 */}
                <div className="py-3">
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

              <div className="flex gap-2">
                <button
                  onClick={() => alert('수정 기능 구현 예정')}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 하단 네비게이션 ==================== */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0ebe1] z-40">
          <div className="max-w-2xl mx-auto flex justify-around py-2">
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">📅</span>
              <span className="text-xs">일정</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900 font-semibold">
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
