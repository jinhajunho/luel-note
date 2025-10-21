'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import ProtectedRoute from '@/components/ProtectedRoute'

function FinanceRedirect() {
  const { isAdmin } = usePermissions()

  useEffect(() => {
    // admin은 전체 정산으로, instructor/member는 내 정산으로
    if (isAdmin) {
      redirect('/finance/admin')
    } else {
      redirect('/finance/my')
    }
  }, [isAdmin])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">이동 중...</p>
      </div>
    </div>
  )
}

export default function FinancePage() {
  return (
    <ProtectedRoute requireMenu="settlements">
      <FinanceRedirect />
    </ProtectedRoute>
  )
}