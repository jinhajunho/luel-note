interface StatusBadgeProps {
  type: 'class' | 'payment'
  value: string
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ type, value, size = 'md' }: StatusBadgeProps) {
  // 크기별 스타일
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  // 레슨 유형 색상
  const classTypeColors: Record<string, string> = {
    '인트로': 'bg-gray-100 text-gray-700 border-gray-300',
    '개인레슨': 'bg-purple-100 text-purple-700 border-purple-300',
    '듀엣레슨': 'bg-pink-100 text-pink-700 border-pink-300',
    '그룹레슨': 'bg-orange-100 text-orange-700 border-orange-300'
  }

  // 결제 타입 색상
  const paymentTypeColors: Record<string, string> = {
    '체험수업': 'bg-amber-100 text-amber-700 border-amber-300',
    '정규수업': 'bg-blue-100 text-blue-700 border-blue-300',
    '강사제공': 'bg-green-100 text-green-700 border-green-300',
    '센터제공': 'bg-yellow-100 text-yellow-700 border-yellow-300'
  }

  // 타입에 따라 색상 선택
  const colorClass = type === 'class' 
    ? classTypeColors[value] || 'bg-gray-100 text-gray-700 border-gray-300'
    : paymentTypeColors[value] || 'bg-gray-100 text-gray-700 border-gray-300'

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium rounded-full border
        ${sizeClasses[size]}
        ${colorClass}
      `}
    >
      {value}
    </span>
  )
}
