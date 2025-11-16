"use client"

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import NotificationsPopover from '@/components/common/NotificationsPopover'
import ProfileMenuPopover from '@/components/common/ProfileMenuPopover'
import BottomNavigation from '@/components/common/BottomNavigation'
import { getNavItemsByRole } from '@/lib/navigation'
import { useEffect } from 'react'
import { getBus } from '@/lib/bus'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useAuth()

  const isAdmin = profile?.role === 'admin'

  const isAdminView = pathname?.startsWith('/admin') ?? false
  const currentLabel = isAdminView ? '관리자' : '강사'
  const targetPath = isAdminView ? '/instructor/members' : '/admin/schedule'
  const targetLabel = isAdminView ? '강사 화면으로 전환' : '관리자 화면으로 전환'

  // 권한 가드: 관리자만 접근 허용
  useEffect(() => {
    if (!profile) return
    if (profile.role !== 'admin') {
      // 강사는 강사 홈으로, 그 외는 회원 홈으로
      if (profile.role === 'instructor') {
        router.replace('/instructor/schedule')
      } else {
        router.replace('/member/schedule')
      }
    }
  }, [profile, router])

  // 글로벌 동기화 리스너 + 백업 폴링
  useEffect(() => {
    const bus = getBus()
    const onMessage = (e: MessageEvent) => {
      const data = e.data
      if (!data || typeof data !== 'object') return
      if (
        data.type === 'notifications-updated' ||
        data.type === 'notice-updated' ||
        data.type === 'class-updated' ||
        data.type === 'attendance-updated'
      ) {
        try {
          router.refresh()
        } catch {}
      }
    }
    if (bus) {
      bus.addEventListener('message', onMessage as EventListener)
    }
    const interval = setInterval(() => {
      try {
        router.refresh()
      } catch {}
    }, 15000)
    return () => {
      if (bus) bus.removeEventListener('message', onMessage as EventListener)
      clearInterval(interval)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#f5f1e8] pb-24">
      {/* Header (same style as instructor) */}
      <header className="bg-white border-b border-[#f0ebe1] px-5 h-[50px] sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto h-full flex items-center justify-between">
          <h1 className="font-sans text-xl leading-none tracking-tight font-extrabold text-[#9BCDE8]">LUEL NOTE</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => router.push(targetPath)}
                title={targetLabel}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {currentLabel}
              </button>
            )}
            <NotificationsPopover />
            <ProfileMenuPopover />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full overflow-x-hidden">{children}</main>

      <BottomNavigation />
    </div>
  )
}

