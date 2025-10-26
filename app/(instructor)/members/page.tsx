'use client'

import { useState, useEffect } from 'react'
import { 
  getMemberPasses, 
  createMembershipPackage, 
  deleteMembershipPackage,
  getPaymentTypes 
} from '@/app/actions/membership'

// ==================== 타입 정의 ====================
type MemberStatus = 'active' | 'inactive' | 'pending'
type TabType = 'all' | 'active' | 'inactive'
type PassStatus = 'active' | 'expired' | 'exhausted'

interface Member {
  id: string
  name: string
  phone: string
  status: MemberStatus
  joinDate: string
  instructor: string | null
  remainingLessons: number
  totalLessons: number
  notes?: string
}

interface MembershipPackage {
  id: string
  member_id: string
  payment_type_id: string
  payment_type_name: string
  payment_type_color: string
  total_lessons: number
  remaining_lessons: number
  used_lessons: number
  start_date: string
  end_date: string | null
  status: PassStatus
  created_at: string
}

interface PaymentType {
  id: string
  name: string
  color: string
}

// ==================== 메인 컴포넌트 ====================
export default function InstructorMembersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberPasses, setMemberPasses] = useState<MembershipPackage[]>([])
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPasses, setLoadingPasses] = useState(false)
  
  // 회원권 추가 폼
  const [showAddPassForm, setShowAddPassForm] = useState(false)
  const [newPass, setNewPass] = useState({
    paymentTypeId: '',
    totalLessons: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  })

  // 상태 텍스트
  const statusText: Record<MemberStatus, string> = {
    active: '활성',
    inactive: '비활성',
    pending: '대기',
  }

  // 상태 색상
  const statusColors: Record<MemberStatus, string> = {
    active: 'text-green-600 bg-green-50',
    inactive: 'text-gray-600 bg-gray-50',
    pending: 'text-orange-600 bg-orange-50',
  }

  // 회원권 상태 텍스트
  const passStatusText: Record<PassStatus, string> = {
    active: '사용중',
    expired: '기간만료',
    exhausted: '소진완료'
  }

  // 회원권 상태 색상
  const passStatusColors: Record<PassStatus, string> = {
    active: 'text-green-600 bg-green-50',
    expired: 'text-gray-600 bg-gray-50',
    exhausted: 'text-red-600 bg-red-50'
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
          m.phone.includes(query)
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
      // TODO: Supabase에서 담당 회원만 조회 (RLS 자동 필터링)
      // 현재는 목 데이터 사용
      const mockData: Member[] = [
        {
          id: '1',
          name: '홍길동',
          phone: '010-1234-5678',
          status: 'active',
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
          joinDate: '2025-01-05',
          instructor: '박서준',
          remainingLessons: 7,
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

  // 회원 등록 페이지로 이동
  const handleRegisterMember = () => {
    alert('회원 등록 페이지로 이동합니다')
    // TODO: router.push('/instructor/members/register')
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
        <header className="sticky top-0 z-50 bg-white border-b border-[#f0ebe1]">
          <div className="flex items-center justify-between px-5 py-4">
            <h1 className="text-lg font-semibold text-gray-900">담당 회원</h1>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 text-2xl">🔔</button>
              <button className="w-9 h-9 text-xl opacity-70 hover:opacity-100">
                👤
              </button>
            </div>
          </div>
        </header>

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
            placeholder="이름, 전화번호로 검색"
            className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors"
          />
        </div>

        {/* ==================== 회원 목록 ==================== */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">로딩 중...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다' : '담당 회원이 없습니다'}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="bg-white border border-[#f0ebe1] rounded-xl p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* 이름 & 상태 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">
                    {member.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      statusColors[member.status]
                    }`}
                  >
                    {statusText[member.status]}
                  </span>
                </div>

                {/* 전화번호 */}
                <div className="text-sm text-gray-600">{member.phone}</div>

                {/* 회원권 현황 */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">회원권 현황</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {member.remainingLessons} / {member.totalLessons}회
                  </span>
                </div>

                {/* 진행률 바 */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(member.remainingLessons / member.totalLessons) * 100}%`,
                    }}
                  />
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
                {/* 기본 정보 */}
                <div className="space-y-4">
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
                          총 레슨 횟수
                        </label>
                        <input
                          type="number"
                          value={newPass.totalLessons}
                          onChange={(e) => setNewPass({ ...newPass, totalLessons: e.target.value })}
                          placeholder="예: 30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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
                      </div>

                      <button
                        onClick={handleAddPass}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        등록하기
                      </button>
                    </div>
                  )}

                  {/* 회원권 목록 */}
                  <div className="space-y-3">
                    {loadingPasses ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        로딩 중...
                      </div>
                    ) : memberPasses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        보유 중인 회원권이 없습니다
                      </div>
                    ) : (
                      memberPasses.map((pass) => (
                        <div
                          key={pass.id}
                          className="border border-[#f0ebe1] rounded-xl p-4 space-y-3"
                        >
                          {/* 헤더 */}
                          <div className="flex items-center justify-between">
                            <div
                              className="px-2.5 py-1 rounded text-xs font-semibold text-white"
                              style={{ backgroundColor: pass.payment_type_color }}
                            >
                              {pass.payment_type_name}
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                passStatusColors[pass.status]
                              }`}
                            >
                              {passStatusText[pass.status]}
                            </span>
                          </div>

                          {/* 레슨 횟수 */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">레슨 횟수</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {pass.remaining_lessons} / {pass.total_lessons}회
                            </span>
                          </div>

                          {/* 진행률 */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${(pass.remaining_lessons / pass.total_lessons) * 100}%`,
                                backgroundColor: pass.payment_type_color
                              }}
                            />
                          </div>

                          {/* 기간 */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{pass.start_date}</span>
                            <span>~</span>
                            <span>{pass.end_date || '무제한'}</span>
                          </div>

                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => handleDeletePass(pass.id)}
                            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex gap-2">
                <button
                  onClick={() => alert('수정 기능 구현 예정')}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    setSelectedMember(null)
                    setShowAddPassForm(false)
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 하단 네비게이션 ==================== */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0ebe1] z-40">
          <div className="max-w-2xl mx-auto flex justify-around py-2">
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">📅</span>
              <span className="text-xs">일정</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">📝</span>
              <span className="text-xs">레슨</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900 font-semibold">
              <span className="text-xl">👥</span>
              <span className="text-xs">회원</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">✅</span>
              <span className="text-xs">출석</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">💰</span>
              <span className="text-xs">정산</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
