'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import StatusBadge from '@/components/common/StatusBadge'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'
import ConfirmDialog from '@/components/common/ConfirmDialog'

// 타입 정의
type LessonMember = {
  memberId: string
  memberName: string
  attended: boolean | null
  checkInTime?: string
  remainingLessons: number
}

type Lesson = {
  id: string
  date: string
  time: string
  classType: string
  paymentType: string
  members: LessonMember[]
  status: 'scheduled' | 'completed' | 'cancelled'
}

// 출석 체크 카드
function AttendanceCheckCard({ 
  lesson, 
  onCheckAttendance 
}: { 
  lesson: Lesson
  onCheckAttendance: (lessonId: string, memberId: string, attended: boolean) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* 레슨 정보 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-gray-900">{lesson.time}</span>
        </div>
        <span className={`
          text-xs font-medium px-2 py-1 rounded-full
          ${lesson.status === 'completed' 
            ? 'bg-gray-100 text-gray-600' 
            : 'bg-blue-100 text-blue-600'
          }
        `}>
          {lesson.status === 'completed' ? '완료' : '진행 중'}
        </span>
      </div>

      {/* 레슨 유형 + 결제 타입 */}
      <div className="flex items-center gap-2 mb-4">
        <StatusBadge type="class" value={lesson.classType} size="sm" />
        <StatusBadge type="payment" value={lesson.paymentType} size="sm" />
      </div>

      {/* 회원 목록 */}
      <div className="space-y-2">
        {lesson.members.map((member) => (
          <div 
            key={member.memberId}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900">{member.memberName}</div>
              <div className="text-xs text-gray-500">
                남은 레슨: {member.remainingLessons}회
              </div>
            </div>

            {member.attended === null ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onCheckAttendance(lesson.id, member.memberId, true)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                  출석
                </button>
                <button
                  onClick={() => onCheckAttendance(lesson.id, member.memberId, false)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
                >
                  결석
                </button>
              </div>
            ) : (
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${member.attended 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
                }
              `}>
                {member.attended ? `✓ ${member.checkInTime || '출석'}` : '✗ 결석'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InstructorAttendancePage() {
  const { profile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    lessonId: string
    memberId: string
    memberName: string
    attended: boolean
  }>({
    isOpen: false,
    lessonId: '',
    memberId: '',
    memberName: '',
    attended: false
  })

  useEffect(() => {
    if (profile) {
      loadLessons()
    }
  }, [profile, selectedDate])

  const loadLessons = async () => {
    try {
      setLoading(true)
      
      // TODO: Supabase에서 데이터 로드
      // 본인이 담당하는 레슨만 가져오기
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockLessons: Lesson[] = [
        {
          id: '1',
          date: '2025-01-20',
          time: '10:00',
          classType: '개인레슨',
          paymentType: '정규수업',
          members: [
            {
              memberId: '1',
              memberName: '홍길동',
              attended: true,
              checkInTime: '10:05',
              remainingLessons: 12
            }
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
            {
              memberId: '2',
              memberName: '김철수',
              attended: null,
              remainingLessons: 7
            },
            {
              memberId: '3',
              memberName: '박영희',
              attended: null,
              remainingLessons: 14
            },
            {
              memberId: '4',
              memberName: '이민수',
              attended: null,
              remainingLessons: 5
            }
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
            {
              memberId: '5',
              memberName: '최지은',
              attended: null,
              remainingLessons: 8
            },
            {
              memberId: '6',
              memberName: '정수민',
              attended: null,
              remainingLessons: 10
            }
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

  const handleCheckAttendance = (lessonId: string, memberId: string, attended: boolean) => {
    const lesson = lessons.find(l => l.id === lessonId)
    const member = lesson?.members.find(m => m.memberId === memberId)
    
    if (!member) return

    setConfirmDialog({
      isOpen: true,
      lessonId,
      memberId,
      memberName: member.memberName,
      attended
    })
  }

  const confirmCheckAttendance = async () => {
    try {
      const { lessonId, memberId, attended } = confirmDialog
      
      // TODO: Supabase 업데이트
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 로컬 상태 업데이트
      setLessons(prev => prev.map(lesson => {
        if (lesson.id === lessonId) {
          return {
            ...lesson,
            members: lesson.members.map(member => {
              if (member.memberId === memberId) {
                return {
                  ...member,
                  attended,
                  checkInTime: attended ? new Date().toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : undefined
                }
              }
              return member
            })
          }
        }
        return lesson
      }))

      alert(`${confirmDialog.memberName}님을 ${attended ? '출석' : '결석'} 처리했습니다.`)
    } catch (error) {
      console.error('❌ 출석 체크 오류:', error)
      alert('출석 체크에 실패했습니다.')
    }
  }

  // 날짜별 필터링
  const selectedDateString = selectedDate.toISOString().split('T')[0]
  const todayLessons = lessons.filter(lesson => lesson.date === selectedDateString)

  // 출석 통계
  const totalMembers = todayLessons.reduce((sum, lesson) => sum + lesson.members.length, 0)
  const attendedMembers = todayLessons.reduce((sum, lesson) => 
    sum + lesson.members.filter(m => m.attended === true).length, 0
  )
  const absentMembers = todayLessons.reduce((sum, lesson) => 
    sum + lesson.members.filter(m => m.attended === false).length, 0
  )
  const pendingMembers = totalMembers - attendedMembers - absentMembers

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
            <h2 className="text-2xl font-bold text-gray-900">출석 체크</h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedDate.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>

          {/* 출석 통계 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">전체</div>
              <div className="text-2xl font-bold text-gray-900">{totalMembers}명</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">출석</div>
              <div className="text-2xl font-bold text-green-600">{attendedMembers}명</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">결석</div>
              <div className="text-2xl font-bold text-red-600">{absentMembers}명</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-600 mb-1">대기</div>
              <div className="text-2xl font-bold text-blue-600">{pendingMembers}명</div>
            </div>
          </div>

          {/* 레슨 목록 */}
          {loading ? (
            <Loading />
          ) : todayLessons.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                오늘의 레슨 ({todayLessons.length})
              </h3>
              {todayLessons.map(lesson => (
                <AttendanceCheckCard
                  key={lesson.id}
                  lesson={lesson}
                  onCheckAttendance={handleCheckAttendance}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="오늘 예정된 레슨이 없습니다"
              description="레슨이 예약되면 여기에 표시됩니다."
            />
          )}
        </div>
      </main>

      <BottomNavigation profile={profile} />

      {/* 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmCheckAttendance}
        title={`${confirmDialog.attended ? '출석' : '결석'} 처리`}
        message={`${confirmDialog.memberName}님을 ${confirmDialog.attended ? '출석' : '결석'} 처리하시겠습니까?`}
        confirmText="확인"
        type={confirmDialog.attended ? 'info' : 'warning'}
      />
    </>
  )
}
