export function formatPhone(phone: string): string {
  if (!phone) return ''
  
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '')
  
  // 010-1234-5678 형식 (11자리)
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  
  // 010-123-4567 형식 (10자리)
  if (numbers.length === 10) {
    return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  
  return phone
}

export function validatePhone(phone: string): boolean {
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '')
  
  // 10자리 또는 11자리
  return /^\d{10,11}$/.test(numbers)
}

export function normalizePhone(phone: string): string {
  // 숫자만 추출하여 반환
  return phone.replace(/\D/g, '')
}