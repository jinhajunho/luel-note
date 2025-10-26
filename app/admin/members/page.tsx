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
  setMemberRole,
  resetMemberPassword 
} from '@/app/actions/members'
import { getPaymentTypes } from '@/app/actions/payment-types'
import type { Member, MemberPass, PaymentType } from '@/types'

// ==================== 메인 컴포넌트 ====================

export default function AdminMembersPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all')
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

  // 회원 승격/권한 설정 관련
  const [convertingMember, setConvertingMember] = useState(false)
  const [showRoleSelect, setShowRoleSelect] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'member' | 'instructor' | 'admin'>('member')
  const [settingRole, setSettingRole] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

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

  const roleText = {
    member: '회원',
    instructor: '강사',
    admin: '관리자'
  }

  // 회원 데이터 로드
  useEffect(() => {
    loadMembers()
    loadPaymentTypesData()
  }, [])

  // 탭 & 검색 필터
  useEffect(() => {
    let filtered = members

    // 탭 필터
    if (activeTab === 'active') {
      filtered = filtered.filter((m) => m.status === 'active')
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter((m) => m.status === 'inactive')
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.phone.includes(query) ||
          (m.instructor && m.instructor.toLowerCase().includes(query))
      )
    }

    setFilteredMembers(filtered)
  }, [activeTab, searchQuery, members])

  // 회원 선택 시 회원권 로드
  useEffect(() => {
    if (selectedMember) {
      loadMemberPassesData(selectedMember.phone)
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

  // 회원 등록 페이지로 이동
  const handleRegisterMember = () => {
    alert('회원 등록 페이지로 이동합니다')
    // TODO: router.push('/admin/members/register')
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

        // 회원 목록 새로고침
        await loadMembers()
        setSelectedMember(null)
        setShowAddPassForm(false)
      } else {
        alert(result.error || '회원 전환에 실패했습니다')
      }
    } catch (error) {
      console.error('회원 전환 실패:', error)
      alert('회원 전환 중 오류가 발생했습니다')
    } finally {
      setConvertingMember(false)
    }
  }

  // 권한 설정
  const handleSetRole = async () => {
    if (!selectedMember) return

    const confirmed = confirm(
      `${selectedMember.name}님의 권한을 "${roleText[selectedRole]}"로 설정하시겠습니까?`
    )

    if (!confirmed) return

    setSettingRole(true)
    try {
      const result = await setMemberRole(selectedMember.phone, selectedRole)

      if (result.success) {
        alert(`권한이 "${roleText[selectedRole]}"로 설정되었습니다`)
        setShowRoleSelect(false)
        await loadMembers()
      } else {
        alert(result.error || '권한 설정에 실패했습니다')
      }
    } catch (error) {
      console.error('권한 설정 실패:', error)
      alert('권한 설정 중 오류가 발생했습니다')
    } finally {
      setSettingRole(false)
    }
  }

  // 비밀번호 초기화
  const handleResetPassword = async () => {
    if (!selectedMember) return

    const confirmed = confirm(
      `${selectedMember.name}님의 비밀번호를 초기화하시겠습니까?\n\n` +
      `초기 비밀번호: ${selectedMember.phone.replace(/-/g, '')}\n\n` +
      `회원에게 초기 비밀번호를 안내해주세요.`
    )

    if (!confirmed) return

    setResettingPassword(true)
    try {
      const result = await resetMemberPassword(selectedMember.phone)

      if (result.success) {
        alert(
          `비밀번호가 초기화되었습니다!\n\n` +
          `초기 비밀번호: ${selectedMember.phone.replace(/-/g, '')}\n\n` +
          `회원에게 안내해주세요.`
        )
      } else {
        alert(result.error || '비밀번호 초기화에 실패했습니다')
      }
    } catch (error) {
      console.error('비밀번호 초기화 실패:', error)
      alert('비밀번호 초기화 중 오류가 발생했습니다')
    } finally {
      setResettingPassword(false)
    }
  }

  // 회원권 추가
  const handleAddPass = async () => {
    if (!selectedMember) return
    
    if (!newPass.paymentTypeId || !newPass.totalLessons || !newPass.endDate) {
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
        // 회원권 목록 새로고침
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
        // 회원권 목록 새로고침
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
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'text-gray-900 font-semibold border-gray-900'
                  : 'text-[#9d917f] border-transparent hover:text-[#7a6f61]'
              }`}
            >
              활성
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inactive'
                  ? 'text-gray-900 font-semibold border-gray-900'
                  : 'text-[#9d917f] border-transparent hover:text-[#7a6f61]'
              }`}
            >
              비활성
            </button>
          </div>
        </div>

        {/* ==================== 검색 & 등록 ==================== */}
        <div className="px-5 py-4 bg-white border-b border-[#f0ebe1]">
          <button
            onClick={handleRegisterMember}
            className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl transition-all mb-3"
          >
            + 새 회원 등록
          </button>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름, 전화번호, 담당 강사로 검색"
            className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors"
          />
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
                        {member.role && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                            {roleText[member.role]}
                          </span>
                        )}
                        {!member.role && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded">
                            승인 대기
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
              setShowRoleSelect(false)
            }}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 pb-4">
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
                      {convertingMember ? '전환 중...' : '✨ 정회원으로 전환'}
                    </button>
                  )}

                  {/* 권한 설정 버튼 */}
                  <button
                    onClick={() => setShowRoleSelect(!showRoleSelect)}
                    className="w-full py-3 px-5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all"
                  >
                    🔑 권한 설정
                  </button>

                  {/* 권한 설정 폼 */}
                  {showRoleSelect && (
                    <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          역할 선택
                        </label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="member">회원</option>
                          <option value="instructor">강사</option>
                          <option value="admin">관리자</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSetRole}
                          disabled={settingRole}
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
                        >
                          {settingRole ? '설정 중...' : '설정'}
                        </button>
                        <button
                          onClick={() => setShowRoleSelect(false)}
                          className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 비밀번호 초기화 버튼 */}
                  <button
                    onClick={handleResetPassword}
                    disabled={resettingPassword}
                    className="w-full py-3 px-5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all"
                  >
                    {resettingPassword ? '초기화 중...' : '🔒 비밀번호 초기화'}
                  </button>
                </div>

                {/* 기본 정보 */}
                <div className="space-y-4 border-t border-gray-200 pt-5">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">이름</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedMember.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">전화번호</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedMember.phone}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">현재 권한</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedMember.role ? roleText[selectedMember.role] : '없음 (승인 대기)'}
                    </span>
                  </div>

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

                  {selectedMember.instructor && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm text-gray-600">담당 강사</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedMember.instructor}
                      </span>
                    </div>
                  )}

                  {selectedMember.notes && (
                    <div className="py-3">
                      <span className="text-sm text-gray-600 block mb-2">
                        메모
                      </span>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {selectedMember.notes}
                      </p>
                    </div>
                  )}
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
                    <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-xl p-4 mb-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          결제 타입
                        </label>
                        <select
                          value={newPass.paymentTypeId}
                          onChange={(e) => setNewPass({ ...newPass, paymentTypeId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">선택하세요</option>
                          {paymentTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          레슨 횟수
                        </label>
                        <input
                          type="number"
                          value={newPass.totalLessons}
                          onChange={(e) => setNewPass({ ...newPass, totalLessons: e.target.value })}
                          placeholder="예: 30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          시작일
                        </label>
                        <input
                          type="date"
                          value={newPass.startDate}
                          onChange={(e) => setNewPass({ ...newPass, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          종료일
                        </label>
                        <input
                          type="date"
                          value={newPass.endDate}
                          onChange={(e) => setNewPass({ ...newPass, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        onClick={handleAddPass}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        등록하기
                      </button>
                    </div>
                  )}

                  {/* 회원권 목록 */}
                  {loadingPasses ? (
                    <div className="text-center py-6 text-sm text-gray-500">
                      회원권 불러오는 중...
                    </div>
                  ) : memberPasses.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-500">
                      등록된 회원권이 없습니다
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {memberPasses.map((pass) => (
                        <div
                          key={pass.id}
                          className="bg-gray-50 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900 text-sm mb-1">
                                {pass.paymentTypeName}
                              </div>
                              <div className="text-xs text-gray-600">
                                {pass.startDate} ~ {pass.endDate}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                passStatusColors[pass.status]
                              }`}
                            >
                              {pass.status === 'active' && '사용중'}
                              {pass.status === 'expired' && '만료'}
                              {pass.status === 'exhausted' && '소진'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">진행률</span>
                              <span className="font-medium text-gray-900">
                                {pass.usedLessons}/{pass.totalLessons}회
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${(pass.usedLessons / pass.totalLessons) * 100}%`
                                }}
                              />
                            </div>
                            <div className="text-xs text-gray-600">
                              잔여: {pass.remainingLessons}회
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeletePass(pass.id)}
                            className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 pt-4">
                <button
                  onClick={() => {
                    setSelectedMember(null)
                    setShowAddPassForm(false)
                    setShowRoleSelect(false)
                  }}
                  className="flex-1 py-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 하단 네비게이션 ==================== */}
        <BottomNavigation role="admin" currentPath="/admin/members" />
      </div>
    </div>
  )
}
