// components/common/MemberCard.tsx
import { memberStatusColors } from '@/lib/tokens'

type MemberStatus = '활성' | '만료' | '소진'

interface MemberCardProps {
  name: string
  phone: string
  remainingLessons: number
  status?: MemberStatus
  onClick?: () => void
  className?: string
}

export default function MemberCard({
  name,
  phone,
  remainingLessons,
  status = '활성',
  onClick,
  className = '',
}: MemberCardProps) {
  const statusColor = memberStatusColors[status] || memberStatusColors.활성

  return (
    <div
      className={`bg-white border border-[#f0ebe1] rounded-xl p-4 cursor-pointer transition-all hover:border-[#e8dcc8] hover:shadow-sm hover:-translate-y-0.5 ${className}`}
      onClick={onClick}
    >
      {/* 이름 + 상태 */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[15px] font-semibold text-gray-900">{name}</div>
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColor}`}
        >
          {status}
        </span>
      </div>

      {/* 연락처 */}
      <div className="text-[13px] text-[#7a6f61] mb-2">{phone}</div>

      {/* 남은 레슨 */}
      <div className="text-sm text-gray-900">
        남은 레슨: <span className="font-bold text-blue-600">{remainingLessons}회</span>
      </div>
    </div>
  )
}
