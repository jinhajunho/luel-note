'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// ==================== 타입 정의 ====================
type Profile = {
  id: string
  name: string
  role: 'member' | 'instructor' | 'admin'
  email: string
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  // 프로필 로드
  const loadProfile = async () => {
    try {
      // TODO: 실제 Supabase 인증으로 교체
      // const { data: { user } } = await supabase.auth.getUser()
      // const { data: profile } = await supabase
      //   .from('profiles')
      //   .select('*')
      //   .eq('id', user.id)
      //   .single()
      
      // 더미 데이터
      setTimeout(() => {
        setProfile({
          id: '1',
          name: '홍길동',
          role: 'member',
          email: 'hong@example.com'
        })
        setLoading(false)
      }, 100)
    } catch (error) {
      console.error('프로필 로드 실패:', error)
      setLoading(false)
    }
  }

  // 관리자 모드 토글
  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode)
    // TODO: 실제 역할 전환 로직
    if (!isAdminMode) {
      router.push('/admin/dashboard')
    } else {
      router.push('/instructor/dashboard')
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      // TODO: Supabase 로그아웃
      // await supabase.auth.signOut()
      router.push('/login')
    }
  }

  // 로딩 중일 때는 헤더만 표시
  if (loading || !profile) {
    return (
      <header className="bg-white border-b border-[#f0ebe1] px-5 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#7EA1B3]" />
            <span className="hidden sm:block text-lg font-semibold text-[#1a1a1a]">
              LUEL NOTE
            </span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-[#f0ebe1] px-5 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#7EA1B3]" />
          <span className="hidden sm:block text-lg font-semibold text-[#1a1a1a]">
            LUEL NOTE
          </span>
        </div>

        {/* 우측 액션 */}
        <div className="flex items-center gap-2">
          {/* 관리자 전환 버튼 (관리자만) */}
          {profile.role === 'admin' && (
            <button
              onClick={toggleAdminMode}
              className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {isAdminMode ? '강사' : '관리자'}
            </button>
          )}

          {/* 알림 버튼 */}
          <button className="relative w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* 알림 뱃지 */}
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* 프로필 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {profile.name[0]}
                </span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 드롭다운 메뉴 */}
            {showDropdown && (
              <>
                {/* 배경 클릭 시 닫기 */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)}
                />
                
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#f0ebe1] rounded-xl shadow-lg z-50">
                  {/* 사용자 정보 */}
                  <div className="px-4 py-3 border-b border-[#f0ebe1]">
                    <div className="text-sm font-semibold text-[#1a1a1a] mb-1">
                      {profile.name}
                    </div>
                    <div className="text-xs text-[#7a6f61]">
                      {profile.role === 'admin' ? '관리자' : profile.role === 'instructor' ? '강사' : '회원'}
                    </div>
                  </div>

                  {/* 메뉴 아이템 */}
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      router.push('/profile')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f9f8f5] transition-colors text-sm text-[#1a1a1a]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    프로필 설정
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-sm text-red-600 rounded-b-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
