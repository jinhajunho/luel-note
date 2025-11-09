"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import PopoverSelect, { PopoverOption } from '@/components/common/PopoverSelect'
import { setMemberRole, getAllProfiles } from '@/app/actions/members'
import { DEFAULT_LESSON_TYPES, DEFAULT_PAYMENT_TYPES, saveLessonTypes, savePaymentTypes } from '@/lib/utils/lesson-types'
import { getSystemLogs, SystemLog, addSystemLog, clearSystemLogs } from '@/lib/utils/system-log'
import { normalizeText } from '@/lib/utils/text'

interface User {
  id: string
  name: string
  phone: string
  role: 'guest' | 'member' | 'instructor' | 'admin'
}

interface LessonType {
  id: string
  name: string
  maxMembers: number
  color: string
  active: boolean
}

interface PaymentType {
  id: string
  name: string
  color: string
  active: boolean
}


type AdminTab = 'permissions' | 'lessonTypes' | 'paymentTypes' | 'systemLogs'

interface AdminSettingsModalProps {
  onClose: () => void
  onRoleChange?: () => void // 권한 변경 후 콜백
}

export default function AdminSettingsModal({ onClose, onRoleChange }: AdminSettingsModalProps) {
  const auth = useAuth()
  const { profile: authProfile, refreshProfile } = auth
  const [activeTab, setActiveTab] = useState<AdminTab>('permissions')
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'guest' | 'member' | 'instructor' | 'admin'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  // 수업 유형 관리
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([])
  const [editingLessonType, setEditingLessonType] = useState<LessonType | null>(null)
  const [showLessonTypeForm, setShowLessonTypeForm] = useState(false)

  // 결제 유형 관리
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null)
  const [showPaymentTypeForm, setShowPaymentTypeForm] = useState(false)

  // 시스템 로그
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])

  const groupedLogs = useMemo(() => {
    if (systemLogs.length === 0) return []

    const groups = new Map<string, { display: string; items: SystemLog[] }>()
    systemLogs.forEach((log) => {
      const timestamp = new Date(log.timestamp)
      const dateKey = timestamp.toISOString().slice(0, 10)
      const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(timestamp)
      const display = `${timestamp.getFullYear()}년 ${timestamp.getMonth() + 1}월 ${timestamp.getDate()}일 (${weekday})`

      const entry = groups.get(dateKey)
      if (entry) {
        entry.items.push(log)
      } else {
        groups.set(dateKey, { display, items: [log] })
      }
    })

    return Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, value]) => ({
        key,
        display: value.display,
        items: [...value.items].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
      }))
  }, [systemLogs])

  // 사용자 데이터 로드 함수 (useCallback으로 메모이제이션)
  const loadUsers = useCallback(async () => {
    try {
      const result = await getAllProfiles()
      
      if (!result.success) {
        console.error('사용자 목록 조회 실패:', result.error)
        return
      }

      console.log('✅ 로드된 사용자 데이터:', result.data)

      if (result.data) {
        // role이 null이어도 포함 (모든 프로필 표시)
        const users: User[] = result.data
          .map(p => ({
            id: p.id,
            name: normalizeText(p.name) || '(이름 없음)',
            phone: normalizeText(p.phone) || '(전화번호 없음)',
            role: (p.role || 'guest') as User['role']
          }))
        console.log('✅ 변환된 사용자 목록:', users)
        console.log('✅ 총 사용자 수:', users.length)
        setUsers(users)
      } else {
        console.warn('⚠️ 사용자 데이터가 없습니다')
      }
    } catch (err) {
      console.error('사용자 목록 로드 오류:', err)
    }
  }, [])

  // 서버 액션을 통해 사용자 데이터 로드 (RLS 정책 우회)
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // 수업 유형 로드 및 저장
  useEffect(() => {
    // 로컬 스토리지에서 로드, 없으면 기본값
    const stored = typeof window !== 'undefined' ? localStorage.getItem('lessonTypes') : null
    if (stored) {
      try {
        setLessonTypes(JSON.parse(stored))
      } catch {
        setLessonTypes(DEFAULT_LESSON_TYPES)
        saveLessonTypes(DEFAULT_LESSON_TYPES)
      }
    } else {
      setLessonTypes(DEFAULT_LESSON_TYPES)
      saveLessonTypes(DEFAULT_LESSON_TYPES)
    }
  }, [])

  // 수업 유형 변경 시 저장
  useEffect(() => {
    if (lessonTypes.length > 0) {
      saveLessonTypes(lessonTypes)
    }
  }, [lessonTypes])

  // 결제 유형 로드 및 저장
  useEffect(() => {
    // 로컬 스토리지에서 로드, 없으면 기본값
    const stored = typeof window !== 'undefined' ? localStorage.getItem('paymentTypes') : null
    if (stored) {
      try {
        setPaymentTypes(JSON.parse(stored))
      } catch {
        setPaymentTypes(DEFAULT_PAYMENT_TYPES)
        savePaymentTypes(DEFAULT_PAYMENT_TYPES)
      }
    } else {
      setPaymentTypes(DEFAULT_PAYMENT_TYPES)
      savePaymentTypes(DEFAULT_PAYMENT_TYPES)
    }
  }, [])

  // 결제 유형 변경 시 저장
  useEffect(() => {
    if (paymentTypes.length > 0) {
      savePaymentTypes(paymentTypes)
    }
  }, [paymentTypes])

  // 시스템 로그 로드 및 업데이트
  useEffect(() => {
    const loadLogs = () => {
      const logs = getSystemLogs()
      if (logs && logs.length > 0) {
        setSystemLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
      } else {
        setSystemLogs([])
      }
    }
    
    loadLogs()
    
    // 로컬 스토리지 변경 감지
    const handleStorageChange = () => {
      loadLogs()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 같은 탭에서의 변경 감지를 위한 interval
    const interval = setInterval(() => {
      loadLogs()
    }, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // 필터링
  useEffect(() => {
    let filtered = users

    // 사용자 타입 필터
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(u => u.role === userTypeFilter)
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.phone.includes(query)
      )
    }

    setFilteredUsers(filtered)
  }, [users, userTypeFilter, searchQuery])

  // 역할 변경
  const handleRoleChange = async (user: User, newRole: 'guest' | 'member' | 'instructor' | 'admin') => {
    if (user.role === newRole) return

    setUpdatingRole(user.id)
    try {
      const result = await setMemberRole(user.phone, newRole)
      if (result.success) {
        // 사용자 목록 업데이트
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
        
        // DB 업데이트 완료 대기 (약간의 지연)
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // 본인의 권한을 변경한 경우 프로필 새로고침 및 리다이렉트
        const currentUserPhone = authProfile?.phone
        if (currentUserPhone && user.phone === currentUserPhone) {
          console.log('🔄 본인 권한 변경 감지 - 프로필 새로고침 및 리다이렉트')
          // 프로필 새로고침 (여러 번 시도하여 최신 데이터 가져오기)
          await refreshProfile()
          await new Promise(resolve => setTimeout(resolve, 300))
          await refreshProfile()
          
          // 권한에 맞는 기본 페이지로 리다이렉트
          const roleRoutes = {
            admin: '/admin/schedule',
            instructor: '/instructor/schedule',
            member: '/member/schedule',
            guest: '/member/schedule',
          }
          
          const targetRoute = roleRoutes[newRole] || '/member/schedule'
          
          // 약간의 지연 후 알림 및 리다이렉트
          setTimeout(() => {
            alert(`${user.name}님의 역할이 ${newRole === 'admin' ? '관리자' : newRole === 'instructor' ? '강사' : '회원'}으로 변경되었습니다.\n변경사항이 반영되었습니다.`)
            // 페이지 리다이렉트
            window.location.href = targetRoute
          }, 500)
        } else {
          alert(`${user.name}의 역할이 ${newRole === 'admin' ? '관리자' : newRole === 'instructor' ? '강사' : '회원'}으로 변경되었습니다`)
        }
        
        // 사용자 목록 새로고침 (다른 사용자 권한 변경 시에도 반영)
        await new Promise(resolve => setTimeout(resolve, 200))
        await loadUsers()
        
        // 권한 변경 콜백 호출 (회원 목록 새로고침 등)
        if (onRoleChange) {
          console.log('🔄 권한 변경 콜백 호출')
          onRoleChange()
        }
      } else {
        alert(`역할 변경 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('역할 변경 오류:', error)
      alert('역할 변경 중 오류가 발생했습니다')
    } finally {
      setUpdatingRole(null)
    }
  }

  // 레슨 타입 추가/수정
  const handleSaveLessonType = () => {
    if (!editingLessonType) return
    
    const isEdit = editingLessonType.id && lessonTypes.find(lt => lt.id === editingLessonType.id)
    const actionName = isEdit ? '수업 유형 변경' : '수업 유형 추가'
    
    if (editingLessonType.id && lessonTypes.find(lt => lt.id === editingLessonType.id)) {
      // 수정
      const oldType = lessonTypes.find(lt => lt.id === editingLessonType.id)
      setLessonTypes(prev => prev.map(lt => 
        lt.id === editingLessonType.id ? editingLessonType : lt
      ))
      
      // 시스템 로그 추가
      addSystemLog({
        type: 'data_change',
        user: authProfile?.name || '관리자',
        action: '수업 유형 변경',
        details: `수업 유형명: ${oldType?.name} → ${editingLessonType.name}, 최대 인원: ${oldType?.maxMembers}명 → ${editingLessonType.maxMembers}명, 색상: ${oldType?.color} → ${editingLessonType.color}. 수업 유형이 변경되었습니다.`
      })
    } else {
      // 추가
      const newId = String(Date.now())
      setLessonTypes(prev => [...prev, { ...editingLessonType, id: newId }])
      
      // 시스템 로그 추가
      addSystemLog({
        type: 'data_change',
        user: authProfile?.name || '관리자',
        action: '수업 유형 추가',
        details: `수업 유형명: ${editingLessonType.name}, 최대 인원: ${editingLessonType.maxMembers}명, 색상: ${editingLessonType.color}. 수업 유형이 추가되었습니다.`
      })
    }
    
    setEditingLessonType(null)
    setShowLessonTypeForm(false)
    alert('수업 유형이 저장되었습니다')
  }

  // 수업 유형 삭제
  const handleDeleteLessonType = (id: string) => {
    if (confirm('이 수업 유형을 삭제하시겠습니까?')) {
      setLessonTypes(prev => prev.filter(lt => lt.id !== id))
      alert('수업 유형이 삭제되었습니다')
    }
  }

  // 결제 유형 추가/수정
  const handleSavePaymentType = () => {
    if (!editingPaymentType) return
    
    const isEdit = editingPaymentType.id && paymentTypes.find(pt => pt.id === editingPaymentType.id)
    
    if (editingPaymentType.id && paymentTypes.find(pt => pt.id === editingPaymentType.id)) {
      // 수정
      const oldType = paymentTypes.find(pt => pt.id === editingPaymentType.id)
      setPaymentTypes(prev => prev.map(pt => 
        pt.id === editingPaymentType.id ? editingPaymentType : pt
      ))
      
      // 시스템 로그 추가
      addSystemLog({
        type: 'data_change',
        user: authProfile?.name || '관리자',
        action: '결제 유형 변경',
        details: `결제 유형명: ${oldType?.name} → ${editingPaymentType.name}, 색상: ${oldType?.color} → ${editingPaymentType.color}. 결제 유형이 변경되었습니다.`
      })
    } else {
      // 추가
      const newId = String(Date.now())
      setPaymentTypes(prev => [...prev, { ...editingPaymentType, id: newId }])
      
      // 시스템 로그 추가
      addSystemLog({
        type: 'data_change',
        user: authProfile?.name || '관리자',
        action: '결제 유형 추가',
        details: `결제 유형명: ${editingPaymentType.name}, 색상: ${editingPaymentType.color}. 결제 유형이 추가되었습니다.`
      })
    }
    
    setEditingPaymentType(null)
    setShowPaymentTypeForm(false)
    alert('결제 유형이 저장되었습니다')
  }

  // 결제 유형 삭제
  const handleDeletePaymentType = (id: string) => {
    const paymentType = paymentTypes.find(pt => pt.id === id)
    if (!paymentType) return
    
    if (confirm('이 결제 유형을 삭제하시겠습니까?')) {
      setPaymentTypes(prev => prev.filter(pt => pt.id !== id))
      
      // 시스템 로그 추가
      addSystemLog({
        type: 'data_change',
        user: authProfile?.name || '관리자',
        action: '결제 유형 삭제',
        details: `결제 유형명: ${paymentType.name}. 결제 유형이 삭제되었습니다.`
      })
      
      alert('결제 유형이 삭제되었습니다')
    }
  }


  const roleOptions: PopoverOption[] = [
    { label: '비회원', value: 'guest' },
    { label: '회원', value: 'member' },
    { label: '강사', value: 'instructor' },
    { label: '관리자', value: 'admin' }
  ]

  const colorOptions: PopoverOption[] = [
    { label: '회색', value: 'gray', colorDot: 'bg-gray-400' },
    { label: '보라', value: 'purple', colorDot: 'bg-purple-500' },
    { label: '핑크', value: 'pink', colorDot: 'bg-pink-500' },
    { label: '주황', value: 'orange', colorDot: 'bg-orange-500' },
    { label: '파랑', value: 'blue', colorDot: 'bg-blue-500' },
    { label: '초록', value: 'green', colorDot: 'bg-green-500' },
    { label: '노랑', value: 'yellow', colorDot: 'bg-yellow-500' },
    { label: '빨강', value: 'red', colorDot: 'bg-red-500' },
  ]

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-blue-100 text-blue-700'
      case 'logout': return 'bg-gray-100 text-gray-700'
      case 'data_change': return 'bg-yellow-100 text-yellow-700'
      case 'system': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-5" onMouseDown={(e)=>{ if(e.currentTarget===e.target) onClose() }}>
      <div className="bg-white rounded-2xl max-w-3xl w-full h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
          <div className="text-lg font-semibold text-[#1a1a1a]">관리자 설정</div>
          <button onClick={onClose} aria-label="닫기" className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-b border-[#f0ebe1] px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            권한 설정
          </button>
          <button
            onClick={() => setActiveTab('lessonTypes')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'lessonTypes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            수업 유형
          </button>
          <button
            onClick={() => setActiveTab('paymentTypes')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'paymentTypes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            결제 유형
          </button>
          <button
            onClick={() => setActiveTab('systemLogs')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'systemLogs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            시스템 로그
          </button>
        </div>

        {/* 탭 내용 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 권한 설정 탭 */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              {/* 검색 바 */}
              <div className="bg-white border border-[#f0ebe1] rounded-lg">
                <div className="flex items-center gap-2 px-4 py-2">
                  <svg className="w-5 h-5 text-[#7a6f61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이름 또는 전화번호로 검색"
                    className="flex-1 border-0 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* 사용자 타입 필터 */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setUserTypeFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    userTypeFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-[#f0ebe1] text-[#7a6f61] hover:border-blue-300'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setUserTypeFilter('instructor')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    userTypeFilter === 'instructor'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-[#f0ebe1] text-[#7a6f61] hover:border-blue-300'
                  }`}
                >
                  강사
                </button>
                <button
                  onClick={() => setUserTypeFilter('member')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    userTypeFilter === 'member'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-[#f0ebe1] text-[#7a6f61] hover:border-blue-300'
                  }`}
                >
                  회원
                </button>
                <button
                  onClick={() => setUserTypeFilter('guest')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    userTypeFilter === 'guest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-[#f0ebe1] text-[#7a6f61] hover:border-blue-300'
                  }`}
                >
                  비회원
                </button>
                <button
                  onClick={() => setUserTypeFilter('admin')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    userTypeFilter === 'admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-[#f0ebe1] text-[#7a6f61] hover:border-blue-300'
                  }`}
                >
                  관리자
                </button>
              </div>

              {/* 사용자 목록 */}
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-[#7a6f61]">
                    검색 결과가 없습니다
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-white border border-[#f0ebe1] rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#1a1a1a]">{user.name}</div>
                        <div className="text-xs text-[#7a6f61]">{user.phone}</div>
                      </div>
                      <div className="w-32">
                        <PopoverSelect
                          label=""
                          value={user.role}
                          onChange={(value) => handleRoleChange(user, value as 'guest' | 'member' | 'instructor' | 'admin')}
                          options={roleOptions}
                          disabled={updatingRole === user.id}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 수업 유형 탭 */}
          {activeTab === 'lessonTypes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-[#7a6f61]">수업 유형 관리</div>
                <button
                  onClick={() => {
                    setEditingLessonType({ id: '', name: '', maxMembers: 1, color: 'gray', active: true })
                    setShowLessonTypeForm(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + 추가
                </button>
              </div>

              {showLessonTypeForm && editingLessonType && (
                <div className="p-4 bg-white border-2 border-blue-300 rounded-lg space-y-3">
                  <div>
                    <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">수업 유형명</label>
                    <input
                      type="text"
                      value={editingLessonType.name}
                      onChange={(e) => setEditingLessonType({ ...editingLessonType, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="예: 인트로"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">최대 인원</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editingLessonType.maxMembers || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        // 빈 문자열이거나 유효한 숫자인지 확인
                        if (value === '') {
                          setEditingLessonType({ ...editingLessonType, maxMembers: 1 })
                        } else {
                          const numValue = parseInt(value, 10)
                          if (!isNaN(numValue) && numValue >= 1) {
                            setEditingLessonType({ ...editingLessonType, maxMembers: numValue })
                          }
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">색상</label>
                    <PopoverSelect
                      label=""
                      value={editingLessonType.color}
                      onChange={(value) => setEditingLessonType({ ...editingLessonType, color: value })}
                      options={colorOptions}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveLessonType}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingLessonType(null)
                        setShowLessonTypeForm(false)
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {lessonTypes.map((lt) => (
                  <div
                    key={lt.id}
                    className="flex items-center justify-between p-3 bg-white border border-[#f0ebe1] rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        lt.color === 'gray' ? 'bg-gray-400' :
                        lt.color === 'purple' ? 'bg-purple-500' :
                        lt.color === 'pink' ? 'bg-pink-500' :
                        lt.color === 'orange' ? 'bg-orange-500' :
                        lt.color === 'blue' ? 'bg-blue-500' :
                        lt.color === 'green' ? 'bg-green-500' :
                        lt.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="text-sm font-medium text-[#1a1a1a]">{lt.name}</div>
                        <div className="text-xs text-[#7a6f61]">최대 {lt.maxMembers}명</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingLessonType(lt)
                          setShowLessonTypeForm(true)
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteLessonType(lt.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 결제 유형 탭 */}
          {activeTab === 'paymentTypes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-[#7a6f61]">결제 유형 관리</div>
                <button
                  onClick={() => {
                    setEditingPaymentType({ id: '', name: '', color: 'blue', active: true })
                    setShowPaymentTypeForm(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + 추가
                </button>
              </div>

              {showPaymentTypeForm && editingPaymentType && (
                <div className="p-4 bg-white border-2 border-blue-300 rounded-lg space-y-3">
                  <div>
                    <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">결제 유형명</label>
                    <input
                      type="text"
                      value={editingPaymentType.name}
                      onChange={(e) => setEditingPaymentType({ ...editingPaymentType, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="예: 정규수업"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">색상</label>
                    <PopoverSelect
                      label=""
                      value={editingPaymentType.color}
                      onChange={(value) => setEditingPaymentType({ ...editingPaymentType, color: value })}
                      options={colorOptions}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePaymentType}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingPaymentType(null)
                        setShowPaymentTypeForm(false)
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {paymentTypes.map((pt) => (
                  <div
                    key={pt.id}
                    className="flex items-center justify-between p-3 bg-white border border-[#f0ebe1] rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        pt.color === 'gray' ? 'bg-gray-400' :
                        pt.color === 'purple' ? 'bg-purple-500' :
                        pt.color === 'pink' ? 'bg-pink-500' :
                        pt.color === 'orange' ? 'bg-orange-500' :
                        pt.color === 'blue' ? 'bg-blue-500' :
                        pt.color === 'green' ? 'bg-green-500' :
                        pt.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      <div className="text-sm font-medium text-[#1a1a1a]">{pt.name}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPaymentType(pt)
                          setShowPaymentTypeForm(true)
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePaymentType(pt.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 시스템 로그 탭 */}
          {activeTab === 'systemLogs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-[#7a6f61]">시스템 활동 로그</div>
                <button
                  onClick={() => {
                    if (confirm('모든 시스템 로그를 삭제하시겠습니까?')) {
                      clearSystemLogs()
                      setSystemLogs([])
                      // TODO: 실제 시스템 로그 데이터 로드 필요
                      // 로그 초기화 후 빈 배열로 시작
                      // 아래 mockLogs는 임시 주석 처리 (목 데이터 제거)
                      /*
                      const now = new Date()
                      const mockLogs: SystemLog[] = [
                        { 
                          id: '1', 
                          timestamp: new Date(now.getTime() - 300000).toISOString(), 
                          type: 'login', 
                          user: '이지은', 
                          action: '로그인', 
                          details: '시스템 접속' 
                        },
                        { 
                          id: '2', 
                          timestamp: new Date(now.getTime() - 1800000).toISOString(), 
                          type: 'data_change', 
                          user: '관리자', 
                          action: '레슨 등록', 
                          details: '날짜: 2025-01-15, 시간: 14:00-15:00, 강사: 이지은, 회원: 홍길동. 개인레슨 레슨이 등록되었습니다.' 
                        },
                        { 
                          id: '3', 
                          timestamp: new Date(now.getTime() - 3600000).toISOString(), 
                          type: 'data_change', 
                          user: '박서준', 
                          action: '레슨 등록', 
                          details: '날짜: 2025-01-15, 시간: 10:00-11:00, 강사: 박서준, 회원: 김철수, 최유리. 그룹레슨 레슨이 등록되었습니다.' 
                        },
                        { 
                          id: '4', 
                          timestamp: new Date(now.getTime() - 5400000).toISOString(), 
                          type: 'data_change', 
                          user: '관리자', 
                          action: '회원권 등록', 
                          details: '회원: 홍길동 (010-1234-5678), 결제 유형: 정규수업, 레슨 수: 30회, 기간: 2025-01-01 ~ 2025-04-01. 회원권이 등록되었습니다.' 
                        },
                        { 
                          id: '5', 
                          timestamp: new Date(now.getTime() - 7200000).toISOString(), 
                          type: 'data_change', 
                          user: '이지은', 
                          action: '정회원 전환', 
                          details: '회원: 강민호 (010-7777-8888). 비회원에서 정회원으로 전환되었습니다.' 
                        },
                        { 
                          id: '6', 
                          timestamp: new Date(now.getTime() - 9000000).toISOString(), 
                          type: 'data_change', 
                          user: '관리자', 
                          action: '수업 유형 추가', 
                          details: '수업 유형명: 듀엣레슨, 최대 인원: 2명, 색상: pink. 수업 유형이 추가되었습니다.' 
                        },
                        { 
                          id: '7', 
                          timestamp: new Date(now.getTime() - 10800000).toISOString(), 
                          type: 'data_change', 
                          user: '관리자', 
                          action: '결제 유형 변경', 
                          details: '결제 유형명: 체험수업 → 체험레슨, 색상: orange → orange. 결제 유형이 변경되었습니다.' 
                        },
                        { 
                          id: '8', 
                          timestamp: new Date(now.getTime() - 12600000).toISOString(), 
                          type: 'data_change', 
                          user: '관리자', 
                          action: '레슨 등록', 
                          details: '날짜: 2025-01-14, 시간: 16:00-17:00, 강사: 김민지, 회원: 윤서아. 개인레슨 레슨이 등록되었습니다.' 
                        },
                        { 
                          id: '9', 
                          timestamp: new Date(now.getTime() - 14400000).toISOString(), 
                          type: 'data_change', 
                          user: '관리자', 
                          action: '결제 유형 추가', 
                          details: '결제 유형명: 프로모션, 색상: green. 결제 유형이 추가되었습니다.' 
                        },
                        { 
                          id: '10', 
                          timestamp: new Date(now.getTime() - 16200000).toISOString(), 
                          type: 'data_change', 
                          user: '박서준', 
                          action: '레슨 등록', 
                          details: '날짜: 2025-01-14, 시간: 09:00-10:00, 강사: 박서준, 회원: 없음. 인트로 레슨이 등록되었습니다.' 
                        },
                      ]
                      const sortedLogs = mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      localStorage.setItem('systemLogs', JSON.stringify(sortedLogs))
                      setSystemLogs(sortedLogs)
                      */
                    }
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                >
                  로그 초기화
                </button>
              </div>
              <div className="space-y-2">
                {groupedLogs.length === 0 ? (
                  <div className="text-center py-8 text-[#7a6f61]">로그가 없습니다</div>
                ) : (
                  groupedLogs.map((group, index) => (
                    <div key={group.key} className={`space-y-2 ${index > 0 ? 'pt-3 border-t border-[#f0ebe1]' : ''}`}>
                      <div className="text-xs font-semibold text-[#7a6f61] px-1">
                        {group.display}
                      </div>
                      {group.items.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 bg-white border border-[#f0ebe1] rounded-lg hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${getLogTypeColor(log.type)}`}>
                                {log.type === 'login' ? '로그인' : log.type === 'logout' ? '로그아웃' : log.type === 'data_change' ? '데이터 변경' : '시스템'}
                              </span>
                              <span className="text-sm font-medium text-[#1a1a1a]">{log.user}</span>
                            </div>
                            <span className="text-xs text-[#7a6f61]">{formatDateTime(log.timestamp)}</span>
                          </div>
                          <div className="text-sm text-[#1a1a1a]">{log.action}</div>
                          <div className="text-xs text-[#7a6f61] mt-1 whitespace-pre-line">{log.details}</div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}