'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import StatusBadge from '@/components/common/StatusBadge'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'

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
  status: 'scheduled' | 'completed' | 'cancelled'
  capacity: number
}

// 레슨 카드
function LessonCard({ 
  lesson, 
  onClick 
}: { 
  lesson: Lesson
  onClick: () => void
}) {
  const enrolled = lesson.members.length
  const isFull = enrolled >= lesson.capacity
  const attendedCount = lesson.members.filter(m => m.attended === true).length

  const statusConfig = {
    scheduled: { text: '예정', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { text: '완료', color: 'bg-green-100 text-green-700 border-green-200' },
    cancelled: { text: '취소', color: 'bg-red-100 text-red-700 border-red-200' }
  }

  const config = statusConfig[lesson.status]

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
    >
      {/* 날짜 + 시간 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-base font-semibold text-gray-900 mb-1">
            {lesson.date} {lesson.time}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge type="class" value={lesson.classType} size="sm" />
            <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${config.color}`}>
              {config.text}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className={`
            text-sm font-bold
            ${isFull ? 'text-green-600' : 'text-gray-600'}
          `}>
            {enrolled}/{lesson.capacity}명
          </div>
        </div>
      </div>

      {/* 회원 뱃지 */}
      {lesson.members.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
          {lesson.members.map((member) => (
            <span 
              key={member.memberId}
              className={`
                px-2 py-1 rounded-md text-xs font-medium border
                ${member.attended === true 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : member.attended === false
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
                }
              `}
            >
              {member.memberName}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// 레슨 상세 모달
function LessonDetailModal({ 
  lesson, 
  onClose,
  onComplete,
  onCancel
}: { 
  lesson: Lesson | null
  onClose: () => void
  onComplete: (lessonId: string) => void
  onCancel: (lessonId: string) => void
}) {
  if (!lesson) return null

  const attendedCount = lesson.members.filter(m => m.attended === true).length
  const absentCount = lesson.members.filter(m => m.attended === false).length
  const totalCount = lesson.members.length
  const attendanceRate = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0

  const isScheduled = lesson.status === 'scheduled'
  const isCompleted = lesson.status === 'completed'
  const isCancelled = lesson.status === 'cancelled'

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-width-md my-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">레슨 상세</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all hover:rotate-90"
          >
            ✕
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 레슨 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge type="class" value={lesson.classType} />
              <StatusBadge type="payment" value={lesson.paymentType} />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              {lesson.classType}
            </h4>
            <div className="text-base text-gray-600">
              {lesson.date} {lesson.time}
            </div>
          </div>

          {/* 회원 목록 */}
          {lesson.members.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-900">참여 회원</h5>
                <span className="text-sm text-gray-600">
                  {lesson.members.length}명
                </span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {lesson.members.map((member, idx) => (
                  <div 
                    key={member.memberId}
                    className={`
                      flex items-center justify-between p-3.5
                      ${idx !== lesson.members.length - 1 ? 'border-b border-gray-100' : ''}
                    `}
                  >
                    <span className="font-medium text-gray-900">
                      {member.memberName}
                    </span>
                    {member.attended !== null && (
                      <span className={`
                        px-2.5 py-1 rounded-md text-xs font-semibold
                        ${member.attended 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                        }
                      `}>
                        {member.attended ? '출석' : '결석'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 통계 */}
          {isCompleted && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">출석 통계</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">총 인원</div>
                  <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">출석</div>
                  <div className="text-2xl font-bold text-green-600">{attendedCount}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">결석</div>
                  <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">출석률</div>
                  <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
                </div>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          {isScheduled && (
            <div className="space-y-2.5">
              <Button
                onClick={() => onComplete(lesson.id)}
                variant="primary"
                fullWidth
              >
                수업 완료
              </Button>
              <Button
                onClick={() => onCancel(lesson.id)}
                variant="danger"
                fullWidth
              >
                수업 취소
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-green-700 font-semibold">✓ 완료된 수업입니다</div>
            </div>
          )}

          {isCancelled && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-red-700 font-semibold">✗ 취소된 수업입니다</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InstructorLessonsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (profile) {
      loadLessons()
    }
  }, [profile])

  const loadLessons = async () => {
    try {
      setLoading(true)
      
      // TODO: Supabase에서 데이터 로드
      // instructor_id로 필터링
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
          status: 'completed',
          capacity: 1
        },
        {
          id: '2',
          date: '2025-01-21',
          time: '14:00',
          classType: '그룹레슨',
          paymentType: '정규수업',
          members: [
            { memberId: '2', memberName: '김철수', attended: null },
            { memberId: '3', memberName: '박영희', attended: null },
            { memberId: '4', memberName: '이민수', attended: null }
          ],
          status: 'scheduled',
          capacity: 4
        },
        {
          id: '3',
          date: '2025-01-22',
          time: '16:00',
          classType: '듀엣레슨',
          paymentType: '센터제공',
          members: [
            { memberId: '5', memberName: '박민정', attended: null },
            { memberId: '6', memberName: '이현우', attended: null }
          ],
          status: 'scheduled',
          capacity: 2
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
    if (!confirm('수업을 완료하시겠습니까?')) return

    try {
      // TODO: Supabase 업데이트
      await new Promise(resolve => setTimeout(resolve, 300))
      
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

      setSelectedLesson(null)
      alert('수업이 완료되었습니다!')
    } catch (error) {
      console.error('❌ 수업 완료 오류:', error)
      alert('수업 완료에 실패했습니다.')
    }
  }

  const handleCancelLesson = async (lessonId: string) => {
    if (!confirm('수업을 취소하시겠습니까?')) return

    try {
      // TODO: Supabase 업데이트
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setLessons(prev => prev.map(lesson => {
        if (lesson.id === lessonId) {
          return { ...lesson, status: 'cancelled' as const }
        }
        return lesson
      }))

      setSelectedLesson(null)
      alert('수업이 취소되었습니다.')
    } catch (error) {
      console.error('❌ 수업 취소 오류:', error)
      alert('수업 취소에 실패했습니다.')
    }
  }

  // 검색 필터링
  const filteredLessons = lessons.filter(lesson => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lesson.classType.toLowerCase().includes(query) ||
      lesson.date.includes(query) ||
      lesson.members.some(m => m.memberName.toLowerCase().includes(query))
    )
  })

  if (!profile) {
    return <Loading text="로딩 중..." />
  }

  return (
    <>
      <Header profile={profile} />
      
      <main className="pb-20 min-h-screen bg-gray-50">
        {/* 검색 & 등록 */}
        <div className="bg-white border-b border-gray-200 p-4 space-y-3">
          <Button
            onClick={() => router.push('/sessions/create')}
            variant="primary"
            fullWidth
          >
            + 레슨 등록
          </Button>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="레슨 검색 (날짜, 유형, 회원명)"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 레슨 목록 */}
        <div className="p-5">
          {loading ? (
            <Loading />
          ) : filteredLessons.length > 0 ? (
            <div className="space-y-3">
              {filteredLessons.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => setSelectedLesson(lesson)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 레슨이 없습니다'}
            </div>
          )}
        </div>
      </main>

      <BottomNavigation profile={profile} />

      {/* 레슨 상세 모달 */}
      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onComplete={handleCompleteLesson}
          onCancel={handleCancelLesson}
        />
      )}
    </>
  )
}
