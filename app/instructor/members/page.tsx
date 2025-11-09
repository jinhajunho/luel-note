"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  getMemberPasses, 
  createMembershipPackage, 
  deleteMembershipPackage 
} from '@/app/actions/membership'
import { convertToMember, resetMemberPassword } from '@/app/actions/members'
import { getPaymentTypes } from '@/app/actions/payment-types'
import PopoverSelect, { PopoverOption } from '@/components/common/PopoverSelect'
import DatePicker from '@/components/common/DatePicker'
import { addSystemLog } from '@/lib/utils/system-log'
import { useAuth } from '@/lib/auth-context'

type Member = {
  id: string
  name: string
  phone: string
  status: 'active' | 'inactive'
  type: 'member' | 'guest'
  joinDate: string
  instructor?: string | null
  remainingLessons: number
  totalLessons: number
  notes?: string | null
  lastVisit?: string
}

type MemberPass = {
  id: string
  paymentTypeName: string
  startDate: string
  endDate: string
  usedLessons: number
  totalLessons: number
  remainingLessons: number
  status: 'active' | 'expired' | 'exhausted'
}

type PaymentType = {
  value: string
  label: string
}

export default function InstructorMembersPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'all' | 'member' | 'guest'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  // 회원권 관련
  const [memberPasses, setMemberPasses] = useState<MemberPass[]>([])
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [loadingPasses, setLoadingPasses] = useState(false)
  const [showAddPassForm, setShowAddPassForm] = useState(false)
  const [newPass, setNewPass] = useState({
    paymentTypeId: '',
    totalLessons: '',
    startDate: new Date(),
    endDate: null as Date | null
  })

  // 회원 승격 관련
  const [convertingMember, setConvertingMember] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertSteps, setConvertSteps] = useState({
    appDownload: false,
    signup: false,
    membershipGrant: false
  })

  // 메모 편집 관련
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')

  // 회원 데이터 로드 함수
  const loadMembers = useCallback(async () => {
    if (!profile) return
    
    try {
      console.log('🔍 강사 담당 회원 목록 로드 시작 - profileId:', profile.id)
      const { getInstructorMembers } = await import('@/app/actions/members')
      const result = await getInstructorMembers(profile.id)
      console.log('📊 강사 담당 회원 목록 조회 결과:', result)
      
      if (result.success && result.data) {
        console.log('✅ 회원 목록 로드 성공:', result.data.length, '명')
        setMembers(result.data)
      } else {
        console.error('❌ 회원 목록 로드 실패:', result.error)
        setMembers([])
      }
    } catch (error) {
      console.error('❌ 회원 목록 로드 오류:', error)
      setMembers([])
    }
  }, [profile])

  // 회원 데이터 로드
  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  useEffect(() => {
    loadPaymentTypesData()
  }, [])

  // 탭 & 상태 & 검색 필터
  useEffect(() => {
    let filtered = members

    // 탭 필터 (타입 기준)
    if (activeTab === 'member') {
      filtered = filtered.filter((m) => m.type === 'member')
    } else if (activeTab === 'guest') {
      filtered = filtered.filter((m) => m.type === 'guest')
    }

    // 상태 필터
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

  // 회원 선택 시 회원권 로드
  useEffect(() => {
    if (selectedMember) {
      loadMemberPassesData(selectedMember.id)
      setEditedNotes(selectedMember.notes || '')
      setIsEditingNotes(false)
    }
  }, [selectedMember])

  const loadPaymentTypesData = async () => {
    try {
      const types = await getPaymentTypes()
      setPaymentTypes(types.map((t: any) => ({ 
        value: t.id || t.value, 
        label: t.name || t.label 
      })))
    } catch (error) {
      console.error('결제 타입 로드 실패:', error)
    }
  }

  // 결제 타입을 PopoverOption 형식으로 변환
  const getPaymentTypeOptions = (): PopoverOption[] => {
    const colorMap: Record<string, string> = {
      '체험수업': 'bg-gray-400',
      '정규수업': 'bg-blue-500',
      '강사제공': 'bg-indigo-600',
      '센터제공': 'bg-cyan-500',
    }
    
    return paymentTypes.map((type) => ({
      label: type.label,
      value: type.value,
      colorDot: colorMap[type.label] || 'bg-gray-400'
    }))
  }

  const loadMemberPassesData = async (memberId: string) => {
    setLoadingPasses(true)
    try {
      const passes = await getMemberPasses(memberId)
      const mapped = passes.map((p) => ({
        id: p.id,
        paymentTypeName: p.payment_type_name,
        startDate: p.start_date,
        endDate: p.end_date ?? '',
        usedLessons: p.used_lessons,
        totalLessons: p.total_lessons,
        remainingLessons: p.remaining_lessons,
        status: p.status,
      }))
      setMemberPasses(mapped)
      
      // 실제 데이터만 사용 (mock 제거)
      if (false) {
        const mockPasses: MemberPass[] = [
          {
            id: 'pass1',
            paymentTypeName: '정규수업',
            startDate: '2025-01-01',
            endDate: '2025-04-01',
            usedLessons: 18,
            totalLessons: 30,
            remainingLessons: 12,
            status: 'active',
          },
          {
            id: 'pass2',
            paymentTypeName: '강사제공',
            startDate: '2025-01-15',
            endDate: '2025-02-15',
            usedLessons: 3,
            totalLessons: 5,
            remainingLessons: 2,
            status: 'active',
          },
        ]
        setMemberPasses(mockPasses)
      }
    } catch (error) {
      console.error('회원권 조회 실패:', error)
      // 실제 데이터만 사용 (mock 제거)
      if (false) {
        const mockPasses: MemberPass[] = [
          {
            id: 'pass1',
            paymentTypeName: '정규수업',
            startDate: '2025-01-01',
            endDate: '2025-04-01',
            usedLessons: 18,
            totalLessons: 30,
            remainingLessons: 12,
            status: 'active',
          },
          {
            id: 'pass2',
            paymentTypeName: '강사제공',
            startDate: '2025-01-15',
            endDate: '2025-02-15',
            usedLessons: 3,
            totalLessons: 5,
            remainingLessons: 2,
            status: 'active',
          },
        ]
        setMemberPasses(mockPasses)
      }
    } finally {
      setLoadingPasses(false)
    }
  }

  // 메모 저장
  const handleSaveNotes = () => {
    if (!selectedMember) return
    
    // 실제 서버에 저장
    setMembers(prev => prev.map(m => 
      m.id === selectedMember.id ? { ...m, notes: editedNotes } : m
    ))
    setSelectedMember(prev => prev ? { ...prev, notes: editedNotes } : null)
    setIsEditingNotes(false)
    alert('메모가 저장되었습니다')
  }

  // 회원 승격 (비회원 → 정회원) 모달 열기
  const openConvertModal = () => {
    setShowConvertModal(true)
    setConvertSteps({
      appDownload: false,
      signup: false,
      membershipGrant: false
    })
  }

  // 회원 승격 (비회원 → 정회원) 실행
  const handleConvertToMember = async () => {
    if (!selectedMember || selectedMember.type !== 'guest') return

    // 모든 단계가 체크되었는지 확인
    const allStepsCompleted = convertSteps.appDownload && convertSteps.signup && convertSteps.membershipGrant
    if (!allStepsCompleted) {
      alert('모든 단계를 완료해야 전환할 수 있습니다')
      return
    }

    setConvertingMember(true)
    try {
      const result = await convertToMember(selectedMember.phone)

      if (result.success) {
        // 시스템 로그 추가
        addSystemLog({
          type: 'data_change',
          user: profile?.name || '강사',
          action: '정회원 전환',
          details: `회원: ${selectedMember.name} (${selectedMember.phone}). 비회원에서 정회원으로 전환되었습니다.`
        })
        
        alert(`${selectedMember.name}님이 정회원으로 전환되었습니다!`)
        // 회원 목록 새로고침 (서버에서 최신 데이터 가져오기)
        await loadMembers()
        // 선택된 회원도 업데이트
        const updatedMember = members.find(m => m.id === selectedMember.id)
        if (updatedMember) {
          setSelectedMember({ ...updatedMember, type: 'member' as const })
        }
        setShowConvertModal(false)
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

  // 회원권 추가
  const handleAddPass = async () => {
    if (!selectedMember) return
    
    if (!newPass.paymentTypeId || !newPass.totalLessons || !newPass.endDate) {
      alert('모든 필드를 입력해주세요')
      return
    }

    try {
      const result = await createMembershipPackage({
        member_id: selectedMember.id,
        payment_type_id: newPass.paymentTypeId,
        total_lessons: parseInt(newPass.totalLessons),
        start_date: newPass.startDate.toISOString().split('T')[0],
        end_date: newPass.endDate.toISOString().split('T')[0]
      })

      if (result.success) {
        alert('회원권이 등록되었습니다')
        setShowAddPassForm(false)
        setNewPass({
          paymentTypeId: '',
          totalLessons: '',
          startDate: new Date(),
          endDate: null
        })
        await loadMemberPassesData(selectedMember.id)
        // 회원 목록도 다시 로드하여 남은 레슨 수 업데이트
        await loadMembers()
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
          await loadMemberPassesData(selectedMember.id)
          // 회원 목록도 다시 로드하여 남은 레슨 수 업데이트
          await loadMembers()
        }
      } else {
        alert(result.error || '회원권 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('회원권 삭제 실패:', error)
      alert('회원권 삭제에 실패했습니다')
    }
  }

  const closeModal = () => {
    setSelectedMember(null)
    setShowAddPassForm(false)
    document.body.style.overflow = ""
  }

  const openModal = (member: Member) => {
    setSelectedMember(member)
    document.body.style.overflow = "hidden"
  }

  return (
    <div className="pb-24 overflow-x-hidden">
      {/* 탭 메뉴 (타입 기준) */}
      <div className="bg-white border-b border-[#f0ebe1] px-5 shadow-sm">
        <div className="flex">
          <button
            onClick={() => {
              setActiveTab('all')
              setSelectedMember(null)
            }}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => {
              setActiveTab('member')
              setSelectedMember(null)
            }}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'member'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            회원
          </button>
          <button
            onClick={() => {
              setActiveTab('guest')
              setSelectedMember(null)
            }}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'guest'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            비회원
          </button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* 상태 필터 + 검색 */}
        <div className="space-y-3">
          {/* 상태 필터 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-[#f0ebe1] text-[#7a6f61] hover:border-blue-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-[#f0ebe1] text-[#7a6f61] hover:border-blue-300'
              }`}
            >
              활성
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-[#f0ebe1] text-[#7a6f61] hover:border-blue-300'
              }`}
            >
              비활성
            </button>
          </div>

          {/* 검색 */}
          <div className="bg-white border border-[#f0ebe1] rounded-lg p-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 연락처로 검색"
              className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-lg text-sm focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* 회원 목록 */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="bg-white border border-[#f0ebe1] rounded-lg p-12 text-center">
              <div className="text-5xl mb-4">👤</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '담당 회원이 없습니다'}
              </div>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => openModal(member)}
                className="bg-white border border-[#f0ebe1] rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#f5f1e8] rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a1a1a] text-base flex items-center gap-2">
                        {member.name}
                        {member.type === 'guest' && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                            비회원
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[#7a6f61] mt-0.5">
                        {member.phone}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      member.status === 'active'
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-600 bg-gray-50'
                    }`}
                  >
                    {member.status === 'active' ? '활성' : '비활성'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#f0ebe1]">
                  <div className="text-center">
                    <div className="text-xs text-[#7a6f61] mb-1">가입일</div>
                    <div className="text-sm font-medium text-[#1a1a1a]">
                      {member.joinDate}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[#7a6f61] mb-1">최근 방문</div>
                    <div className="text-sm font-medium text-[#1a1a1a]">
                      {member.lastVisit || '오늘'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[#7a6f61] mb-1">잔여</div>
                    <div className="text-sm font-semibold text-blue-600">
                      {member.remainingLessons}회
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 회원 상세 모달 */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <h2 className="text-lg font-semibold text-gray-900">회원 상세</h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* 비밀번호 초기화 (강사) */}
              <button
                onClick={async () => {
                  if (!selectedMember) return
                  if (!confirm(`${selectedMember.name}님의 비밀번호를 초기화하시겠습니까?\n초기 비밀번호는 전화번호(하이픈 제거)로 설정됩니다.`)) return
                  try {
                    const result = await resetMemberPassword(selectedMember.phone)
                    if (result.success) {
                      alert('비밀번호가 초기화되었습니다. 회원에게 안내해 주세요.')
                    } else {
                      alert(result.error || '비밀번호 초기화에 실패했습니다')
                    }
                  } catch (e) {
                    alert('비밀번호 초기화 중 오류가 발생했습니다')
                  }
                }}
                className="w-full py-3.5 px-5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors"
              >
                비밀번호 초기화
              </button>

              {/* 비회원 전환 버튼 */}
              {selectedMember.type === 'guest' && (
                <button
                  onClick={openConvertModal}
                  className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  ✨ 정회원으로 전환
                </button>
              )}

              {/* 기본 정보 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-[#f0ebe1]">
                  <span className="text-sm text-[#7a6f61]">이름</span>
                  <span className="text-sm font-semibold text-[#1a1a1a]">
                    {selectedMember.name}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#f0ebe1]">
                  <span className="text-sm text-[#7a6f61]">전화번호</span>
                  <span className="text-sm font-semibold text-[#1a1a1a]">
                    {selectedMember.phone}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#f0ebe1]">
                  <span className="text-sm text-[#7a6f61]">가입일</span>
                  <span className="text-sm font-semibold text-[#1a1a1a]">
                    {selectedMember.joinDate}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#f0ebe1]">
                  <span className="text-sm text-[#7a6f61]">상태</span>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      selectedMember.status === 'active'
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-600 bg-gray-50'
                    }`}
                  >
                    {selectedMember.status === 'active' ? '활성' : '비활성'}
                  </span>
                </div>

                {/* 메모 섹션 */}
                <div className="py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#7a6f61] block">
                      메모
                    </span>
                    {!isEditingNotes && (
                      <button
                        onClick={() => setIsEditingNotes(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        편집
                      </button>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="메모를 입력하세요"
                        className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNotes}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingNotes(false)
                            setEditedNotes(selectedMember.notes || '')
                          }}
                          className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-[#1a1a1a] text-sm font-medium rounded-lg transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#1a1a1a] bg-[#fdfbf7] p-3 rounded-lg border border-[#f0ebe1] min-h-[60px]">
                      {selectedMember.notes || '메모가 없습니다'}
                    </p>
                  )}
                </div>
              </div>

              {/* 회원권 관리 섹션 (정회원만) */}
              {selectedMember.type === 'member' && (
                <div className="border-t border-[#f0ebe1] pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-[#1a1a1a]">
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
                    <div className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-4 mb-4 space-y-3">
                      <PopoverSelect
                        label="결제유형"
                        value={newPass.paymentTypeId}
                        onChange={(value) => setNewPass({ ...newPass, paymentTypeId: value })}
                        options={[
                          { label: '선택하세요', value: '' },
                          ...getPaymentTypeOptions()
                        ]}
                      />

                      <div>
                        <label className="block text-sm font-medium text-[#7a6f61] mb-2">
                          레슨 횟수
                        </label>
                        <input
                          type="number"
                          value={newPass.totalLessons}
                          onChange={(e) => setNewPass({ ...newPass, totalLessons: e.target.value })}
                          placeholder="예: 30"
                          className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
                        />
                      </div>

                      <DatePicker
                        label="시작일"
                        value={newPass.startDate}
                        onChange={(date) => setNewPass({ ...newPass, startDate: date })}
                        placeholder="시작일을 선택하세요"
                        className="[&_button]:border-[#f0ebe1] [&_button]:hover:border-blue-300 [&_button]:focus:border-blue-600 [&_label]:text-[#7a6f61] [&_label]:text-sm [&_label]:font-medium"
                      />

                      <DatePicker
                        label="종료일"
                        value={newPass.endDate || new Date()}
                        onChange={(date) => setNewPass({ ...newPass, endDate: date })}
                        placeholder="종료일을 선택하세요"
                        className="[&_button]:border-[#f0ebe1] [&_button]:hover:border-blue-300 [&_button]:focus:border-blue-600 [&_label]:text-[#7a6f61] [&_label]:text-sm [&_label]:font-medium"
                      />

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
                    <div className="text-center py-6 text-sm text-[#7a6f61]">
                      회원권 불러오는 중...
                    </div>
                  ) : memberPasses.length === 0 ? (
                    <div className="text-center py-6 text-sm text-[#7a6f61]">
                      등록된 회원권이 없습니다
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {memberPasses.map((pass) => (
                        <div
                          key={pass.id}
                          className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg p-4 space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-[#1a1a1a] text-sm mb-1">
                                {pass.paymentTypeName}
                              </div>
                              <div className="text-xs text-[#7a6f61]">
                                {pass.startDate} ~ {pass.endDate}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                pass.status === 'active'
                                  ? 'text-green-600 bg-green-50'
                                  : pass.status === 'expired'
                                  ? 'text-gray-600 bg-gray-50'
                                  : 'text-red-600 bg-red-50'
                              }`}
                            >
                              {pass.status === 'active' && '활성'}
                              {pass.status === 'expired' && '만료'}
                              {pass.status === 'exhausted' && '소진'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#7a6f61]">진행률</span>
                              <span className="font-medium text-[#1a1a1a]">
                                {pass.usedLessons}/{pass.totalLessons}회
                              </span>
                            </div>
                            <div className="w-full bg-[#f0ebe1] rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${(pass.usedLessons / pass.totalLessons) * 100}%`
                                }}
                              />
                            </div>
                            <div className="text-xs text-[#7a6f61]">
                              잔여: {pass.remainingLessons}회
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePass(pass.id)
                            }}
                            className="w-full py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#f0ebe1]">
              <button
                onClick={closeModal}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#1a1a1a] font-semibold rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 정회원 전환 모달 */}
      {showConvertModal && selectedMember && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConvertModal(false)
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <h2 className="text-lg font-semibold text-gray-900">정회원 전환</h2>
              <button
                onClick={() => setShowConvertModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-sm text-[#7a6f61] mb-4">
                {selectedMember.name}님을 정회원으로 전환하기 전에 다음 단계를 완료해주세요:
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-[#f0ebe1] rounded-lg cursor-pointer hover:bg-[#fdfbf7] transition-colors">
                  <input
                    type="checkbox"
                    checked={convertSteps.appDownload}
                    onChange={(e) => setConvertSteps({ ...convertSteps, appDownload: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-[#f0ebe1] rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[#1a1a1a]">1. 앱 다운로드 안내</div>
                    <div className="text-xs text-[#7a6f61] mt-0.5">회원에게 앱 다운로드를 안내했습니다</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-[#f0ebe1] rounded-lg cursor-pointer hover:bg-[#fdfbf7] transition-colors">
                  <input
                    type="checkbox"
                    checked={convertSteps.signup}
                    onChange={(e) => setConvertSteps({ ...convertSteps, signup: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-[#f0ebe1] rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[#1a1a1a]">2. 가입 안내</div>
                    <div className="text-xs text-[#7a6f61] mt-0.5">{selectedMember.phone}로 가입을 안내했습니다</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-[#f0ebe1] rounded-lg cursor-pointer hover:bg-[#fdfbf7] transition-colors">
                  <input
                    type="checkbox"
                    checked={convertSteps.membershipGrant}
                    onChange={(e) => setConvertSteps({ ...convertSteps, membershipGrant: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-[#f0ebe1] rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[#1a1a1a]">3. 회원권 지급 (관리자)</div>
                    <div className="text-xs text-[#7a6f61] mt-0.5">관리자가 회원권을 지급했습니다</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-[#f0ebe1] space-y-2">
              <button
                onClick={handleConvertToMember}
                disabled={convertingMember || !(convertSteps.appDownload && convertSteps.signup && convertSteps.membershipGrant)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {convertingMember ? '전환 중...' : '정회원으로 전환'}
              </button>
              <button
                onClick={() => setShowConvertModal(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#1a1a1a] font-semibold rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
