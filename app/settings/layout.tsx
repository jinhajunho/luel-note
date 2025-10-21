'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Header from '@/components/layout/Header'

export default function SettingsLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const pathname = usePathname()
  const { profile } = useAuth()

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen" suppressHydrationWarning>
      <Header currentPage="설정" />

      {/* 서브 네비게이션 */}
      <div className="bg-gray-50 border-b border-gray-200" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 h-12 items-center">
            <Link 
              href="/settings" 
              className={`
                text-sm font-bold h-full flex items-center
                ${pathname === '/settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              프로필
            </Link>
            
            {isAdmin && (
              <Link 
                href="/settings/admin"
                className={`
                  text-sm font-bold h-full flex items-center
                  ${pathname === '/settings/admin'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                관리자 설정
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8" suppressHydrationWarning>
        {children}
      </main>
    </div>
  )
}