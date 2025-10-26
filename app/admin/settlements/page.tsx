'use client'

import { useState, useEffect } from 'react'
import { getAdminSettlementData } from '@/lib/actions/settlement-actions'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import Loading from '@/components/common/Loading'
import type { Profile } from '@/types'
import type { InstructorSettlement } from '@/types/settlement'

export default function AdminSettlementsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [startDate, setStartDate] = useState('2025-01-01')
  const [endDate, setEndDate] = useState('2025-01-31')
  const [searchQuery, setSearchQuery] = useState('')
  const [instructorSettlements, setInstructorSettlements] = useState<InstructorSettlement[]>([])
  const [filteredSettlements, setFilteredSettlements] = useState<InstructorSettlement[]>([])
  const [loading, setLoading] = useState(true)

  // 전체 합계
  const grandTotal = instructorSettlements.reduce(
    (sum, instructor) => sum + instructor.totalSessions,
    0
  )

  // 초기 로드
  useEffect(() => {
    loadProfile()
    loadSettlements()
  }, [])

  // 검색 필터
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSettlements(instructorSettlements)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredSettlements(
        instructorSettlements
          .map((instructor) => ({
            ...instructor,
            members: instructor.members.filter((member) =>
              member.memberName.toLowerCase().includes(query)
            ),
          }))
          .filter(
            (instructor) =>
              instructor.instructorName.toLowerCase().includes(query) ||
              instructor.members.length > 0
          )
      )
    }
  }, [searchQuery, instructorSettlements])

  const loadProfile = async () => {
    // TODO: 실제 프로필 로드
    setProfile({
      id: '1',
      name: '관리자',
      phone: '01012345678',
      role: 'admin'
    })
  }

  const loadSettlements = async () => {
    setLoading(true)
    try {
      const data = await getAdminSettlementData(startDate, endDate)
      setInstructorSettlements(data)
      setFilteredSettlements(data)
    } catch (error) {
      console.error('정산 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleInstructor = (instructorId: string) => {
    setInstructorSettlements((prev) =>
      prev.map((instructor) =>
        instructor.instructorId === instructorId
          ? { ...instructor, expanded: !instructor.expanded }
          : instructor
      )
    )
    setFilteredSettlements((prev) =>
      prev.map((instructor) =>
        instructor.instructorId === instructorId
          ? { ...instructor, expanded: !instructor.expanded }
          : instructor
      )
    )
  }

  const toggleMember = (instructorId: string, memberId: string) => {
    const updateMembers = (instructors: InstructorSettlement[]) =>
      instructors.map((instructor) => {
        if (instructor.instructorId === instructorId) {
          return {
            ...instructor,
            members: instructor.members.map((member) =>
              member.memberId === memberId
                ? { ...member, expanded: !member.expanded }
                : member
            ),
          }
        }
        return instructor
      })

    setInstructorSettlements((prev) => updateMembers(prev))
    setFilteredSettlements((prev) => updateMembers(prev))
  }

  const handleSearch = () => {
    loadSettlements()
  }

  if (!profile) {
    return <Loading text="로딩 중..." />
  }

  return (
    <>
      <Header profile={profile} />
      
      <div className="min-h-screen bg-[#f5f1e8] pb-20">
        <div className="max-w-2xl mx-auto bg-[#fdfbf7] min-h-screen shadow-xl">
          {/* ==================== 페이지 제목 ==================== */}
          <div className="px-5 py-4 bg-white border-b border-[#f0ebe1]">
            <h1 className="text-lg font-semibold text-gray-900">정산 관리</h1>
            <p className="text-xs text-[#7a6f61] mt-0.5">전체 강사 정산 현황</p>
          </div>

          {/* ==================== 날짜 필터 & 검색 ==================== */}
          <div className="px-5 py-4 bg-white border-b border-[#f0ebe1] space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors"
                />
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
              >
                조회
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="강사 또는 회원 이름으로 검색"
              className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-colors"
            />
          </div>

          {/* ==================== 전체 합계 ==================== */}
          <div className="px-5 py-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
            <div className="text-sm opacity-90 mb-2">전체 레슨 합계</div>
            <div className="text-5xl font-bold">{grandTotal}회</div>
          </div>

          {/* ==================== 강사별 정산 목록 ==================== */}
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center py-10 text-gray-500">로딩 중...</div>
            ) : filteredSettlements.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                {searchQuery ? '검색 결과가 없습니다' : '정산 데이터가 없습니다'}
              </div>
            ) : (
              filteredSettlements.map((instructor) => (
                <div
                  key={instructor.instructorId}
                  className="bg-white border border-[#f0ebe1] rounded-xl overflow-hidden"
                >
                  {/* 강사 헤더 */}
                  <div
                    onClick={() => toggleInstructor(instructor.instructorId)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="text-base font-semibold text-gray-900">
                        {instructor.instructorName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {instructor.members.length}명 회원
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {instructor.totalSessions}회
                      </span>
                      <span className="text-gray-400 text-sm">
                        {instructor.expanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>

                  {/* 회원 목록 */}
                  {instructor.expanded && (
                    <div className="border-t border-[#f0ebe1]">
                      {instructor.members.map((member) => (
                        <div key={member.memberId} className="border-t border-gray-100 first:border-t-0">
                          {/* 회원 헤더 */}
                          <div
                            onClick={() => toggleMember(instructor.instructorId, member.memberId)}
                            className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {member.memberName}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-semibold text-gray-900">
                                {member.totalSessions}회
                              </span>
                              <span className="text-gray-400 text-xs">
                                {member.expanded ? '▼' : '▶'}
                              </span>
                            </div>
                          </div>

                          {/* 회원 상세 정보 */}
                          {member.expanded && (
                            <div className="px-8 pb-4 space-y-3">
                              {/* 레슨 유형별 */}
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-semibold text-gray-700 mb-2">
                                  레슨 유형별
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {member.lessonTypes.intro > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">인트로</span>
                                      <span className="font-medium text-gray-900">
                                        {member.lessonTypes.intro}회
                                      </span>
                                    </div>
                                  )}
                                  {member.lessonTypes.personal > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">개인레슨</span>
                                      <span className="font-medium text-gray-900">
                                        {member.lessonTypes.personal}회
                                      </span>
                                    </div>
                                  )}
                                  {member.lessonTypes.duet > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">듀엣레슨</span>
                                      <span className="font-medium text-gray-900">
                                        {member.lessonTypes.duet}회
                                      </span>
                                    </div>
                                  )}
                                  {member.lessonTypes.group > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">그룹레슨</span>
                                      <span className="font-medium text-gray-900">
                                        {member.lessonTypes.group}회
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 결제 타입별 */}
                              <div className="bg-blue-50 rounded-lg p-3">
                                <div className="text-xs font-semibold text-gray-700 mb-2">
                                  결제 타입별
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {member.paymentTypes.trial > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">체험수업</span>
                                      <span className="font-medium text-gray-900">
                                        {member.paymentTypes.trial}회
                                      </span>
                                    </div>
                                  )}
                                  {member.paymentTypes.regular > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">정규수업</span>
                                      <span className="font-medium text-gray-900">
                                        {member.paymentTypes.regular}회
                                      </span>
                                    </div>
                                  )}
                                  {member.paymentTypes.instructor > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">강사제공</span>
                                      <span className="font-medium text-gray-900">
                                        {member.paymentTypes.instructor}회
                                      </span>
                                    </div>
                                  )}
                                  {member.paymentTypes.center > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">센터제공</span>
                                      <span className="font-medium text-gray-900">
                                        {member.paymentTypes.center}회
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 소계 */}
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm font-semibold">
                                <span className="text-gray-700">소계</span>
                                <span className="text-gray-900">
                                  {member.totalSessions}회
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNavigation profile={profile} />
    </>
  )
}
