// ==================== 정산 타입 정의 ====================

/**
 * 회원별 정산 데이터
 */
export interface MemberSettlement {
  memberId: string
  memberName: string
  totalSessions: number
  lessonTypes: {
    intro: number
    personal: number
    duet: number
    group: number
  }
  paymentTypes: {
    trial: number
    regular: number
    instructor: number
    center: number
  }
  expanded: boolean
}

/**
 * 강사별 정산 데이터 (관리자용)
 */
export interface InstructorSettlement {
  instructorId: string
  instructorName: string
  totalSessions: number
  members: MemberSettlement[]
  expanded: boolean
}

/**
 * 레슨 타입별 집계
 */
export interface ClassTypeCount {
  classType: string
  count: number
}

/**
 * 결제 타입별 집계
 */
export interface PaymentTypeCount {
  paymentType: string
  count: number
}

/**
 * 회원별 집계 (강사용)
 */
export interface MemberSummary {
  memberName: string
  classTypeCounts: ClassTypeCount[]
  paymentTypeCounts: PaymentTypeCount[]
  totalCount: number
}

/**
 * 강사 정산 데이터
 */
export interface InstructorSettlementData {
  instructorName: string
  year: number
  month: number
  members: MemberSummary[]
  totalCount: number
}

/**
 * DB에서 반환되는 정산 로우 데이터
 */
export interface SettlementRow {
  instructor_id: string
  instructor_name: string
  member_id: string
  member_name: string
  class_type_name: string
  payment_type_name: string
  session_count: number
}
