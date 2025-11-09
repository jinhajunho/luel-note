// 레슨 타입 및 결제 유형 관리 (공통)

export interface LessonType {
  id: string
  name: string
  maxMembers: number
  color: string
  active: boolean
}

export interface PaymentType {
  id: string
  name: string
  color: string
  active: boolean
}

// 기본 레슨 타입
export const DEFAULT_LESSON_TYPES: LessonType[] = [
  { id: '1', name: '인트로', maxMembers: 1, color: 'gray', active: true },
  { id: '2', name: '개인레슨', maxMembers: 1, color: 'purple', active: true },
  { id: '3', name: '듀엣레슨', maxMembers: 2, color: 'pink', active: true },
  { id: '4', name: '그룹레슨', maxMembers: 4, color: 'orange', active: true },
]

// 기본 결제 유형
export const DEFAULT_PAYMENT_TYPES: PaymentType[] = [
  { id: '1', name: '체험수업', color: 'orange', active: true },
  { id: '2', name: '정규수업', color: 'blue', active: true },
  { id: '3', name: '강사제공', color: 'green', active: true },
  { id: '4', name: '센터제공', color: 'yellow', active: true },
]

// 로컬 스토리지에서 레슨 타입 가져오기
export function getLessonTypes(): LessonType[] {
  if (typeof window === 'undefined') return DEFAULT_LESSON_TYPES
  
  const stored = localStorage.getItem('lessonTypes')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return DEFAULT_LESSON_TYPES
    }
  }
  return DEFAULT_LESSON_TYPES
}

// 로컬 스토리지에 레슨 타입 저장
export function saveLessonTypes(types: LessonType[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('lessonTypes', JSON.stringify(types))
}

// 로컬 스토리지에서 결제 유형 가져오기
export function getPaymentTypes(): PaymentType[] {
  if (typeof window === 'undefined') return DEFAULT_PAYMENT_TYPES
  
  const stored = localStorage.getItem('paymentTypes')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return DEFAULT_PAYMENT_TYPES
    }
  }
  return DEFAULT_PAYMENT_TYPES
}

// 로컬 스토리지에 결제 유형 저장
export function savePaymentTypes(types: PaymentType[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('paymentTypes', JSON.stringify(types))
}

// 레슨 타입 이름으로 최대 인원 가져오기
export function getMaxMembersByTypeName(typeName: string, lessonTypes: LessonType[]): number {
  const lessonType = lessonTypes.find(lt => lt.name === typeName)
  return lessonType?.maxMembers || 1
}

// 색상 이름을 Tailwind 클래스로 변환 (레슨 타입용 - 진한 배경)
export function colorToLessonTypeClass(color: string): string {
  switch (color) {
    case 'gray': return 'bg-gray-500 text-white'
    case 'purple': return 'bg-purple-500 text-white'
    case 'pink': return 'bg-pink-500 text-white'
    case 'orange': return 'bg-orange-500 text-white'
    case 'blue': return 'bg-blue-500 text-white'
    case 'green': return 'bg-green-500 text-white'
    case 'yellow': return 'bg-yellow-500 text-white'
    case 'red': return 'bg-red-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

// 색상 이름을 Tailwind 클래스로 변환 (결제 유형용 - 연한 배경)
export function colorToPaymentTypeClass(color: string): string {
  switch (color) {
    case 'gray': return 'bg-gray-100 text-gray-700'
    case 'purple': return 'bg-purple-100 text-purple-700'
    case 'pink': return 'bg-pink-100 text-pink-700'
    case 'orange': return 'bg-orange-100 text-orange-700'
    case 'blue': return 'bg-blue-100 text-blue-700'
    case 'green': return 'bg-green-100 text-green-700'
    case 'yellow': return 'bg-yellow-100 text-yellow-700'
    case 'red': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}
