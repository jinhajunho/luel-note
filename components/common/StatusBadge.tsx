// components/common/StatusBadge.tsx
interface StatusBadgeProps {
  type: 'class' | 'payment' | 'status'
  value: string
  className?: string
}

export default function StatusBadge({ type, value, className = '' }: StatusBadgeProps) {
  // 레슨 유형 색상 (진한 톤)
  const classTypeColors: Record<string, string> = {
    인트로: 'bg-gray-100 text-gray-700',       // 회색 (체험수업과 동일)
    개인레슨: 'bg-purple-500 text-white',      // 찐보라
    듀엣레슨: 'bg-pink-500 text-white',        // 찐핑크
    그룹레슨: 'bg-orange-500 text-white',      // 찐주황
  }

  // 결제 타입 색상 (진한 톤)
  const paymentTypeColors: Record<string, string> = {
    체험수업: 'bg-gray-100 text-gray-700',     // 회색 (인트로와 동일)
    정규수업: 'bg-blue-500 text-white',        // 찐파랑
    강사제공: 'bg-indigo-600 text-white',      // 찐남색
    센터제공: 'bg-cyan-500 text-white',        // 밝은 청록
  }

  // 레슨 상태 색상 (연한 톤)
  const statusColors: Record<string, string> = {
    예정: 'bg-blue-50 text-blue-600',          // 연파랑
    완료: 'bg-green-50 text-green-600',        // 연초록
    취소: 'bg-red-50 text-red-600',            // 연빨강
  }

  let colorClass = ''
  if (type === 'class') {
    colorClass = classTypeColors[value] || 'bg-gray-200 text-gray-700'
  } else if (type === 'payment') {
    colorClass = paymentTypeColors[value] || 'bg-gray-200 text-gray-700'
  } else if (type === 'status') {
    colorClass = statusColors[value] || 'bg-gray-200 text-gray-700'
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${colorClass} ${className}`}
    >
      {value}
    </span>
  )
}
