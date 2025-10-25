import Link from 'next/link'
import StatusBadge from './StatusBadge'

interface LessonCardProps {
  id: string
  date: string
  time: string
  classType: string
  paymentType: string
  instructor?: string
  members: string[]
  status?: 'scheduled' | 'completed' | 'cancelled'
  onClick?: () => void
  showLink?: boolean
}

export default function LessonCard({
  id,
  date,
  time,
  classType,
  paymentType,
  instructor,
  members,
  status = 'scheduled',
  onClick,
  showLink = true
}: LessonCardProps) {
  const statusText = {
    scheduled: '예정',
    completed: '완료',
    cancelled: '취소'
  }

  const statusColor = {
    scheduled: 'text-blue-600',
    completed: 'text-gray-500',
    cancelled: 'text-red-600'
  }

  const content = (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* 헤더: 시간 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-gray-900">{time}</span>
        </div>
        <span className={`text-sm font-medium ${statusColor[status]}`}>
          {statusText[status]}
        </span>
      </div>

      {/* 레슨 유형 + 결제 타입 */}
      <div className="flex items-center gap-2 mb-3">
        <StatusBadge type="class" value={classType} size="sm" />
        <StatusBadge type="payment" value={paymentType} size="sm" />
      </div>

      {/* 강사 정보 */}
      {instructor && (
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm text-gray-600">{instructor}</span>
        </div>
      )}

      {/* 회원 정보 */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-sm text-gray-600">
          {members.length > 0 ? members.join(', ') : '회원 없음'}
        </span>
      </div>
    </div>
  )

  // 링크로 감싸기
  if (showLink) {
    return <Link href={`/sessions/${id}`}>{content}</Link>
  }

  return content
}
