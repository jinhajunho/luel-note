'use client'

import { useState, useEffect } from 'react'
import { getInstructorSettlementData } from '@/lib/actions/settlement-actions'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import Loading from '@/components/common/Loading'
import type { Profile } from '@/types'
import type { InstructorSettlementData } from '@/types/settlement'

export default function InstructorFinancePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [settlement, setSettlement] = useState<InstructorSettlementData | null>(null)
  const [loading, setLoading] = useState(true)

  // 년도 목록 생성
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  // 월 목록
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  // 초기 로드
  useEffect(() => {
    loadProfile()
  }, [])

  // 년/월 변경 시 정산 데이터 로드
  useEffect(() => {
    if (profile) {
      loadSettlement()
    }
  }, [year, month, profile])

  const loadProfile = async () => {
    // TODO: 실제 프로필 로드
    setProfile({
      id: 'inst-001',
      name: '이지은 강사',
      phone: '01012345678',
      role: 'instructor'
    })
  }

  const loadSettlement = async () => {
    if (!profile) return

    setLoading(true)
    try {
      const data = await getInstructorSettlementData(profile.id, year, month)
      setSettlement(data)
    } catch (error) {
      console.error('❌ 정산 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return <Loading text="로딩 중..." />
  }

  return (
    <>
      <Header profile={profile} />

      <main className="pb-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* 페이지 제목 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">정산 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              월별 레슨 정산 현황을 확인하세요
            </p>
          </div>

          {/* 년/월 선택 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  년도
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  월
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 정산 내역 */}
          {loading ? (
            <div className="text-center py-20">
              <Loading text="정산 데이터 로딩 중..." />
            </div>
          ) : !settlement ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">
                {year}년 {month}월 정산 데이터가 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 전체 합계 */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white">
                <div className="text-center">
                  <p className="text-sm opacity-90 mb-2">
                    {year}년 {month}월 총 레슨
                  </p>
                  <p className="text-5xl font-bold">{settlement.totalCount}회</p>
                </div>
              </div>

              {/* 회원별 상세 */}
              <div className="space-y-4">
                {settlement.members.map((member, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    {/* 회원 이름 */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.memberName}
                      </h3>
                      <span className="text-2xl font-bold text-blue-600">
                        {member.totalCount}회
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 레슨 유형별 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          레슨 유형별
                        </h4>
                        <div className="space-y-2">
                          {member.classTypeCounts.map((ct, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-600">{ct.classType}</span>
                              <span className="font-semibold text-gray-900">
                                {ct.count}회
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 결제 타입별 */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          결제 타입별
                        </h4>
                        <div className="space-y-2">
                          {member.paymentTypeCounts.map((pt, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-600">{pt.paymentType}</span>
                              <span className="font-semibold text-gray-900">
                                {pt.count}회
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 월별 정산 요약 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  정산 요약
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">총 회원 수</span>
                    <span className="font-semibold text-gray-900">
                      {settlement.members.length}명
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">총 레슨 수</span>
                    <span className="font-semibold text-gray-900">
                      {settlement.totalCount}회
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">정산 기간</span>
                    <span className="font-semibold text-gray-900">
                      {year}년 {month}월
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation profile={profile} />
    </>
  )
}
