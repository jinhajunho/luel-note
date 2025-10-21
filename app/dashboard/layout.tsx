'use client'

import type { ReactNode } from 'react'
import Header from '@/components/layout/Header'

export default function DashboardLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <div className="min-h-screen">
      <Header currentPage="대시보드" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}