export function formatInstructorName(name?: string | null): string {
  if (!name) return ''
  // 이미 "강사"로 끝나면 중복 방지
  return name.endsWith(' 강사') || name.endsWith('강사') ? name : `${name} 강사`
}

export function normalizeText(value?: string | null): string {
  if (!value) return ''
  try {
    return value.normalize('NFC')
  } catch {
    return value
  }
}

/**
 * 레슨 상태를 한글로 변환
 * 영어 상태값(scheduled/completed/cancelled)을 한글 표기로 변환
 */
export function formatLessonStatus(status: 'scheduled' | 'ongoing' | 'in_progress' | 'completed' | 'cancelled'): '예정' | '완료' | '취소' | '진행중' {
  const statusMap: Record<string, '예정' | '완료' | '취소' | '진행중'> = {
    scheduled: '예정',
    ongoing: '진행중',
    in_progress: '진행중',
    completed: '완료',
    cancelled: '취소',
  }
  return statusMap[status] || '예정'
}

/**
 * 출석 상태를 표준 형식으로 변환
 * true -> "출석"
 * false -> "결석"
 * null -> "" (표시하지 않음)
 */
export function formatAttendanceStatus(attended: boolean | null): string {
  if (attended === true) return '출석'
  if (attended === false) return '결석'
  return ''
}

/**
 * 회원권 표기 형식 통일
 * {남은횟수}/{전체횟수}명 형식으로 표시
 */
export function formatMembershipDisplay(remaining: number, total: number): string {
  return `${remaining}/${total}명`
}

