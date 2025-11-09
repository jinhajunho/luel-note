export type ClassType = '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
export type PaymentType = '체험수업' | '정규수업' | '강사제공' | '센터제공'
export type ClassStatus = 'scheduled' | 'ongoing' | 'in_progress' | 'completed' | 'cancelled'

export type ClassId = string
export type MemberId = string
export type InstructorId = string

export type ClassMember = {
  memberId: MemberId
  memberName: string
  attended: boolean | null
  checkInTime?: string
  paymentType?: PaymentType
}

export type ClassEntity = {
  id: ClassId
  date: string // YYYY-MM-DD
  time: string // HH:mm
  instructorId: InstructorId
  instructorName: string
  classType: ClassType
  paymentType: PaymentType
  status: ClassStatus
  members: ClassMember[]
  capacity?: number
}

// UI용 레슨 타입 (기존 Lesson과 호환)
export type Lesson = ClassEntity
export type LessonMember = ClassMember
export type LessonStatus = ClassStatus

export type TransitionEvent =
  | { type: 'SCHEDULE' }
  | { type: 'START' }
  | { type: 'COMPLETE' }
  | { type: 'CANCEL' }
  | { type: 'REOPEN' }

export const allowedTransitions: Record<ClassStatus, ClassStatus[]> = {
  scheduled: ['ongoing', 'in_progress', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['in_progress'], // admin-only reopen
  cancelled: ['scheduled'], // admin-only reschedule
}


