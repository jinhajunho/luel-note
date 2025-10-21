'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type UserProfile = {
  phone: string
  name: string
  role: 'admin' | 'instructor' | 'member'
  birth_date?: string
  gender?: string
}

type UserPermission = {
  user_phone: string
  menu_dashboard: boolean
  menu_attendance: boolean
  menu_members: boolean
  menu_classes: boolean
  menu_settlements: boolean
  menu_settings: boolean
}

type ClassType = {
  id: string
  name: string
  color: string
  description?: string
  is_active: boolean
}

type PaymentType = {
  id: string
  name: string
  color: string
  description?: string
  is_active: boolean
}

export default function AdminSettingsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'users' | 'class-types' | 'payment-types'>('users')
  
  const [users, setUsers] = useState<UserProfile[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userPermissions, setUserPermissions] = useState<UserPermission | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [editingClassType, setEditingClassType] = useState<ClassType | null>(null)
  const [newClassTypeName, setNewClassTypeName] = useState('')
  const [newClassTypeColor, setNewClassTypeColor] = useState('#3B82F6')
  
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null)
  const [newPaymentTypeName, setNewPaymentTypeName] = useState('')
  const [newPaymentTypeColor, setNewPaymentTypeColor] = useState('#10B981')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadUsers()
      loadClassTypes()
      loadPaymentTypes()
    }
  }, [profile?.role])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('사용자 로드 오류:', error)
    }
  }

  const loadUserPermissions = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_phone', phone)
        .single()

      if (error) throw error
      setUserPermissions(data)
    } catch (error) {
      console.error('권한 로드 오류:', error)
    }
  }

  const loadClassTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('class_types')
        .select('*')
        .order('name')

      if (error) throw error
      setClassTypes(data || [])
    } catch (error) {
      console.error('수업 타입 로드 오류:', error)
    }
  }

  const loadPaymentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .order('name')

      if (error) throw error
      setPaymentTypes(data || [])
    } catch (error) {
      console.error('결제 유형 로드 오류:', error)
    }
  }

  const handleSelectUser = async (user: UserProfile) => {
    if (selectedUser?.phone === user.phone) {
      // 이미 선택된 사용자 클릭 시 접기
      setSelectedUser(null)
      setUserPermissions(null)
    } else {
      // 새 사용자 선택
      setSelectedUser(user)
      await loadUserPermissions(user.phone)
    }
  }

  const handleUpdateUserRole = async (phone: string, role: 'admin' | 'instructor' | 'member') => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('phone', phone)

      if (error) throw error

      alert('역할이 변경되었습니다!')
      await loadUsers()
      if (selectedUser?.phone === phone) {
        setSelectedUser({ ...selectedUser, role })
      }
    } catch (error) {
      console.error('역할 변경 오류:', error)
      alert('역할 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePermission = async (menuKey: keyof Omit<UserPermission, 'user_phone'>, value: boolean) => {
    if (!selectedUser || !userPermissions) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_permissions')
        .update({ [menuKey]: value })
        .eq('user_phone', selectedUser.phone)

      if (error) throw error

      setUserPermissions({ ...userPermissions, [menuKey]: value })
      alert('권한이 업데이트되었습니다!')
    } catch (error) {
      console.error('권한 업데이트 오류:', error)
      alert('권한 업데이트에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClassType = async () => {
    if (!newClassTypeName.trim()) {
      alert('수업 타입 이름을 입력하세요.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('class_types')
        .insert({
          name: newClassTypeName,
          color: newClassTypeColor,
          is_active: true
        })

      if (error) throw error

      alert('수업 타입이 추가되었습니다!')
      setNewClassTypeName('')
      setNewClassTypeColor('#3B82F6')
      await loadClassTypes()
    } catch (error) {
      console.error('수업 타입 추가 오류:', error)
      alert('수업 타입 추가에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClassType = async (id: string, updates: Partial<ClassType>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('class_types')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      alert('수업 타입이 수정되었습니다!')
      setEditingClassType(null)
      await loadClassTypes()
    } catch (error) {
      console.error('수업 타입 수정 오류:', error)
      alert('수업 타입 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePaymentType = async () => {
    if (!newPaymentTypeName.trim()) {
      alert('결제 유형 이름을 입력하세요.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('payment_types')
        .insert({
          name: newPaymentTypeName,
          color: newPaymentTypeColor,
          is_active: true
        })

      if (error) throw error

      alert('결제 유형이 추가되었습니다!')
      setNewPaymentTypeName('')
      setNewPaymentTypeColor('#10B981')
      await loadPaymentTypes()
    } catch (error) {
      console.error('결제 유형 추가 오류:', error)
      alert('결제 유형 추가에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePaymentType = async (id: string, updates: Partial<PaymentType>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('payment_types')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      alert('결제 유형이 수정되었습니다!')
      setEditingPaymentType(null)
      await loadPaymentTypes()
    } catch (error) {
      console.error('결제 유형 수정 오류:', error)
      alert('결제 유형 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 사용자 필터링
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  )

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (profile.role !== 'admin') {
    router.push('/settings')
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">권한이 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">관리자 설정</h2>
        <p className="text-sm text-gray-500 mt-1">시스템 전체 설정을 관리합니다</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
              activeTab === 'users' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            사용자 관리
          </button>
          <button
            onClick={() => setActiveTab('class-types')}
            className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
              activeTab === 'class-types' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            수업 타입
          </button>
          <button
            onClick={() => setActiveTab('payment-types')}
            className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
              activeTab === 'payment-types' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            결제 유형
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* 검색 바 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <input
                  type="text"
                  placeholder="이름 또는 전화번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 사용자 목록 */}
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    검색 결과가 없습니다
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isExpanded = selectedUser?.phone === user.phone

                    return (
                      <div 
                        key={user.phone}
                        className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden transition-colors hover:border-gray-300"
                      >
                        {/* 사용자 헤더 (항상 보임) */}
                        <button
                          onClick={() => handleSelectUser(user)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-left">
                              <div className="font-bold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-600">{user.phone}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-700' :
                              user.role === 'instructor' ? 'bg-blue-100 text-blue-700' : 
                              'bg-green-100 text-green-700'
                            }`}>
                              {user.role === 'admin' ? '관리자' : 
                               user.role === 'instructor' ? '강사' : '회원'}
                            </span>
                            <span className="text-xl text-gray-400">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </button>

                        {/* 상세 정보 (펼쳐졌을 때만) */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-6">
                            {/* 역할 변경 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                역할
                              </label>
                              <select
                                value={user.role}
                                onChange={(e) => handleUpdateUserRole(user.phone, e.target.value as any)}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="member">회원</option>
                                <option value="instructor">강사</option>
                                <option value="admin">관리자</option>
                              </select>
                            </div>

                            {/* 권한 설정 */}
                            {userPermissions && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                  메뉴 권한
                                </h4>
                                <div className="space-y-2">
                                  {[
                                    { key: 'menu_dashboard' as const, label: '대시보드' },
                                    { key: 'menu_attendance' as const, label: '출석 관리' },
                                    { key: 'menu_members' as const, label: '회원 관리' },
                                    { key: 'menu_classes' as const, label: '수업 관리' },
                                    { key: 'menu_settlements' as const, label: '정산 관리' },
                                    { key: 'menu_settings' as const, label: '설정' }
                                  ].map(({ key, label }) => (
                                    <label 
                                      key={key} 
                                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                                    >
                                      <span className="text-sm font-medium text-gray-700">
                                        {label}
                                      </span>
                                      <input
                                        type="checkbox"
                                        checked={userPermissions[key]}
                                        onChange={(e) => handleUpdatePermission(key, e.target.checked)}
                                        disabled={loading}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'class-types' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">새 수업 타입 추가</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newClassTypeName}
                    onChange={(e) => setNewClassTypeName(e.target.value)}
                    placeholder="수업 타입 이름"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="color"
                    value={newClassTypeColor}
                    onChange={(e) => setNewClassTypeColor(e.target.value)}
                    className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={handleCreateClassType}
                    disabled={loading || !newClassTypeName.trim()}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                  >
                    추가
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">수업 타입 목록</h3>
                <div className="space-y-2">
                  {classTypes.map((classType) => (
                    <div key={classType.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 rounded" style={{ backgroundColor: classType.color }} />
                      {editingClassType?.id === classType.id ? (
                        <>
                          <input
                            type="text"
                            value={editingClassType.name}
                            onChange={(e) => setEditingClassType({ ...editingClassType, name: e.target.value })}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded"
                          />
                          <input
                            type="color"
                            value={editingClassType.color}
                            onChange={(e) => setEditingClassType({ ...editingClassType, color: e.target.value })}
                            className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                          />
                          <button
                            onClick={() => handleUpdateClassType(classType.id, editingClassType)}
                            className="px-4 py-1 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingClassType(null)}
                            className="px-4 py-1 bg-gray-200 text-gray-700 text-sm font-bold rounded hover:bg-gray-300"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900">{classType.name}</div>
                            <div className="text-xs text-gray-500">{classType.color}</div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm text-gray-600">활성화</span>
                            <input
                              type="checkbox"
                              checked={classType.is_active}
                              onChange={(e) => handleUpdateClassType(classType.id, { is_active: e.target.checked })}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                          <button
                            onClick={() => setEditingClassType(classType)}
                            className="px-4 py-1 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200"
                          >
                            수정
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment-types' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">새 결제 유형 추가</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newPaymentTypeName}
                    onChange={(e) => setNewPaymentTypeName(e.target.value)}
                    placeholder="결제 유형 이름"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="color"
                    value={newPaymentTypeColor}
                    onChange={(e) => setNewPaymentTypeColor(e.target.value)}
                    className="w-20 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={handleCreatePaymentType}
                    disabled={loading || !newPaymentTypeName.trim()}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                  >
                    추가
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">결제 유형 목록</h3>
                <div className="space-y-2">
                  {paymentTypes.map((paymentType) => (
                    <div key={paymentType.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 rounded" style={{ backgroundColor: paymentType.color }} />
                      {editingPaymentType?.id === paymentType.id ? (
                        <>
                          <input
                            type="text"
                            value={editingPaymentType.name}
                            onChange={(e) => setEditingPaymentType({ ...editingPaymentType, name: e.target.value })}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded"
                          />
                          <input
                            type="color"
                            value={editingPaymentType.color}
                            onChange={(e) => setEditingPaymentType({ ...editingPaymentType, color: e.target.value })}
                            className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                          />
                          <button
                            onClick={() => handleUpdatePaymentType(paymentType.id, editingPaymentType)}
                            className="px-4 py-1 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingPaymentType(null)}
                            className="px-4 py-1 bg-gray-200 text-gray-700 text-sm font-bold rounded hover:bg-gray-300"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900">{paymentType.name}</div>
                            <div className="text-xs text-gray-500">{paymentType.color}</div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm text-gray-600">활성화</span>
                            <input
                              type="checkbox"
                              checked={paymentType.is_active}
                              onChange={(e) => handleUpdatePaymentType(paymentType.id, { is_active: e.target.checked })}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                          <button
                            onClick={() => setEditingPaymentType(paymentType)}
                            className="px-4 py-1 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200"
                          >
                            수정
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}