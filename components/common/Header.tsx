'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

interface HeaderProps {
  profile: Profile
}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const [adminMode, setAdminMode] = useState<'admin' | 'instructor'>('admin')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 관리자/강사 모드 전환
  const toggleAdminMode = () => {
    const newMode = adminMode === 'admin' ? 'instructor' : 'admin'
    setAdminMode(newMode)
    
    // 실제 라우팅 (예시)
    if (newMode === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/instructor/dashboard')
    }
  }

  // 로그아웃
  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      router.push('/login')
    }
  }

  // 역할 텍스트
  const getRoleText = () => {
    if (profile.role === 'admin') {
      return adminMode === 'admin' ? '관리자' : '강사 모드'
    }
    if (profile.role === 'instructor') return '강사'
    return '회원'
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#f0ebe1]">
      <div className="max-w-7xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/dashboard" className="text-2xl font-bold text-[#7EA1B3] hover:text-[#6a91a3] transition-colors tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            LUEL NOTE
          </Link>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2">
            {/* 관리자 전환 버튼 (관리자만) */}
            {profile.role === 'admin' && (
              <button
                onClick={toggleAdminMode}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                aria-label={`${adminMode === 'admin' ? '관리자' : '강사'} 모드`}
              >
                {adminMode === 'admin' ? '관리자' : '강사'}
              </button>
            )}

            {/* 알림 아이콘 */}
            <button
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="알림"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* 알림 뱃지 */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* 프로필 드롭다운 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="프로필 메뉴"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <svg
                  className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#f0ebe1] py-1">
                  {/* 사용자 정보 */}
                  <div className="px-4 py-3 border-b border-[#f0ebe1]">
                    <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                    <p className="text-xs text-[#7a6f61] mt-1">{getRoleText()}</p>
                  </div>

                  {/* 메뉴 */}
                  <Link
                    href="/profile"
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f9f8f5] transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    프로필 설정
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
