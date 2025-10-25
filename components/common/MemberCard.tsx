import Link from 'next/link'

interface MemberCardProps {
  id: string
  name: string
  phone: string
  status: 'active' | 'inactive' | 'guest'
  joinDate?: string
  remainingLessons?: number
  onClick?: () => void
  showLink?: boolean
}

export default function MemberCard({
  id,
  name,
  phone,
  status,
  joinDate,
  remainingLessons,
  onClick,
  showLink = true
}: MemberCardProps) {
  const statusConfig = {
    active: { text: '활동', color: 'bg-green-100 text-green-700 border-green-300' },
    inactive: { text: '비활동', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    guest: { text: '게스트', color: 'bg-blue-100 text-blue-700 border-blue-300' }
  }

  const config = statusConfig[status]

  const content = (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* 헤더: 이름 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
        <span className={`
          px-2 py-1 text-xs font-medium rounded-full border
          ${config.color}
        `}>
          {config.text}
        </span>
      </div>

      {/* 전화번호 */}
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="text-sm text-gray-600">{phone}</span>
      </div>

      {/* 가입일 */}
      {joinDate && (
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-600">가입일: {joinDate}</span>
        </div>
      )}

      {/* 남은 레슨 */}
      {remainingLessons !== undefined && (
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-600">
            남은 레슨: <span className="font-bold text-blue-600">{remainingLessons}회</span>
          </span>
        </div>
      )}
    </div>
  )

  // 링크로 감싸기
  if (showLink) {
    return <Link href={`/members/${id}`}>{content}</Link>
  }

  return content
}
