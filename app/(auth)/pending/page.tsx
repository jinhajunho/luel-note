'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function PendingPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()

  // 프로필이 로드되면 역할에 맞는 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && profile) {
      const role = profile.role || 'member'
      router.push(`/${role}/schedule`)
    }
  }, [profile, loading, router])

  const handleLogout = async () => {
    try {
      const { signOut } = await import('@/app/actions/auth')
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  // 로딩 중이거나 프로필 확인 중이면 로딩 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Luel Note
          </h1>
        </div>

        {/* 승인 대기 메시지 (더 이상 사용되지 않지만 혹시 모를 상황 대비) */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⏳</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            페이지 이동 중...
          </h2>

          <p className="text-gray-600 mb-6">
            잠시만 기다려주세요.
          </p>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
