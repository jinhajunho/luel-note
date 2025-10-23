'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ClassType = {
  id: string
  name: string
  color?: string
  is_active?: boolean
}

type PaymentType = {
  id: string
  name: string
  color?: string
  is_active?: boolean
}

export default function AdminSettingsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'class-types' | 'payment-types'>('class-types')
  
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [editingClassType, setEditingClassType] = useState<ClassType | null>(null)
  const [newClassTypeName, setNewClassTypeName] = useState('')
  
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | null>(null)
  const [newPaymentTypeName, setNewPaymentTypeName] = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadClassTypes()
      loadPaymentTypes()
    }
  }, [profile?.role])

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
        })

      if (error) throw error

      alert('수업 타입이 추가되었습니다!')
      setNewClassTypeName('')
      await loadClassTypes()
    } catch (error) {
      console.error('수업 타입 추가 오류:', error)
      alert('수업 타입 추가에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClassType = async (id: string, newName: string) => {
    if (!newName.trim()) {
      alert('수업 타입 이름을 입력하세요.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('class_types')
        .update({ name: newName })
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

  const handleDeleteClassType = async (id: string) => {
    if (!confirm('이 수업 타입을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('class_types')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('수업 타입이 삭제되었습니다!')
      await loadClassTypes()
    } catch (error) {
      console.error('수업 타입 삭제 오류:', error)
      alert('수업 타입 삭제에 실패했습니다.')
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
        })

      if (error) throw error

      alert('결제 유형이 추가되었습니다!')
      setNewPaymentTypeName('')
      await loadPaymentTypes()
    } catch (error) {
      console.error('결제 유형 추가 오류:', error)
      alert('결제 유형 추가에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePaymentType = async (id: string, newName: string) => {
    if (!newName.trim()) {
      alert('결제 유형 이름을 입력하세요.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('payment_types')
        .update({ name: newName })
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

  const handleDeletePaymentType = async (id: string) => {
    if (!confirm('이 결제 유형을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('payment_types')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('결제 유형이 삭제되었습니다!')
      await loadPaymentTypes()
    } catch (error) {
      console.error('결제 유형 삭제 오류:', error)
      alert('결제 유형 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

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
        <p className="text-sm text-gray-500 mt-1">수업 타입과 결제 유형을 관리합니다</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 탭 헤더 */}
        <div className="flex border-b border-gray-200">
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

        {/* 탭 컨텐츠 */}
        <div className="p-6">
          {activeTab === 'class-types' && (
            <div className="space-y-6">
              {/* 새 수업 타입 추가 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">새 수업 타입 추가</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newClassTypeName}
                    onChange={(e) => setNewClassTypeName(e.target.value)}
                    placeholder="수업 타입 이름 (예: 인트로, 개인수업)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleCreateClassType()
                    }}
                  />
                  <button
                    onClick={handleCreateClassType}
                    disabled={loading || !newClassTypeName.trim()}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    추가
                  </button>
                </div>
              </div>

              {/* 수업 타입 목록 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">수업 타입 목록</h3>
                <div className="space-y-2">
                  {classTypes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">등록된 수업 타입이 없습니다.</p>
                  ) : (
                    classTypes.map((classType) => (
                      <div key={classType.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                        {editingClassType?.id === classType.id ? (
                          <>
                            <input
                              type="text"
                              value={editingClassType.name}
                              onChange={(e) => setEditingClassType({ ...editingClassType, name: e.target.value })}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleUpdateClassType(classType.id, editingClassType.name)
                              }}
                            />
                            <button
                              onClick={() => handleUpdateClassType(classType.id, editingClassType.name)}
                              disabled={loading}
                              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingClassType(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 font-bold text-gray-900">{classType.name}</div>
                            <button
                              onClick={() => setEditingClassType(classType)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteClassType(classType.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200"
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment-types' && (
            <div className="space-y-6">
              {/* 새 결제 유형 추가 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">새 결제 유형 추가</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newPaymentTypeName}
                    onChange={(e) => setNewPaymentTypeName(e.target.value)}
                    placeholder="결제 유형 이름 (예: 세션, 강사 서비스)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleCreatePaymentType()
                    }}
                  />
                  <button
                    onClick={handleCreatePaymentType}
                    disabled={loading || !newPaymentTypeName.trim()}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    추가
                  </button>
                </div>
              </div>

              {/* 결제 유형 목록 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">결제 유형 목록</h3>
                <div className="space-y-2">
                  {paymentTypes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">등록된 결제 유형이 없습니다.</p>
                  ) : (
                    paymentTypes.map((paymentType) => (
                      <div key={paymentType.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                        {editingPaymentType?.id === paymentType.id ? (
                          <>
                            <input
                              type="text"
                              value={editingPaymentType.name}
                              onChange={(e) => setEditingPaymentType({ ...editingPaymentType, name: e.target.value })}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleUpdatePaymentType(paymentType.id, editingPaymentType.name)
                              }}
                            />
                            <button
                              onClick={() => handleUpdatePaymentType(paymentType.id, editingPaymentType.name)}
                              disabled={loading}
                              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingPaymentType(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 font-bold text-gray-900">{paymentType.name}</div>
                            <button
                              onClick={() => setEditingPaymentType(paymentType)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeletePaymentType(paymentType.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200"
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
