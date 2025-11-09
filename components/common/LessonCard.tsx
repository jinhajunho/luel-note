// components/common/LessonCard.tsx
import StatusBadge from './StatusBadge'
import { formatInstructorName } from '@/lib/utils/text'

interface LessonCardProps {
  date: string
  time: string
  classType: string
  paymentType?: string
  status: string
  instructor?: string
  currentCount: number
  maxCapacity: number
  members: { name: string }[]
  onClick?: () => void
  className?: string
}

export default function LessonCard({
  date,
  time,
  classType,
  paymentType,
  status,
  instructor,
  currentCount,
  maxCapacity,
  members,
  onClick,
  className = '',
}: LessonCardProps) {
  const isFull = currentCount === maxCapacity

  return (
    <div
      className={`bg-white border border-[#f0ebe1] rounded-xl p-4 cursor-pointer transition-all hover:border-[#e8dcc8] hover:shadow-sm hover:-translate-y-0.5 ${className}`}
      onClick={onClick}
    >
      {/* 헤더: 날짜/시간 + 뱃지 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="text-[15px] font-semibold text-gray-900 mb-1">{date}</div>
          <div className="text-[13px] text-[#7a6f61]">{time}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge type="class" value={classType as any} />
          {paymentType && <StatusBadge type="payment" value={paymentType as any} />}
          <StatusBadge type="status" value={status as any} />
        </div>
      </div>

      {/* 강사 + 인원 */}
      <div className="flex items-center justify-between pt-3 border-t border-[#f5f1e8] mb-2">
        {instructor && <div className="text-[13px] text-[#7a6f61]">강사: {formatInstructorName(instructor)}</div>}
        <div className={`text-sm font-bold ${isFull ? 'text-green-600' : 'text-gray-900'}`}>
          {currentCount}/{maxCapacity}명
        </div>
      </div>

      {/* 회원 목록 */}
      {members.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {members.map((member, index) => (
            <span
              key={index}
              className="px-2.5 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
            >
              {member.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
