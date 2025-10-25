'use client'

import { useState, useEffect } from 'react'

// ==================== 타입 정의 ====================
type MemberStatus = 'active' | 'inactive' | 'pending'
type TabType = 'all' | 'active' | 'inactive'

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

// ==================== 메인 컴포넌트 ====================
export default function AdminMembersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

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

  // 회원 데이터 로드
  useEffect(() => {
    loadMembers()
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
          m.instructor?.toLowerCase().includes(query)
      )
    }

    setFilteredMembers(filtered)
  }, [activeTab, searchQuery, members])

  const loadMembers = async () => {
    setLoading(true)
    try {
      // TODO: Supabase에서 회원 조회
      // const { data, error } = await supabase
      //   .from('members')
      //   .select(`
      //     *,
      //     instructor:instructor_members(
      //       instructor:profiles!instructor_members_instructor_id_fkey(name)
      //     ),
      //     membership_packages(
      //       total_lessons,
      //       remaining_lessons,
      //       status
      //     )
      //   `)
      //   .order('join_date', { ascending: false })

      // 임시 목 데이터
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
        {
          id: '3',
          name: '이영희',
          phone: '010-4444-5555',
          status: 'inactive',
          joinDate: '2024-12-10',
          instructor: null,
          remainingLessons: 0,
          totalLessons: 30,
          notes: '회원권 만료',
        },
        {
          id: '4',
          name: '박민지',
          phone: '010-6666-7777',
          status: 'active',
          joinDate: '2025-01-10',
          instructor: '김민지',
          remainingLessons: 14,
          totalLessons: 30,
        },
      ]

      setMembers(mockData)
      setFilteredMembers(mockData)
    } catch (error) {
      console.error('회원 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 회원 등록 페이지로 이동
  const handleRegisterMember = () => {
    alert('회원 등록 페이지로 이동합니다')
    // TODO: router.push('/admin/members/register')
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] pb-20">
      <div className="max-w-2xl mx-auto bg-[#fdfbf7] min-h-screen shadow-xl">
        {/* ==================== 헤더 ==================== */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#f0ebe1]">
          <div className="flex items-center justify-between px-5 py-4">
            <h1 className="text-lg font-semibold text-gray-900">회원 관리</h1>
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

                {/* 담당 강사 */}
                {member.instructor && (
                  <div className="text-sm text-gray-600">
                    담당 강사:{' '}
                    <span className="font-medium text-gray-900">
                      {member.instructor}
                    </span>
                  </div>
                )}

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
                      width: `${
                        (member.remainingLessons / member.totalLessons) * 100
                      }%`,
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
            onClick={() => setSelectedMember(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900">회원 상세</h3>

              <div className="space-y-4">
                {/* 이름 */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">이름</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedMember.name}
                  </span>
                </div>

                {/* 전화번호 */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">전화번호</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedMember.phone}
                  </span>
                </div>

                {/* 가입일 */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">가입일</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedMember.joinDate}
                  </span>
                </div>

                {/* 상태 */}
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

                {/* 담당 강사 */}
                {selectedMember.instructor && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">담당 강사</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedMember.instructor}
                    </span>
                  </div>
                )}

                {/* 회원권 */}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">회원권</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedMember.remainingLessons} / {selectedMember.totalLessons}회
                  </span>
                </div>

                {/* 메모 */}
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

              <div className="flex gap-2">
                <button
                  onClick={() => alert('수정 기능 구현 예정')}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => setSelectedMember(null)}
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
