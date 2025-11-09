export type LessonType = '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
export type PaymentType = '체험수업' | '정규수업' | '강사제공' | '센터제공'
export type LessonStatus = '예정' | '완료' | '취소'
export type MemberStatus = '활성' | '만료' | '소진'

export const lessonTypeColors: Record<LessonType, string> = {
  인트로: 'bg-gray-100 text-gray-700',
  개인레슨: 'bg-purple-500 text-white',
  듀엣레슨: 'bg-pink-500 text-white',
  그룹레슨: 'bg-orange-500 text-white',
}

export const paymentTypeColors: Record<PaymentType, string> = {
  체험수업: 'bg-gray-100 text-gray-700',
  정규수업: 'bg-blue-500 text-white',
  강사제공: 'bg-indigo-600 text-white',
  센터제공: 'bg-cyan-500 text-white',
}

export const lessonStatusColors: Record<LessonStatus, string> = {
  예정: 'bg-blue-50 text-blue-600',
  완료: 'bg-green-50 text-green-600',
  취소: 'bg-red-50 text-red-600',
}

export const memberStatusColors: Record<MemberStatus, string> = {
  활성: 'bg-green-50 text-green-600',
  만료: 'bg-gray-100 text-gray-600',
  소진: 'bg-red-50 text-red-600',
}


