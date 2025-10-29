'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import { 
  getMemberPasses, 
  createMembershipPackage, 
  deleteMembershipPackage 
} from '@/app/actions/membership'
import { 
  convertToMember,
  resetMemberPassword,
  updateMemberNotes
} from '@/app/actions/members'
import { getPaymentTypes } from '@/app/actions/payment-types'
import type { Member, MemberPass, PaymentType } from '@/types'

// ==================== 메인 컴포넌트 ====================

export default function AdminMembersPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'member' | 'guest'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  // 회원권 관련
  const [memberPasses, setMemberPasses] = useState<MemberPass[]>([])
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [loadingPasses, setLoadingPasses] = useState(false)
  const [showAddPassForm, setShowAddPassForm] = useState(false)
  const [newPass, setNewPass] = useState({
    paymentTypeId: '',
    totalLessons: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  })

  // 회원 관련
  const [convertingMember, setConvertingMember] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  // 메모 수정 관련
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // 상태 색상
  const statusColors = {
    active: 'text-green-600 bg-green-50',
    inactive: 'text-gray-600 bg-gray-50',
    expired: 'text-red-600 bg-red-50'
  }

  const statusText = {
    active: '활성',
    inactive: '비활성',
    expired: '만료'
  }

  const passStatusColors = {
    active: 'text-green-600 bg-green-50',
    expired: 'text-gray-600 bg-gray-50',
    exhausted: 'text-red-600 bg-red-50'
  }

  // 회원 데이터 로드
  useEffect(() => {
    loadMembers()
    loadPaymentTypesData()
  }, [])

  // 탭 & 상태 & 검색 필터
  useEffect(() => {
    let filtered = members

    // 탭 필터 (회원/비회원)
    if (activeTab === 'member') {
      filtered = filtered.filter((m) => m.type !== 'guest')
    } else if (activeTab === 'guest') {
      filtered = filtered.filter((m) => m.type === 'guest')
    }

    // 상태 필터 (활성/비활성)
    if (statusFilter === 'active') {
      filtered = filtered.filter((m) => m.status === 'active')
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((m) => m.status === 'inactive')
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.phone.includes(query)
      )
    }

    setFilteredMembers(filtered)
  }, [activeTab, statusFilter, searchQuery, members])

  // 회원 선택 시 회원권 로드 & 메모 초기화
  useEffect(() => {
    if (selectedMember) {
      loadMemberPassesData(selectedMember.phone)
      setEditedNotes(selectedMember.notes || '')
      setIsEditingNotes(false)
    }
  }, [selectedMember])

  const loadMembers = async () => {
    setLoading(true)
    try {
      // TODO: Supabase에서 전체 회원 조회 (관리자 권한)
      // 현재는 목 데이터 사용
      const mockData: Member[] = [
        {
          id: '1',
          name: '홍길동',
          phone: '010-1234-5678',
          status: 'active',
          type: 'member',
          role: 'member',
          joinDate: '2025-01-01',
          instructor: '이지은',
          remainingLessons: 12,
          totalLessons: 30,
          notes: '운동 열심히 하시는 회원님',
        },
        {
          id: '2',
          name: '김철수',
          phone: '010-2222-3333',
          status: 'active',
          type: 'member',
          role: 'instructor',
          joinDate: '2025-01-05',
          instructor: '박서준',
          remainingLessons: 7,
          totalLessons: 20,
        },
        {
          id: '3',
          name: '이영희',
          phone: '010-3333-4444',
          status: 'active',
          type: 'guest',
          role: null,
          joinDate: '2025-01-10',
          instructor: '이지은',
          remainingLessons: 1,
          totalLessons: 1,
          notes: '체험 레슨 진행 중',
        },
        {
          id: '4',
          name: '박민수',
          phone: '010-4444-5555',
          status: 'active',
          type: 'member',
          role: 'member',
          joinDate: '2025-01-15',
          instructor: '김민지',
          remainingLessons: 20,
          totalLessons: 30,
        },
        {
          id: '5',
          name: '정수진',
          phone: '010-5555-6666',
          status: 'inactive',
          type: 'member',
          role: 'member',
          joinDate: '2024-12-01',
          instructor: '최우식',
          remainingLessons: 0,
          totalLessons: 20,
        },
      ]

      setMembers(mockData)
      setFilteredMembers(mockData)
    } catch (error) {
      console.error('회원 로드 실패:', error)
      alert('회원 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const loadPaymentTypesData = async () => {
    try {
      const types = await getPaymentTypes()
      setPaymentTypes(types)
    } catch (error) {
      console.error('결제 타입 로드 실패:', error)
    }
  }

  const loadMemberPassesData = async (memberId: string) => {
    setLoadingPasses(true)
    try {
      const passes = await getMemberPasses(memberId)
      setMemberPasses(passes)
    } catch (error) {
      console.error('회원권 조회 실패:', error)
      alert('회원권을 불러오는데 실패했습니다')
    } finally {
      setLoadingPasses(false)
    }
  }

  // 회원 승격 (비회원 → 정회원)
  const handleConvertToMember = async () => {
    if (!selectedMember || selectedMember.type !== 'guest') return

    const confirmed = confirm(
      `${selectedMember.name}님을 정회원으로 전환하시겠습니까?\n\n` +
      `전화번호: ${selectedMember.phone}\n\n` +
      `회원 전환 후 다음 단계를 안내해주세요:\n` +
      `1. 앱 다운로드 안내\n` +
      `2. ${selectedMember.phone}로 가입 안내\n` +
      `3. 회원권 지급`
    )

    if (!confirmed) return

    setConvertingMember(true)
    try {
      const result = await convertToMember(selectedMember.phone)

      if (result.success) {
        alert(
          `${selectedMember.name}님이 정회원으로 전환되었습니다!\n\n` +
          `다음 단계:\n` +
          `1. 앱 다운로드 안내\n` +
          `2. ${selectedMember.phone}로 가입 안내\n` +
          `3. 회원권 지급`
        )
        await loadMembers()
        setSelectedMember(null)
      } else {
        alert(result.error || '회원 전환에 실패했습니다')
      }
    } catch (error) {
      console.error('회원 전환 실패:', error)
      alert('회원 전환에 실패했습니다')
    } finally {
      setConvertingMember(false)
    }
  }

  // 비밀번호 초기화
  const handleResetPassword = async () => {
    if (!selectedMember) return

    const confirmed = confirm(
      `${selectedMember.name}님의 비밀번호를 초기화하시겠습니까?\n\n` +
      `비밀번호가 전화번호(${selectedMember.phone})로 재설정됩니다.`
    )

    if (!confirmed) return

    setResettingPassword(true)
    try {
      const result = await resetMemberPassword(selectedMember.phone)

      if (result.success) {
        alert(
          `비밀번호가 초기화되었습니다.\n\n` +
          `임시 비밀번호: ${selectedMember.phone}`
        )
      } else {
        alert(result.error || '비밀번호 초기화에 실패했습니다')
      }
    } catch (error) {
      console.error('비밀번호 초기화 실패:', error)
      alert('비밀번호 초기화에 실패했습니다')
    } finally {
      setResettingPassword(false)
    }
  }

  // 메모 저장
  const handleSaveNotes = async () => {
    if (!selectedMember) return

    setSavingNotes(true)
    try {
      const result = await updateMemberNotes(selectedMember.phone, editedNotes)

      if (result.success) {
        alert('메모가 저장되었습니다')
        // 로컬 데이터 업데이트
        const updatedMembers = members.map(m => 
          m.id === selectedMember.id ? { ...m, notes: editedNotes } : m
        )
        setMembers(updatedMembers)
        setSelectedMember({ ...selectedMember, notes: editedNotes })
        setIsEditingNotes(false)
      } else {
        alert(result.error || '메모 저장에 실패했습니다')
      }
    } catch (error) {
      console.error('메모 저장 실패:', error)
      alert('메모 저장에 실패했습니다')
    } finally {
      setSavingNotes(false)
    }
  }

  // 회원권 등록
  const handleAddPass = async () => {
    if (!selectedMember || !newPass.paymentTypeId || !newPass.totalLessons || !newPass.endDate) {
      alert('모든 필드를 입력해주세요')
      return
    }

    try {
      const result = await createMembershipPackage({
        member_id: selectedMember.phone,
        payment_type_id: newPass.paymentTypeId,
        total_lessons: parseInt(newPass.totalLessons),
        start_date: newPass.startDate,
        end_date: newPass.endDate
      })

      if (result.success) {
        alert('회원권이 등록되었습니다')
        setShowAddPassForm(false)
        setNewPass({
          paymentTypeId: '',
          totalLessons: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: ''
        })
        await loadMemberPassesData(selectedMember.phone)
      } else {
        alert(result.error || '회원권 등록에 실패했습니다')
      }
    } catch (error) {
      console.error('회원권 등록 실패:', error)
      alert('회원권 등록에 실패했습니다')
    }
  }

  // 회원권 삭제
  const handleDeletePass = async (passId: string) => {
    if (!confirm('이 회원권을 삭제하시겠습니까?')) return

    try {
      const result = await deleteMembershipPackage(passId)
      
      if (result.success) {
        alert('회원권이 삭제되었습니다')
        if (selectedMember) {
          await loadMemberPassesData(selectedMember.phone)
        }
      } else {
        alert(result.error || '회원권 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('회원권 삭제 실패:', error)
      alert('회원권 삭제에 실패했습니다')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] pb-20">
      <div className="max-w-2xl mx-auto bg-[#fdfbf7] min-h-screen shadow-xl">
        {/* ==================== 헤더 ==================== */}
        <Header profile={{ name: '관리자', role: 'admin' }} />

        {/* ==================== 탭 메뉴 ==================== */}
        <div className="bg-white px-5 border-b border-[#f0ebe1]">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'text-gray-900 font-semibold border-gray-900'
                  : 'text-[#9d917f] border-transparent hover:text-[#7a6f61]'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setActiveTab('member')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'member'
                  ? 'text-gray-900 font-semibold border-gray-900'
                  : 'text-[#9d917f] border-transparent hover:text-[#7a6f61]'
              }`}
            >
              회원
            </button>
            <button
              onClick={() => setActiveTab('guest')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'guest'
                  ? 'text-gray-900 font-semibold border-gray-900'
                  : 'text-[#9d917f] border-transparent hover:text-[#7a6f61]'
              }`}
            >
              비회원
            </button>
          </div>
        </div>

        {/* ==================== 검색 & 상태 필터 ==================== */}
        <div className="px-5 py-4 bg-white border-b border-[#f0ebe1]">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 전화번호로 검색"
              className="flex-1 px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors cursor-pointer"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
        </div>

        {/* ==================== 회원 목록 ==================== */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">로딩 중...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 회원이 없습니다'}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-base flex items-center gap-2">
                        {member.name}
                        {member.type === 'guest' && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded">
                            비회원
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {member.phone}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      statusColors[member.status]
                    }`}
                  >
                    {statusText[member.status]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">가입일</div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.joinDate}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">담당 강사</div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.instructor || '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">잔여</div>
                    <div className="text-sm font-semibold text-blue-600">
                      {member.remainingLessons}회
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ==================== 회원 상세 모달 ==================== */}
        {selectedMember && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setSelectedMember(null)
              setShowAddPassForm(false)
              setIsEditingNotes(false)
            }}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 pb-4 z-10">
                <h3 className="text-lg font-bold text-gray-900">회원 상세</h3>
              </div>

              {/* 모달 내용 */}
              <div className="p-6 space-y-5">
                {/* 관리자 기능 버튼들 */}
                <div className="space-y-2">
                  {/* 비회원 전환 버튼 */}
                  {selectedMember.type === 'guest' && (
                    <button
                      onClick={handleConvertToMember}
                      disabled={convertingMember}
                      className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all"
                    >
                      {convertingMember ? '전환 중...' : '정회원으로 전환'}
                    </button>
                  )}

                  {/* 비밀번호 초기화 */}
                  <button
                    onClick={handleResetPassword}
                    disabled={resettingPassword}
                    className="w-full py-3 px-5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all"
                  >
                    {resettingPassword ? '초기화 중...' : '비밀번호 초기화'}
                  </button>
                </div>

                {/* 프로필 정보 */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">가입일</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedMember.joinDate}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">상태</span>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded ${
                        statusColors[selectedMember.status]
                      }`}
                    >
                      {statusText[selectedMember.status]}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">담당 강사</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedMember.instructor || '-'}
                    </span>
                  </div>

                  {/* 메모 섹션 */}
                  <div className="py-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">메모</span>
                      {!isEditingNotes ? (
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          ✏️ 편집
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditingNotes(false)
                              setEditedNotes(selectedMember.notes || '')
                            }}
                            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                          >
                            취소
                          </button>
                          <button
                            onClick={handleSaveNotes}
                            disabled={savingNotes}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                          >
                            {savingNotes ? '저장 중...' : '💾 저장'}
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditingNotes ? (
                      <textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="회원 메모를 입력하세요"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-white p-3 rounded-lg min-h-[60px] whitespace-pre-wrap">
                        {selectedMember.notes || '메모가 없습니다'}
                      </p>
                    )}
                  </div>
                </div>

                {/* 회원권 관리 섹션 */}
                <div className="border-t border-gray-200 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-900">
                      보유 회원권 ({memberPasses.length}개)
                    </h4>
                    <button
                      onClick={() => setShowAddPassForm(!showAddPassForm)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {showAddPassForm ? '취소' : '+ 회원권 추가'}
                    </button>
                  </div>

                  {/* 회원권 추가 폼 */}
                  {showAddPassForm && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                      <select
                        value={newPass.paymentTypeId}
                        onChange={(e) => setNewPass({ ...newPass, paymentTypeId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:border-gray-900"
                      >
                        <option value="">결제 타입 선택</option>
                        {paymentTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        value={newPass.totalLessons}
                        onChange={(e) => setNewPass({ ...newPass, totalLessons: e.target.value })}
                        placeholder="총 횟수"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:border-gray-900"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">시작일</label>
                          <input
                            type="date"
                            value={newPass.startDate}
                            onChange={(e) => setNewPass({ ...newPass, startDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:border-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">종료일</label>
                          <input
                            type="date"
                            value={newPass.endDate}
                            onChange={(e) => setNewPass({ ...newPass, endDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:border-gray-900"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleAddPass}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                      >
                        등록
                      </button>
                    </div>
                  )}

                  {/* 회원권 목록 */}
                  <div className="space-y-3">
                    {loadingPasses ? (
                      <div className="text-center py-6 text-gray-500">로딩 중...</div>
                    ) : memberPasses.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        등록된 회원권이 없습니다
                      </div>
                    ) : (
                      memberPasses.map((pass) => (
                        <div
                          key={pass.id}
                          className="bg-gray-50 rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 mb-1">
                                {pass.paymentTypeName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {pass.startDate} ~ {pass.endDate}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeletePass(pass.id)}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium rounded-lg transition-colors"
                            >
                              삭제
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                            <span className="text-sm text-gray-600">
                              사용: {pass.usedLessons} / {pass.totalLessons}회
                            </span>
                            <span
                              className={`px-2.5 py-1 text-xs font-medium rounded ${
                                passStatusColors[pass.status]
                              }`}
                            >
                              잔여 {pass.remainingLessons}회
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 하단 네비게이션 ==================== */}
        <BottomNavigation role="admin" activeMenu="members" />
      </div>
    </div>
  )
}
