// 기본 타입
export type Role = 'admin' | 'instructor' | 'member'
export type SessionType = 'intro' | 'personal' | 'duet' | 'group'
export type AttendanceStatus = 'present' | 'absent' | 'late'

// 사용자
export type User = {
  id: string
  email: string
  phone: string
  name: string
  role: Role
}

// 수업
export type Session = {
  id: string
  type: SessionType
  starts_at: string
  ends_at: string
  instructor_id: string
  instructor_name?: string
  capacity: number
}

// 출석
export type Attendance = {
  id: string
  session_id: string
  member_id: string
  status: AttendanceStatus
  checked_at: string
}

// 회원
export type Member = {
  id: string
  name: string
  phone: string
  pass_remain?: number
}
