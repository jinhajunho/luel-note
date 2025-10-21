/**
 * Date를 YYYY-MM-DD 형식으로 변환
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Date를 YYYY-MM-DD HH:mm 형식으로 변환
 */
export function formatDateTime(date: Date): string {
  const dateStr = formatDate(date)
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${dateStr} ${h}:${min}`
}

/**
 * 오늘 날짜 가져오기
 */
export function getToday(): Date {
  return new Date()
}

/**
 * 문자열을 Date로 변환
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr)
}