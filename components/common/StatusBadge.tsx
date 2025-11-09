"use client"

// components/common/StatusBadge.tsx
import { lessonTypeColors, paymentTypeColors, lessonStatusColors, LessonType, PaymentType, LessonStatus } from '@/lib/tokens'
import { getLessonTypes, getPaymentTypes, colorToLessonTypeClass, colorToPaymentTypeClass } from '@/lib/utils/lesson-types'

type BadgeVariant = 'class' | 'payment' | 'status'

type ValueByVariant<T extends BadgeVariant> =
  T extends 'class' ? LessonType :
  T extends 'payment' ? PaymentType :
  LessonStatus

interface StatusBadgeProps<T extends BadgeVariant = BadgeVariant> {
  type: T
  value: ValueByVariant<T>
  className?: string
  size?: 'sm' | 'md'
}


export default function StatusBadge<T extends BadgeVariant>({ type, value, className = '', size = 'md' }: StatusBadgeProps<T>) {
  const getColorClass = (): string => {
    switch (type) {
      case 'class': {
        // 동적 레슨 타입에서 색상 가져오기
        if (typeof window !== 'undefined') {
          const lessonTypes = getLessonTypes()
          const lessonType = lessonTypes.find(lt => lt.name === value)
          if (lessonType) {
            return colorToLessonTypeClass(lessonType.color)
          }
        }
        // 기본값 (하위 호환)
        return lessonTypeColors[value as LessonType] || 'bg-gray-100 text-gray-700'
      }
      case 'payment': {
        // 동적 결제 유형에서 색상 가져오기
        if (typeof window !== 'undefined') {
          const paymentTypes = getPaymentTypes()
          const paymentType = paymentTypes.find(pt => pt.name === value)
          if (paymentType) {
            return colorToPaymentTypeClass(paymentType.color)
          }
        }
        // 기본값 (하위 호환)
        return paymentTypeColors[value as PaymentType] || 'bg-gray-100 text-gray-700'
      }
      case 'status':
        return lessonStatusColors[value as LessonStatus] || 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  const colorClass = getColorClass()

  return (
    <span
      className={`inline-flex items-center ${sizeClass} rounded-md font-semibold ${colorClass} ${className}`}
    >
      {String(value)}
    </span>
  )
}
