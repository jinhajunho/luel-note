// 정산 시스템 타입 정의
// 위치: types/settlement.ts

// ==================== 레슨 유형별 집계 ====================
export type ClassTypeCount = {
  classType: string
  count: number
}

// ==================== 결제 타입별 집계 ====================
export type PaymentTypeCount = {
  paymentType: string
  count: number
}

// ==================== 회원별 정산 요약 ====================
export type MemberSettlement = {
  memberId: string
  memberName: string
  totalCount: number
  classTypeCounts: ClassTypeCount[]
  paymentTypeCounts: PaymentTypeCount[]
  expanded?: boolean
}

// ==================== 강사별 정산 요약 (관리자용) ====================
export type InstructorSettlement = {
  instructorId: string
  instructorName: string
  totalCount: number
  members: MemberSettlement[]
  expanded?: boolean
}

// ==================== 월별 정산 (강사용) ====================
export type MonthlySettlement = {
  year: number
  month: number
  instructorId: string
  instructorName: string
  totalCount: number
  members: MemberSettlement[]
}

// ==================== 정산 집계 요청 파라미터 ====================
export type SettlementQueryParams = {
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  instructorId?: string  // 강사 필터 (선택)
}

// ==================== Supabase RPC 응답 타입 ====================
export type SettlementRPCResponse = {
  instructor_id: string
  instructor_name: string
  member_id: string
  member_name: string
  class_type: string
  payment_type: string
  lesson_count: number
}
