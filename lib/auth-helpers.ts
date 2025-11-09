/**
 * 인증 관련 헬퍼 함수
 */

const DEFAULT_FAKE_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_COGNITO_FAKE_EMAIL_DOMAIN ||
  process.env.COGNITO_FAKE_EMAIL_DOMAIN ||
  'luel-note.local'

// ==================== 전화번호 <-> 이메일 변환 ====================

/**
 * 전화번호를 이메일 형식으로 변환
 * @example phoneToEmail('01012345678') // '01012345678@example.com'
 */
export function phoneToEmail(phone: string): string {
  const normalized = phone.replace(/-/g, '') // 하이픈 제거
  return `${normalized}@${DEFAULT_FAKE_EMAIL_DOMAIN}`
}

/**
 * 이메일에서 전화번호 추출
 * @example emailToPhone('01012345678@example.com') // '01012345678'
 */
export function emailToPhone(email: string): string {
  // 앞의 로컬파트(전화번호)만 추출
  return email.split('@')[0]
}

// ==================== 전화번호 정규화 ====================

/**
 * 전화번호 정규화 (하이픈 제거)
 * @example normalizePhone('010-1234-5678') // '01012345678'
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

/**
 * 전화번호 포맷팅 (하이픈 추가)
 * @example formatPhone('01012345678') // '010-1234-5678'
 */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone)
  
  if (normalized.length === 10) {
    // 010-XXX-XXXX
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`
  } else if (normalized.length === 11) {
    // 010-XXXX-XXXX
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`
  }
  
  return phone
}

// ==================== 전화번호 유효성 검사 ====================

/**
 * 전화번호 유효성 검사
 * @example validatePhone('01012345678') // true
 */
export function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone)
  
  // 10자리 또는 11자리 숫자
  if (!/^\d{10,11}$/.test(normalized)) {
    return false
  }
  
  // 010, 011, 016, 017, 018, 019로 시작
  if (!/^01[016789]/.test(normalized)) {
    return false
  }
  
  return true
}

/**
 * 전화번호를 E.164 형식으로 변환 (기본 국가코드 +82)
 */
export function phoneToE164(phone: string): string {
  const normalized = normalizePhone(phone)
  if (normalized.startsWith('0')) {
    return `+82${normalized.slice(1)}`
  }
  if (normalized.startsWith('+')) {
    return normalized
  }
  return `+${normalized}`
}
