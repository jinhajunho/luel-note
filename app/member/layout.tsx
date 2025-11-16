"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import NotificationsPopover from '@/components/common/NotificationsPopover'
import ProfileMenuPopover from '@/components/common/ProfileMenuPopover'
import BottomNavigation from '@/components/common/BottomNavigation'
import { getMemberIdByProfileId } from '@/app/actions/member-data'
import { checkMemberHasMembership } from '@/app/actions/membership'
import { useEffect as ReactUseEffect } from 'react'
import { getBus } from '@/lib/bus'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [hasMembership, setHasMembership] = useState<boolean | null>(null)
  const [checkingMembership, setCheckingMembership] = useState(true)

  // 역할 체크: 강사나 관리자는 해당 페이지로 리다이렉트
  useEffect(() => {
    if (authLoading || !profile) return
    
    if (profile.role === 'instructor') {
      console.log('🔄 강사 권한 - 강사 페이지로 리다이렉트')
      router.replace('/instructor/schedule')
      return
    }
    if (profile.role === 'admin') {
      console.log('🔄 관리자 권한 - 관리자 페이지로 리다이렉트')
      router.replace('/admin/schedule')
      return
    }
  }, [profile, authLoading, router])

  // 회원권 체크 (회원만)
  useEffect(() => {
    const checkMembership = async () => {
      console.log('🔍 회원권 체크 시작:', { authLoading, profileId: profile?.id, role: profile?.role })
      
      if (authLoading || !profile?.id) {
        console.log('⏳ 프로필 로딩 대기 중...')
        setCheckingMembership(true)
        return
      }

      // 강사나 관리자는 회원권 체크 건너뛰기
      if (profile.role !== 'member') {
        console.log('⏭️ 회원이 아닌 경우 회원권 체크 건너뛰기:', profile.role)
        setCheckingMembership(false)
        return
      }

      try {
        console.log('⏳ 회원 ID 조회 시작...')
        const memberId = await getMemberIdByProfileId(profile.id)
        console.log('📊 회원 ID 조회 결과:', memberId)
        
        if (!memberId) {
          console.warn('⚠️ 회원 ID 없음 - 회원권 없음')
          setHasMembership(false)
          setCheckingMembership(false)
          return
        }

        console.log('⏳ 회원권 존재 여부 확인 시작...')
        const hasMembership = await checkMemberHasMembership(memberId)
        console.log('📊 회원권 존재 여부:', hasMembership)
        
        setHasMembership(hasMembership)
        console.log('✅ 회원권 체크 완료:', { hasMembership })
      } catch (error) {
        console.error('❌ 회원권 체크 실패:', error)
        setHasMembership(false)
      } finally {
        setCheckingMembership(false)
        console.log('⏳ 회원권 체크 종료')
      }
    }

    checkMembership()
  }, [profile?.id, profile?.role, authLoading])

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

  // 프로필 로딩 중이면 로딩 화면
  if (authLoading) {
    console.log('⏳ 프로필 로딩 중 - 로딩 화면:', { authLoading })
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 프로필이 없으면 로딩 화면
  if (!profile) {
    console.log('⏳ 프로필 없음 - 로딩 화면')
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 강사나 관리자는 회원권 체크 없이 리다이렉트 중이므로 로딩 화면 표시
  if (profile.role === 'instructor' || profile.role === 'admin') {
    console.log('⏳ 강사/관리자 리다이렉트 중 - 로딩 화면 표시')
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">페이지 이동 중...</p>
        </div>
      </div>
    )
  }

  // 회원의 경우 회원권 체크가 완료될 때까지 로딩 화면 표시
  if (profile.role === 'member') {
    // 회원권 체크 중이면 로딩 화면
    if (checkingMembership || hasMembership === null) {
      console.log('⏳ 회원권 체크 중 - 로딩 화면:', { checkingMembership, hasMembership })
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      )
    }

    // 회원권이 없으면 안내 메시지 표시
    if (hasMembership === false) {
      console.log('⚠️ 회원권 없음 - 안내 메시지:', { hasMembership })
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-2">회원권이 없습니다</p>
            <p className="text-sm text-gray-500">관리자에게 문의하세요</p>
          </div>
        </div>
      )
    }

    // 회원권이 있으면 페이지 렌더링 (hasMembership === true)
    if (hasMembership === true) {
      console.log('✅ 회원권 있음 - 페이지 렌더링:', { hasMembership })
      // 아래 return 문으로 이동
    }
  }

  console.log('✅ 페이지 렌더링:', { hasMembership, checkingMembership, role: profile?.role })

  return (
    <div className="min-h-screen bg-[#f5f1e8] pb-24">
      {/* Header (member schedule style) */}
      <header className="bg-white border-b border-[#f0ebe1] px-5 h-[50px] sticky top-0 z-50">
        <div className="max-w-2xl mx-auto h-full flex items-center justify-between">
          <h1 className="font-sans text-xl leading-none tracking-tight font-extrabold text-[#9BCDE8]">LUEL NOTE</h1>
          <div className="flex items-center gap-2">
            {profile?.role === 'guest' && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-600">
                비회원
              </span>
            )}
            {profile?.role === 'member' && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600">
                회원
              </span>
            )}
            <NotificationsPopover />
            <ProfileMenuPopover />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full">{children}</main>

      <BottomNavigation />
    </div>
  )
}


