'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { usePermissions } from '@/hooks/usePermissions'
import { formatPhone } from '@/lib/utils/phone'

export default function MembersPage() {
  return (
    <ProtectedRoute requireMenu="members">
      <MembersContent />
    </ProtectedRoute>
  )
}

type Member = {
  id: string
  name: string
  phone: string
  isGuest: boolean
  status: 'active' | 'inactive' | 'guest'
  joinDate: string
  remainingSessions: number
  lastVisit?: string
}

function MembersContent() {
  const { can } = usePermissions()
  const [members, setMembers] = useState<Member[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'guest'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      
      // 쿠키에서 토큰 가져오기
      const cookies = document.cookie.split('; ')
      
      // 동적으로 프로젝트 ID 추출
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
      const authCookie = cookies.find(c => c.startsWith(`sb-${projectId}-auth-token=`))
      
      if (!authCookie) {
        console.error('인증 쿠키 없음')
        setLoading(false)
        return
      }

      let cookieValue = decodeURIComponent(authCookie.split('=')[1])
      if (cookieValue.startsWith('base64-')) {
        cookieValue = atob(cookieValue.substring(7))
      }
      
      const sessionData = JSON.parse(cookieValue)
      const accessToken = sessionData.access_token

      console.log('🔵 회원 목록 조회 시작...')

      // members와 member_passes 조회
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_members_with_passes`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('🔵 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error:', errorText)
        throw new Error('회원 데이터 로드 실패')
      }

      const data = await response.json()
      console.log('✅ 회원 데이터:', data)
      
      // DB 데이터를 Member 타입으로 변환
      const formattedMembers: Member[] = data.map((m: any) => ({
        id: m.id,
        name: m.name,
        phone: m.id, // members.id가 전화번호
        isGuest: m.is_guest,
        status: m.is_guest ? 'guest' : m.status,
        joinDate: m.join_date,
        remainingSessions: m.total_remaining || 0,
        lastVisit: m.last_visit || undefined
      }))

      setMembers(formattedMembers)
    } catch (error) {
      console.error('❌ 회원 로드 오류:', error)
      alert('회원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members
    .filter(member => {
      if (filter === 'all') return true
      return member.status === filter
    })
    .filter(member => {
      if (!searchQuery) return true
      return (
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery)
      )
    })

  const activeCount = members.filter(m => m.status === 'active').length
  const inactiveCount = members.filter(m => m.status === 'inactive').length
  const guestCount = members.filter(m => m.status === 'guest').length

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            총 {members.length}명의 회원
          </p>
        </div>
        {can.createMember && (
          <Link
            href="/members/register"
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 회원 등록
          </Link>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">전체</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {members.length}명
          </div>
        </button>

        <button
          onClick={() => setFilter('active')}
          className={`p-4 rounded-xl border-2 transition-colors ${
            filter === 'active'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">활성</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {activeCount}명
          </div>
        </button>

        <button
          onClick={() => setFilter('inactive')}
          className={`p-4 rounded-xl border-2 transition-colors ${
            filter === 'inactive'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">휴면</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {inactiveCount}명
          </div>
        </button>

        <button
          onClick={() => setFilter('guest')}
          className={`p-4 rounded-xl border-2 transition-colors ${
            filter === 'guest'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="text-sm text-gray-600">게스트</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {guestCount}명
          </div>
        </button>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <input
          type="text"
          placeholder="이름 또는 전화번호로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 로딩 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      ) : (
        /* 회원 목록 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              회원이 없습니다
            </div>
          ) : (
            filteredMembers.map((member) => (
              <Link
                key={member.id}
                href={`/members/${member.id}`}
                className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPhone(member.phone)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    member.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : member.status === 'inactive'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {member.status === 'active' ? '활성' :
                     member.status === 'inactive' ? '휴면' : '게스트'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">가입일</span>
                    <span className="font-medium text-gray-900">
                      {member.joinDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">잔여 수업</span>
                    <span className="font-bold text-blue-600">
                      {member.remainingSessions}회
                    </span>
                  </div>
                  {member.lastVisit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">최근 방문</span>
                      <span className="font-medium text-gray-900">
                        {member.lastVisit}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}