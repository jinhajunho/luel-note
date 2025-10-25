'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import StatusBadge from '@/components/common/StatusBadge'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'

// 타입 정의
type ClassTypeCount = {
  classType: string
  count: number
}

type PaymentTypeCount = {
  paymentType: string
  count: number
}

type MemberSummary = {
  memberName: string
  classTypeCounts: ClassTypeCount[]
  paymentTypeCounts: PaymentTypeCount[]
  totalCount: number
}

type MonthlySettlement = {
  year: number
  month: number
  memberSummaries: MemberSummary[]
  totalCount: number
}

export default function InstructorFinancePage() {
  const { profile } = useAuth()
  const [settlement, setSettlement] = useState<MonthlySettlement | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    if (profile) {
      loadSettlement()
    }
  }, [profile, selectedYear, selectedMonth])

  const loadSettlement = async () => {
    try {
      setLoading(true)
      
      // TODO: Supabase에서 정산 데이터 로드
      // classes 테이블에서 완료된 레슨만 집계
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockSettlement: MonthlySettlement = {
        year: selectedYear,
        month: selectedMonth,
        memberSummaries: [
          {
            memberName: '홍길동',
            classTypeCounts: [
              { classType: '인트로', count: 1 },
              { classType: '개인레슨', count: 5 }
            ],
            paymentTypeCounts: [
              { paymentType: '정규수업', count: 6 }
            ],
            totalCount: 6
          },
          {
            memberName: '김철수',
            classTypeCounts: [
              { classType: '개인레슨', count: 4 },
              { classType: '듀엣레슨', count: 2 }
            ],
            paymentTypeCounts: [
              { paymentType: '정규수업', count: 5 },
              { paymentType: '강사제공', count: 1 }
            ],
            totalCount: 6
          },
          {
            memberName: '박영희',
            classTypeCounts: [
              { classType: '그룹레슨', count: 8 }
            ],
            paymentTypeCounts: [
              { paymentType: '정규수업', count: 7 },
              { paymentType: '센터제공', count: 1 }
            ],
            totalCount: 8
          }
        ],
        totalCount: 20
      }
      
      setSettlement(mockSettlement)
    } catch (error) {
      console.error('❌ 정산 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 년도 목록 생성
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  // 월 목록
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

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
            <h2 className="text-2xl font-bold text-gray-900">정산 현황</h2>
            <p className="text-sm text-gray-500 mt-1">
              월별 레슨 횟수를 확인하세요
            </p>
          </div>

          {/* 기간 선택 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  년도
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  월
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}월</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : settlement && settlement.memberSummaries.length > 0 ? (
            <>
              {/* 총 레슨 수 */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">
                    {settlement.year}년 {settlement.month}월 총 레슨
                  </div>
                  <div className="text-4xl font-bold text-blue-600">
                    {settlement.totalCount}회
                  </div>
                </div>
              </div>

              {/* 회원별 정산 */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">
                  회원별 상세
                </h3>

                {settlement.memberSummaries.map((member, idx) => (
                  <div 
                    key={idx}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    {/* 회원 이름 + 총 레슨 수 */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                      <h4 className="text-lg font-bold text-gray-900">
                        {member.memberName}
                      </h4>
                      <div className="text-lg font-bold text-blue-600">
                        {member.totalCount}회
                      </div>
                    </div>

                    {/* 레슨 유형별 */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        레슨 유형별
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {member.classTypeCounts.map((item, i) => (
                          <div 
                            key={i}
                            className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg"
                          >
                            <StatusBadge type="class" value={item.classType} size="sm" />
                            <span className="text-sm font-medium text-gray-900">
                              {item.count}회
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 결제 타입별 */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        결제 타입별
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {member.paymentTypeCounts.map((item, i) => (
                          <div 
                            key={i}
                            className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg"
                          >
                            <StatusBadge type="payment" value={item.paymentType} size="sm" />
                            <span className="text-sm font-medium text-gray-900">
                              {item.count}회
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 합계 카드 */}
              <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-gray-900">
                    총 합계
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {settlement.totalCount}회
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="정산 내역이 없습니다"
              description="선택하신 기간에 완료된 레슨이 없습니다."
            />
          )}
        </div>
      </main>

      <BottomNavigation profile={profile} />
    </>
  )
}
