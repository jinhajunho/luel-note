'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { signOut } from '@/app/actions/auth'

export default function Header({ currentPage }: { currentPage: string }) {
  const { profile } = useAuth()

  const handleSignOut = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await signOut()
    }
  }

  const menuItems = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/attendance', label: '출석' },
    { href: '/members', label: '회원' },
    { href: '/sessions', label: '수업' },
    { href: '/finance/admin', label: '정산' },
    { href: '/settings', label: '설정' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Luel Note</h1>
        
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm ${
                  currentPage === item.label
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* 사용자 정보 & 로그아웃 */}
          {profile && (
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-700">
                {profile.name}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}