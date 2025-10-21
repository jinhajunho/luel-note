'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'

export default function SessionsLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      <Header currentPage="수업" />

      {/* 서브 네비게이션 */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 h-12 items-center">
            <Link 
              href="/sessions" 
              className={`
                text-sm font-bold h-full flex items-center
                ${pathname === '/sessions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              수업 목록
            </Link>
            <Link 
              href="/sessions/create"
              className={`
                text-sm font-bold h-full flex items-center
                ${pathname === '/sessions/create'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              수업 등록
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}