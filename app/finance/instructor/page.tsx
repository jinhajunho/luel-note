'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils/date'
import ProtectedRoute from '@/components/ProtectedRoute'

type SessionType = string

type SessionRecord = {
  id: string
  date: string
  member: string
  memberId: string
  type: SessionType
  paymentTypeName: string
}

type TypeDetail = {
  type: SessionType
  total: number
  byPayment: Map<string, number>
}

type MemberSummary = {
  member: string
  memberId: string
  total: number
  byType: TypeDetail[]
}

function InstructorFinanceContent() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [memberSummaries, setMemberSummaries] = useState<MemberSummary[]>([])
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    setStartDate(formatDate(firstDay))
    setEndDate(formatDate(lastDay))
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadMyFinanceData()
    }
  }, [startDate, endDate])

  const getAccessToken = () => {
    const cookies = document.cookie.split('; ')
    
    // 동적으로 프로젝트 ID 추출
    const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
    const authCookie = cookies.find(c => c.startsWith(`sb-${projectId}-auth-token=`))
    
    if (!authCookie) return null

    let cookieValue = decodeURIComponent(authCookie.split('=')[1])
    if (cookieValue.startsWith('base64-')) {
      cookieValue = atob(cookieValue.substring(7))
    }
    
    const sessionData = JSON.parse(cookieValue)
    return sessionData
  }

  const loadMyFinanceData = async () => {
    try {
      setLoading(true)
      const sessionData = getAccessToken()
      
      if (!sessionData) {
        console.error('인증 토큰 없음')
        return
      }

      const accessToken = sessionData.access_token
      const userId = sessionData.user.id

      console.log('🔵 내 정산 데이터 조회 시작...')
      console.log('날짜 범위:', startDate, '~', endDate)
      console.log('🔵 user_id:', userId)

      // 1. profiles에서 내 전화번호 조회 (auth_id로)
      const profileResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?auth_id=eq.${userId}&select=phone`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const profileData = await profileResponse.json()
      console.log('🔵 profile 응답:', profileData)

      const myPhone = profileData[0]?.phone

      if (!myPhone) {
        console.error('❌ 전화번호 정보 없음')
        console.error('profileData:', profileData)
        return
      }

      console.log('✅ 내 전화번호:', myPhone)

      // 2. 해당 기간의 내 수업 조회
      const classesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/classes?instructor_id=eq.${myPhone}&class_date=gte.${startDate}&class_date=lte.${endDate}&select=*&order=class_date.asc`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const classesData = await classesResponse.json()
      console.log('✅ 내 수업 데이터:', classesData)

      // 3. 각 수업에 대해 출석 정보 확인
      const attendedSessions: SessionRecord[] = []

      for (const cls of classesData) {
        // 출석 정보 조회
        const attendanceResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/attendances?class_id=eq.${cls.id}&status=eq.present&select=*`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        const attendanceData = await attendanceResponse.json()

        // 출석한 경우만 정산 대상
        if (attendanceData.length > 0) {
          // 회원 이름 조회
          const memberResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/members?id=eq.${cls.member_id}&select=name`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${accessToken}`
              }
            }
          )
          const memberData = await memberResponse.json()
          const memberName = memberData[0]?.name || cls.member_id

          // class_type 이름 조회
          const classTypeResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/class_types?id=eq.${cls.class_type_id}&select=name`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${accessToken}`
              }
            }
          )
          const classTypeData = await classTypeResponse.json()
          const classTypeName = classTypeData[0]?.name || '수업'

          // payment_type 이름 조회
          const paymentTypeResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/payment_types?id=eq.${cls.payment_type_id}&select=name`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${accessToken}`
              }
            }
          )
          const paymentTypeData = await paymentTypeResponse.json()
          const paymentTypeName = paymentTypeData[0]?.name || '유료'

          attendedSessions.push({
            id: cls.id,
            date: cls.class_date,
            member: memberName,
            memberId: cls.member_id,
            type: classTypeName,
            paymentTypeName: paymentTypeName
          })
        }
      }

      console.log('✅ 출석한 수업:', attendedSessions)

      // 4. 회원별로 그룹화
      const memberMap = new Map<string, SessionRecord[]>()
      attendedSessions.forEach(session => {
        if (!memberMap.has(session.memberId)) {
          memberMap.set(session.memberId, [])
        }
        memberMap.get(session.memberId)!.push(session)
      })

      // 5. 회원별 요약 생성
      const summaries: MemberSummary[] = Array.from(memberMap.entries()).map(([memberId, sessions]) => {
        // 수업 타입별로 그룹화
        const typeMap = new Map<SessionType, SessionRecord[]>()
        sessions.forEach(session => {
          if (!typeMap.has(session.type)) {
            typeMap.set(session.type, [])
          }
          typeMap.get(session.type)!.push(session)
        })

        const byType: TypeDetail[] = Array.from(typeMap.entries())
          .map(([type, typeSessions]) => {
            // 결제 타입별로 카운트
            const paymentMap = new Map<string, number>()
            typeSessions.forEach(session => {
              const count = paymentMap.get(session.paymentTypeName) || 0
              paymentMap.set(session.paymentTypeName, count + 1)
            })

            return {
              type,
              total: typeSessions.length,
              byPayment: paymentMap
            }
          })
          .filter(t => t.total > 0)

        return {
          member: sessions[0].member,
          memberId,
          total: sessions.length,
          byType
        }
      })

      console.log('✅ 정산 요약:', summaries)
      setMemberSummaries(summaries.sort((a, b) => b.total - a.total))

    } catch (error) {
      console.error('❌ 내 정산 데이터 로드 오류:', error)
      alert('정산 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadMyFinanceData()
  }

  const toggleMember = (memberId: string) => {
    setExpandedMember(expandedMember === memberId ? null : memberId)
  }

  const totalSessions = memberSummaries.reduce((sum, m) => sum + m.total, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">내 정산</h2>
        <p className="text-sm text-gray-500 mt-1">
          회원별 수업 현황
        </p>
      </div>

      {/* 날짜 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작일
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료일
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            조회
          </button>
        </div>
      </div>

      {/* 총 수업 횟수 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white text-center">
        <div className="text-sm opacity-90 mb-2">총 수업 횟수</div>
        <div className="text-5xl font-bold">{totalSessions}회</div>
        <div className="text-sm opacity-90 mt-2">{memberSummaries.length}명의 회원</div>
      </div>

      {/* 회원별 목록 */}
      <div className="space-y-4">
        {memberSummaries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            조회된 데이터가 없습니다
          </div>
        ) : (
          memberSummaries.map((summary) => {
            const isExpanded = expandedMember === summary.memberId

            return (
              <div 
                key={summary.memberId}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
              >
                {/* 회원 헤더 */}
                <button
                  onClick={() => toggleMember(summary.memberId)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-gray-900">
                      {summary.member}
                    </div>
                    <div className="text-sm text-gray-500">
                      총 {summary.total}회
                    </div>
                  </div>

                  <div className="text-xl text-gray-400">
                    {isExpanded ? '▲' : '▼'}
                  </div>
                </button>

                {/* 수업 상세 */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="space-y-4">
                      {summary.byType.map((typeDetail) => (
                        <div 
                          key={typeDetail.type}
                          className="bg-white rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-md font-bold text-gray-900">
                              {typeDetail.type}
                            </div>
                            <div className="text-sm text-gray-600">
                              총 {typeDetail.total}회
                            </div>
                          </div>

                          <div className="space-y-2">
                            {Array.from(typeDetail.byPayment.entries()).map(([paymentName, count]) => (
                              <div 
                                key={paymentName}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <span className="text-sm text-gray-700">
                                  {paymentName}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  {count}회
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function InstructorFinancePage() {
  return (
    <ProtectedRoute requireMenu="settlements">
      <InstructorFinanceContent />
    </ProtectedRoute>
  )
}