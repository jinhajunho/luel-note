'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils/date'
import { formatPhone } from '@/lib/utils/phone'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type SessionDetail = {
  id: string
  date: string
  time: string
  type: '인트로' | '개인수업' | '듀엣수업' | '그룹수업'
  instructor: string
  room: string
  capacity: number
  status: 'scheduled' | 'completed' | 'cancelled'
  memo?: string
  members: Array<{
    id: string
    name: string
    phone: string
    attended: boolean
    attendedAt?: string
    memo: string
  }>
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionDetail | null>(null)

  useEffect(() => {
    loadSessionDetail()
  }, [sessionId])

  const loadSessionDetail = () => {
    // 임시 목업 데이터
    const mockSession: SessionDetail = {
      id: sessionId,
      date: '2025-01-20',
      time: '오후 02:00',
      type: '듀엣수업',
      instructor: '박코치',
      room: 'A룸',
      capacity: 2,
      status: 'scheduled',
      memo: '초급자 위주 진행',
      members: [
        {
          id: '1',
          name: '박민정',
          phone: '01087654321',
          attended: false,
          memo: ''
        },
        {
          id: '2',
          name: '이현우',
          phone: '01011112222',
          attended: false,
          memo: ''
        }
      ]
    }

    setSession(mockSession)
  }

  const handleAttendanceToggle = (memberId: string) => {
    if (!session) return

    setSession({
      ...session,
      members: session.members.map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            attended: !member.attended,
            attendedAt: !member.attended ? new Date().toISOString() : undefined
          }
        }
        return member
      })
    })
  }

  const handleMemoChange = (memberId: string, memo: string) => {
    if (!session) return

    setSession({
      ...session,
      members: session.members.map(member => {
        if (member.id === memberId) {
          return { ...member, memo }
        }
        return member
      })
    })
  }

  const handleComplete = () => {
    if (confirm('수업을 완료 처리하시겠습니까?')) {
      setSession(prev => prev ? { ...prev, status: 'completed' } : null)
      alert('수업이 완료되었습니다!')
    }
  }

  const handleCancel = () => {
    if (confirm('수업을 취소하시겠습니까?')) {
      setSession(prev => prev ? { ...prev, status: 'cancelled' } : null)
      alert('수업이 취소되었습니다!')
    }
  }

  const handleDelete = () => {
    if (confirm('수업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      alert('수업이 삭제되었습니다!')
      router.push('/sessions')
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  const statusText = {
    scheduled: '예정',
    completed: '완료',
    cancelled: '취소'
  }

  const statusColor = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200'
  }

  const attendedCount = session.members.filter(m => m.attended).length
  const isScheduled = session.status === 'scheduled'
  const isCompleted = session.status === 'completed'
  const isCancelled = session.status === 'cancelled'

  return (
    <div className="space-y-6">
      {/* 뒤로 가기 */}
      <Link
        href="/sessions"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← 목록으로
      </Link>

      {/* 수업 정보 */}
      <div className={`
        bg-white rounded-xl border-2 p-6
        ${isCancelled ? 'border-red-200 bg-red-50' : 'border-gray-200'}
      `}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {session.date} {session.time}
              </h2>
              <span className={`px-3 py-1 text-sm font-bold rounded-full border-2 ${statusColor[session.status]}`}>
                {statusText[session.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-full border border-blue-200">
                {session.type}
              </span>
              <span>{session.instructor}</span>
              <span>{session.room}</span>
              <span className="font-bold">
                {attendedCount}/{session.capacity}명 출석
              </span>
            </div>
            {session.memo && (
              <div className="mt-3 text-sm text-gray-600">
                메모: {session.memo}
              </div>
            )}
          </div>

          {isScheduled && (
            <Link
              href={`/sessions/${session.id}/edit`}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              수정
            </Link>
          )}
        </div>
      </div>

      {/* 출석 관리 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          출석 관리
        </h3>

        <div className="space-y-3">
          {session.members.map((member) => (
            <div 
              key={member.id}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
            >
              {/* 출석 체크박스 */}
              <label className="flex items-center gap-3 cursor-pointer min-w-[200px]">
                <input
                  type="checkbox"
                  checked={member.attended}
                  onChange={() => handleAttendanceToggle(member.id)}
                  disabled={!isScheduled}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">
                    {member.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPhone(member.phone)}
                  </div>
                </div>
              </label>

              {/* 상태 뱃지 */}
              <span className={`
                px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap
                ${member.attended
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
                }
              `}>
                {member.attended ? '출석' : '결석'}
              </span>

              {/* 출석 시간 */}
              {member.attended && member.attendedAt && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(member.attendedAt).toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}

              {/* 메모 입력 */}
              <input
                type="text"
                value={member.memo}
                onChange={(e) => handleMemoChange(member.id, e.target.value)}
                placeholder="메모 (선택)"
                disabled={!isScheduled}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          수업 관리
        </h3>

        {isScheduled && (
          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              ✓ 수업 완료
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              수업 취소
            </button>
          </div>
        )}

        {(isCompleted || isCancelled) && (
          <div className="space-y-3">
            <div className={`
              p-4 rounded-lg text-center font-bold
              ${isCompleted 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
              }
            `}>
              {isCompleted ? '✓ 완료된 수업입니다' : '✕ 취소된 수업입니다'}
            </div>
            <button
              onClick={handleDelete}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              수업 삭제
            </button>
          </div>
        )}
      </div>

      {/* 추가 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          수업 통계
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">총 인원</div>
            <div className="text-2xl font-bold text-gray-900">
              {session.members.length}명
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">출석</div>
            <div className="text-2xl font-bold text-green-600">
              {attendedCount}명
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">결석</div>
            <div className="text-2xl font-bold text-red-600">
              {session.members.length - attendedCount}명
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">출석률</div>
            <div className="text-2xl font-bold text-blue-600">
              {session.members.length > 0 
                ? Math.round((attendedCount / session.members.length) * 100)
                : 0
              }%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}