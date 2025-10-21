'use client'

import { useState, useEffect } from 'react'
import { formatPhone } from '@/lib/utils/phone'
import { formatDate } from '@/lib/utils/date'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Member = {
  id: string
  name: string
  phone: string
  email?: string
  joinDate: string
}

type Pass = {
  id: string
  type: string
  total: number
  used: number
  remain: number
  startDate?: string
  endDate?: string
  issueDate: string
}

type AttendanceRecord = {
  id: string
  date: string
  title: string
  status: '출석' | '결석'
}

type ClassType = {
  id: string
  name: string
}

type PaymentType = {
  id: string
  name: string
}

export default function MemberDetailPage() {
  const params = useParams()
  const memberId = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [passes, setPasses] = useState<Pass[]>([])
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [showPassForm, setShowPassForm] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // 수업 타입 목록
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  
  // 회원권 지급 폼
  const [newPass, setNewPass] = useState({
    classTypeId: '',
    paymentTypeId: '',
    total: 10,
    startDate: formatDate(new Date()),
    endDate: ''
  })

  useEffect(() => {
    loadMemberData()
    loadClassTypes()
    loadPaymentTypes()
  }, [memberId])

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
    return sessionData.access_token
  }

  const loadClassTypes = async () => {
    try {
      const accessToken = getAccessToken()
      if (!accessToken) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/class_types?select=id,name`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const data = await response.json()
      if (Array.isArray(data)) {
        setClassTypes(data)
        if (data.length > 0) {
          setNewPass(prev => ({ ...prev, classTypeId: data[0].id }))
        }
      }
    } catch (error) {
      console.error('❌ 수업 타입 로드 오류:', error)
    }
  }

  const loadPaymentTypes = async () => {
    try {
      const accessToken = getAccessToken()
      if (!accessToken) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/payment_types?select=id,name`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const data = await response.json()
      if (Array.isArray(data)) {
        setPaymentTypes(data)
        if (data.length > 0) {
          setNewPass(prev => ({ ...prev, paymentTypeId: data[0].id }))
        }
      }
    } catch (error) {
      console.error('❌ 결제 타입 로드 오류:', error)
    }
  }

  const loadMemberData = async () => {
    try {
      setLoading(true)
      const accessToken = getAccessToken()
      
      if (!accessToken) {
        console.error('인증 토큰 없음')
        return
      }

      console.log('🔵 회원 상세 조회 시작:', memberId)

      // 1. 회원 정보 조회
      const memberResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/members?id=eq.${memberId}&select=*`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const memberData = await memberResponse.json()
      console.log('✅ 회원 정보:', memberData)

      if (memberData.length === 0) {
        alert('회원을 찾을 수 없습니다.')
        return
      }

      const m = memberData[0]
      setMember({
        id: m.id,
        name: m.name,
        phone: m.id, // members.id가 전화번호
        joinDate: m.join_date
      })

      // 2. 회원권 조회 (class_types 조인)
      const passesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/member_passes?member_id=eq.${memberId}&select=*,class_types(name)&order=created_at.desc`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const passesData = await passesResponse.json()
      console.log('✅ 회원권 목록:', passesData)

      // 배열인지 확인하고 처리
      const formattedPasses: Pass[] = Array.isArray(passesData) 
        ? passesData.map((p: any) => ({
            id: p.id,
            type: p.class_types?.name || '수업',
            total: p.total_count,
            used: p.used_count,
            remain: p.total_count - p.used_count,
            startDate: p.start_date,
            endDate: p.end_date,
            issueDate: formatDate(new Date(p.created_at))
          }))
        : []

      setPasses(formattedPasses)

      // 3. 출석 기록 조회
      const attendanceResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/attendances?member_id=eq.${memberId}&select=*&order=created_at.desc&limit=10`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const attendanceData = await attendanceResponse.json()
      console.log('✅ 출석 기록:', attendanceData)

      // 배열인지 확인하고 처리
      const formattedAttendances: AttendanceRecord[] = Array.isArray(attendanceData)
        ? attendanceData.map((a: any) => ({
            id: a.id,
            date: formatDate(new Date(a.created_at)),
            title: '수업', // TODO: classes 테이블과 조인해서 수업명 가져오기
            status: a.status === 'present' ? '출석' : '결석'
          }))
        : []

      setAttendances(formattedAttendances)

    } catch (error) {
      console.error('❌ 회원 상세 로드 오류:', error)
      alert('회원 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleIssuePass = async () => {
    try {
      const accessToken = getAccessToken()
      
      if (!accessToken) {
        alert('인증 정보가 없습니다.')
        return
      }

      if (!newPass.classTypeId || !newPass.paymentTypeId) {
        alert('수업 타입과 결제 유형을 선택해주세요.')
        return
      }

      console.log('🔵 회원권 지급 시작...')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/member_passes`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            member_id: memberId,
            class_type_id: newPass.classTypeId,
            payment_type_id: newPass.paymentTypeId,
            total_count: newPass.total,
            used_count: 0,
            start_date: newPass.startDate || null,
            end_date: newPass.endDate || null
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ 회원권 지급 실패:', error)
        throw new Error('회원권 지급 실패')
      }

      const data = await response.json()
      console.log('✅ 회원권 지급 성공:', data)

      alert('회원권이 지급되었습니다!')
      setShowPassForm(false)
      setNewPass({
        classTypeId: classTypes[0]?.id || '',
        paymentTypeId: paymentTypes[0]?.id || '',
        total: 10,
        startDate: formatDate(new Date()),
        endDate: ''
      })
      
      // 데이터 다시 로드
      await loadMemberData()

    } catch (error) {
      console.error('❌ 회원권 지급 오류:', error)
      alert('회원권 지급에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">회원을 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 뒤로 가기 */}
      <Link
        href="/members"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← 목록으로
      </Link>

      {/* 회원 프로필 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              전화번호: {formatPhone(member.phone)}
            </p>
            <p className="text-sm text-gray-600">
              가입일: {member.joinDate}
            </p>
          </div>
        </div>
      </div>

      {/* 회원권 관리 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">회원권 관리</h3>
          <button
            onClick={() => setShowPassForm(!showPassForm)}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showPassForm ? '닫기' : '+ 회원권 지급'}
          </button>
        </div>

        {/* 회원권 지급 폼 */}
        {showPassForm && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수업 타입
                </label>
                <select
                  value={newPass.classTypeId}
                  onChange={(e) => setNewPass({ ...newPass, classTypeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {classTypes.length === 0 ? (
                    <option value="">수업 타입을 불러오는 중...</option>
                  ) : (
                    classTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  결제 유형
                </label>
                <select
                  value={newPass.paymentTypeId}
                  onChange={(e) => setNewPass({ ...newPass, paymentTypeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {paymentTypes.length === 0 ? (
                    <option value="">결제 유형을 불러오는 중...</option>
                  ) : (
                    paymentTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  총 회차
                </label>
                <input
                  type="number"
                  value={newPass.total}
                  onChange={(e) => setNewPass({ ...newPass, total: Number(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={newPass.startDate}
                    onChange={(e) => setNewPass({ ...newPass, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    종료일 (선택)
                  </label>
                  <input
                    type="date"
                    value={newPass.endDate}
                    onChange={(e) => setNewPass({ ...newPass, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleIssuePass}
                disabled={!newPass.classTypeId || !newPass.paymentTypeId}
                className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                지급하기
              </button>
            </div>
          </div>
        )}

        {/* 회원권 목록 */}
        <div className="space-y-3">
          {passes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              회원권이 없습니다
            </div>
          ) : (
            passes.map((pass) => {
              const progressRate = Math.round((pass.used / pass.total) * 100)
              const isExpired = pass.remain === 0

              return (
                <div 
                  key={pass.id}
                  className={`
                    p-4 rounded-lg border-2
                    ${isExpired 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`
                        px-3 py-1 text-sm font-bold rounded-full border-2
                        ${isExpired
                          ? 'bg-gray-100 text-gray-500 border-gray-300'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                        }
                      `}>
                        {pass.type}
                      </span>
                    </div>
                    {isExpired && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded">
                        만료
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">진행률</span>
                      <span className={`font-bold ${isExpired ? 'text-gray-500' : 'text-gray-900'}`}>
                        {pass.used}/{pass.total}회 ({progressRate}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${isExpired ? 'bg-gray-400' : 'bg-blue-500'}`}
                        style={{ width: `${progressRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>잔여: {pass.remain}회</span>
                      <span>발급일: {pass.issueDate}</span>
                    </div>
                    {(pass.startDate || pass.endDate) && (
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {pass.startDate && <span>시작: {pass.startDate}</span>}
                        {pass.endDate && <span>종료: {pass.endDate}</span>}
                      </div>
                    )}
                  </div>

                  {!isExpired && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      <button className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors">
                        차감
                      </button>
                      <button className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 font-medium rounded hover:bg-red-100 transition-colors">
                        취소
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 출석 히스토리 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">출석 히스토리</h3>

        <div className="space-y-2">
          {attendances.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              출석 기록이 없습니다
            </div>
          ) : (
            attendances.map((attendance) => (
              <div 
                key={attendance.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-24">
                    {attendance.date}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {attendance.title}
                  </span>
                </div>
                <span className={`
                  px-3 py-1 text-xs font-bold rounded-full
                  ${attendance.status === '출석'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                  }
                `}>
                  {attendance.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}