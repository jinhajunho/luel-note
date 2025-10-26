/**
 * 인증 관련 헬퍼 함수
 * 전화번호를 이메일로 변환하여 Supabase Auth 사용
 */

// ==================== 전화번호 <-> 이메일 변환 ====================

/**
 * 전화번호를 이메일 형식으로 변환
 * @example phoneToEmail('01012345678') // '01012345678@luel.local'
 */
export function phoneToEmail(phone: string): string {
  const normalized = phone.replace(/-/g, '') // 하이픈 제거
  return `${normalized}@luel.local`
}

/**
 * 이메일에서 전화번호 추출
 * @example emailToPhone('01012345678@luel.local') // '01012345678'
 */
export function emailToPhone(email: string): string {
  return email.replace('@luel.local', '')
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
