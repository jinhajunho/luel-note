'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'

export default function FinanceLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      <Header currentPage="정산" />

      {/* 서브 네비게이션 */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 h-12 items-center">
            <Link 
              href="/finance/admin" 
              className={`
                text-sm font-bold h-full flex items-center
                ${pathname === '/finance/admin'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              전체 정산
            </Link>
            <Link 
              href="/finance/instructor"
              className={`
                text-sm font-bold h-full flex items-center
                ${pathname === '/finance/instructor'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              내 정산
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