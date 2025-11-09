// 시스템 로그 관리 유틸리티

export interface SystemLog {
  id: string
  timestamp: string
  type: 'login' | 'logout' | 'data_change' | 'system'
  user: string
  action: string
  details: string
}

const STORAGE_KEY = 'systemLogs'

// 시스템 로그 가져오기
export function getSystemLogs(): SystemLog[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('시스템 로그 로드 실패:', error)
  }
  
  return []
}

// 시스템 로그 추가
export function addSystemLog(log: Omit<SystemLog, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return
  
  try {
    const logs = getSystemLogs()
    const newLog: SystemLog = {
      id: String(Date.now()),
      timestamp: new Date().toISOString(),
      ...log
    }
    
    const updatedLogs = [newLog, ...logs].slice(0, 100) // 최대 100개만 유지
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs))
    
    // storage 이벤트 발생 (다른 탭에서도 업데이트 받기 위해)
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(updatedLogs)
    }))
  } catch (error) {
    console.error('시스템 로그 추가 실패:', error)
  }
}

// 시스템 로그 초기화 (필요시)
export function clearSystemLogs(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}


