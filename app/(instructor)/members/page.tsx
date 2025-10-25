'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import MemberCard from '@/components/common/MemberCard'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'

// 타입 정의
type Member = {
  id: string
  name: string
  phone: string
  status: 'active' | 'inactive' | 'guest'
  joinDate?: string
  lastVisit?: string
  remainingLessons?: number
}

export default function InstructorMembersPage() {
  const { profile } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'member' | 'guest'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (profile) {
      loadMembers()
    }
  }, [profile])

  const loadMembers = async () => {
    try {
      setLoading(true)
      
      // TODO: Supabase에서 담당 회원 로드
      // instructor_members 테이블 조인해서 본인 담당 회원만 가져오기
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockMembers: Member[] = [
        {
          id: '1',
          name: '홍길동',
          phone: '010-1234-5678',
          status: 'active',
          joinDate: '2024-02-20',
          lastVisit: '어제',
          remainingLessons: 8
        },
        {
          id: '2',
          name: '김철수',
          phone: '010-2345-6789',
          status: 'active',
          joinDate: '2024-01-15',
          lastVisit: '오늘',
          remainingLessons: 12
        },
        {
          id: '3',
          name: '박영희',
          phone: '010-3456-7890',
          status: 'active',
          joinDate: '2024-03-10',
          lastVisit: '3일 전',
          remainingLessons: 15
        },
        {
          id: '4',
          name: '이민수',
          phone: '010-4567-8901',
          status: 'inactive',
          joinDate: '2023-11-05',
          lastVisit: '30일 전',
          remainingLessons: 0
        },
        {
          id: '5',
          name: '최지은',
          phone: '010-5678-9012',
          status: 'active',
          joinDate: '2024-02-20',
          lastVisit: '어제',
          remainingLessons: 8
        },
        {
          id: '6',
          name: '이영수',
          phone: '010-6789-0123',
          status: 'guest',
          lastVisit: '2일 전'
        },
        {
          id: '7',
          name: '정수미',
          phone: '010-7890-1234',
          status: 'guest',
          lastVisit: '어제'
        }
      ]
      
      setMembers(mockMembers)
    } catch (error) {
      console.error('❌ 회원 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 필터링
  const filteredMembers = members
    .filter(member => {
      if (filter === 'all') return true
      if (filter === 'member') return member.status !== 'guest'
      if (filter === 'guest') return member.status === 'guest'
      return true
    })
    .filter(member => {
      if (!searchQuery) return true
      return (
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery)
      )
    })

  // 통계
  const memberCount = members.filter(m => m.status !== 'guest').length
  const guestCount = members.filter(m => m.status === 'guest').length
  const activeCount = members.filter(m => m.status === 'active').length

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
            <h2 className="text-2xl font-bold text-gray-900">담당 회원</h2>
            <p className="text-sm text-gray-500 mt-1">
              내가 담당하는 회원을 관리하세요
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`
                p-4 rounded-xl border-2 transition-colors text-left
                ${filter === 'all'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-sm text-gray-600">전체</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {members.length}명
              </div>
            </button>

            <button
              onClick={() => setFilter('member')}
              className={`
                p-4 rounded-xl border-2 transition-colors text-left
                ${filter === 'member'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-sm text-gray-600">회원</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {memberCount}명
              </div>
            </button>

            <button
              onClick={() => setFilter('guest')}
              className={`
                p-4 rounded-xl border-2 transition-colors text-left
                ${filter === 'guest'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="text-sm text-gray-600">게스트</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {guestCount}명
              </div>
            </button>
          </div>

          {/* 검색 */}
          <div className="relative">
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="회원 이름 또는 전화번호로 검색"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 회원 목록 */}
          {loading ? (
            <Loading />
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-3">
              {filteredMembers.map(member => (
                <MemberCard
                  key={member.id}
                  id={member.id}
                  name={member.name}
                  phone={member.phone}
                  status={member.status}
                  joinDate={member.joinDate}
                  remainingLessons={member.remainingLessons}
                  showLink={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="담당 회원이 없습니다"
              description={
                searchQuery 
                  ? "검색 결과가 없습니다." 
                  : "아직 담당하는 회원이 없습니다."
              }
            />
          )}
        </div>
      </main>

      <BottomNavigation profile={profile} />
    </>
  )
}
