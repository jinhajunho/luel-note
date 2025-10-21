'use client'

import { useState, useEffect } from 'react'
import { formatPhone } from '@/lib/utils/phone'

type Guest = {
  id: string
  name: string
  phone: string
  lastIntroDate: string
  introCount: number
  status: 'pending' | 'promoted'
}

export default function GuestManagePage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'promoted'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGuests()
  }, [])

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

  const loadGuests = async () => {
    try {
      setLoading(true)
      const accessToken = getAccessToken()
      
      if (!accessToken) {
        console.error('인증 토큰 없음')
        return
      }

      console.log('🔵 게스트 목록 조회 시작...')

      // members 테이블에서 is_guest = true인 회원 조회
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/members?is_guest=eq.true&select=*&order=join_date.desc`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('게스트 목록 조회 실패')
      }

      const data = await response.json()
      console.log('✅ 게스트 데이터:', data)

      // Guest 타입으로 변환
      const formattedGuests: Guest[] = data.map((g: any) => ({
        id: g.id,
        name: g.name,
        phone: g.id, // members.id가 전화번호
        lastIntroDate: g.join_date || '', // TODO: 실제로는 최근 인트로 수업 날짜
        introCount: 0, // TODO: attendances에서 인트로 수업 횟수 계산
        status: g.is_guest ? 'pending' : 'promoted'
      }))

      setGuests(formattedGuests)

    } catch (error) {
      console.error('❌ 게스트 로드 오류:', error)
      alert('게스트 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async (guestId: string, guestName: string) => {
    if (!confirm(`${guestName}님을 정회원으로 승격하시겠습니까?`)) {
      return
    }

    try {
      const accessToken = getAccessToken()
      
      if (!accessToken) {
        alert('인증 정보가 없습니다.')
        return
      }

      console.log('🔵 정회원 승격 시작:', guestId)

      // members 테이블에서 is_guest를 false로 변경
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/members?id=eq.${guestId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_guest: false,
            status: 'active'
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ 승격 실패:', error)
        throw new Error('승격 실패')
      }

      console.log('✅ 정회원 승격 성공')

      alert('정회원으로 승격되었습니다!')
      
      // 목록 다시 로드
      await loadGuests()

    } catch (error) {
      console.error('❌ 승격 오류:', error)
      alert('정회원 승격에 실패했습니다.')
    }
  }

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = 
      guest.name.includes(searchTerm) || 
      guest.phone.includes(searchTerm)
    
    const matchesFilter = 
      filterStatus === 'all' || 
      guest.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const pendingCount = guests.filter(g => g.status === 'pending').length
  const promotedCount = guests.filter(g => g.status === 'promoted').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">게스트 관리</h2>
        <p className="text-sm text-gray-500 mt-1">
          인트로 수업 참여자 관리 및 회원 승격
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">전체</div>
          <div className="text-2xl font-bold text-gray-900">{guests.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">미승격</div>
          <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">승격 완료</div>
          <div className="text-2xl font-bold text-green-600">{promotedCount}</div>
        </div>
      </div>

      {/* 검색 & 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름 또는 전화번호로 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 필터 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`
                px-4 py-2 text-sm font-bold rounded-lg transition-colors
                ${filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              전체
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`
                px-4 py-2 text-sm font-bold rounded-lg transition-colors
                ${filterStatus === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              미승격
            </button>
            <button
              onClick={() => setFilterStatus('promoted')}
              className={`
                px-4 py-2 text-sm font-bold rounded-lg transition-colors
                ${filterStatus === 'promoted'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              승격 완료
            </button>
          </div>
        </div>
      </div>

      {/* 게스트 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? '검색 결과가 없습니다' 
              : '등록된 게스트가 없습니다'
            }
          </div>
        ) : (
          filteredGuests.map((guest) => {
            const isPromoted = guest.status === 'promoted'

            return (
              <div 
                key={guest.id}
                className={`
                  bg-white rounded-xl border-2 p-6 transition-all
                  ${isPromoted 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 hover:shadow-md'
                  }
                `}
              >
                {/* 게스트 정보 */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {guest.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPhone(guest.phone)}
                    </p>
                  </div>
                  <span className={`
                    px-3 py-1 text-xs font-bold rounded-full
                    ${isPromoted
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                    }
                  `}>
                    {isPromoted ? '승격 완료' : '미승격'}
                  </span>
                </div>

                {/* 인트로 정보 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">인트로 횟수</span>
                    <span className="font-bold text-gray-900">
                      {guest.introCount}회
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">가입일</span>
                    <span className="font-medium text-gray-900">
                      {guest.lastIntroDate}
                    </span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                {!isPromoted ? (
                  <button
                    onClick={() => handlePromote(guest.id, guest.name)}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    회원 승격
                  </button>
                ) : (
                  <div className="w-full px-4 py-3 bg-green-100 text-green-700 font-bold rounded-lg text-center border-2 border-green-300">
                    ✓ 정회원
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