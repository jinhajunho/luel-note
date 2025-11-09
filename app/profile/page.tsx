'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import AdminSettingsModal from '@/components/common/AdminSettingsModal'
import {
  getNotificationPreferences as fetchNotificationPrefs,
  updateNotificationPreferences as persistNotificationPrefs,
} from '@/app/actions/notification-preferences'

// ==================== 타입 정의 ====================
type UserProfile = {
  name: string
  phone: string
  email: string
  role: 'member' | 'instructor' | 'admin' | 'guest'
}

// ==================== 메인 컴포넌트 ====================
export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAdminSettingsModal, setShowAdminSettingsModal] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [notif, setNotif] = useState({ lesson: true, attendance: true, notice: true })
  const [notifLoading, setNotifLoading] = useState(true)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifError, setNotifError] = useState<string | null>(null)
  const auth = useAuth()
  const { profile: authProfile, user: authUser, refreshProfile } = auth
  const effectiveRole = authProfile?.role ?? profile?.role
  const isAdmin = effectiveRole === 'admin'

  // 프로필 로드 함수 (useCallback으로 메모이제이션)
  const loadProfile = useCallback(async () => {
    // useAuth()에서 실제 프로필 가져오기
    // auth.profile이 최신이므로 우선 사용 (권한 변경 후 즉시 반영)
    const currentAuthProfile = auth.profile || authProfile
    const currentAuthUser = auth.user || authUser

    if (currentAuthProfile || currentAuthUser) {
      console.log('📊 프로필 로드:', currentAuthProfile, currentAuthUser)
      const resolvedRole = (currentAuthProfile?.role ?? 'guest') as UserProfile['role']
      const userProfile: UserProfile = {
        name: currentAuthProfile?.name || currentAuthUser?.name || '',
        phone: currentAuthProfile?.phone || currentAuthUser?.phone || '',
        email: currentAuthUser?.email || '',
        role: resolvedRole
      }
      console.log('✅ 프로필 설정:', userProfile)
      setProfile(userProfile)
      setForm({
        name: userProfile.name,
        phone: userProfile.phone,
        email: userProfile.email
      })
      setAvatarUrl('')
      return
    }

    console.warn('⚠️ 프로필 정보를 찾을 수 없습니다. 초기화합니다.')
    setProfile(null)
    setForm({ name: '', phone: '', email: '' })
    setAvatarUrl('')
  }, [auth.profile, auth.user, authProfile, authUser])

  // 초기 로드 및 auth.profile 변경 시 프로필 다시 로드
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    let active = true
    const loadPrefs = async () => {
      try {
        setNotifLoading(true)
        setNotifError(null)
        const prefs = await fetchNotificationPrefs()
        if (!active) return
        setNotif(prefs)
      } catch (error) {
        console.error('알림 설정 로드 실패:', error)
        if (active) {
          setNotifError('알림 설정을 불러오는 중 문제가 발생했습니다.')
        }
      } finally {
        if (active) {
          setNotifLoading(false)
        }
      }
    }
    loadPrefs()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (profile) {
      const changed = 
        form.name !== profile.name ||
        form.phone !== profile.phone ||
        form.email !== profile.email
      setHasChanges(changed)
    }
  }, [form, profile])

  // 페이지 포커스 시 프로필 다시 로드 (권한 변경 후 반영)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && authProfile) {
        // 권한 변경 후 반영을 위해 프로필 새로고침
        await refreshProfile()
        // refreshProfile 후 auth.profile이 업데이트되므로 약간의 지연 후 로드
        setTimeout(() => {
          loadProfile()
        }, 100)
      }
    }

    const handleFocus = async () => {
      if (authProfile) {
        // 권한 변경 후 반영을 위해 프로필 새로고침
        await refreshProfile()
        // refreshProfile 후 auth.profile이 업데이트되므로 약간의 지연 후 로드
        setTimeout(() => {
          loadProfile()
        }, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [authProfile, refreshProfile, loadProfile])

  // 프로필 저장
  const handleSave = async () => {
    if (!hasChanges) {
      alert('변경된 내용이 없습니다')
      return
    }

    // 데이터 업데이트
    if (profile) {
      setProfile({
        ...profile,
        ...form
      })
    }
    setHasChanges(false)
    alert('프로필이 수정되었습니다')
    router.back()
  }

  // 취소
  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('변경사항이 저장되지 않습니다. 취소하시겠습니까?')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  // 비밀번호 변경
  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert('새 비밀번호가 일치하지 않습니다')
      return
    }
    if (passwordForm.new.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다')
      return
    }
    
    // 비밀번호 변경
    alert('비밀번호가 변경되었습니다')
    setShowPasswordModal(false)
    setPasswordForm({ current: '', new: '', confirm: '' })
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-[#7a6f61]">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* 메인 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-5 py-5 pb-24">
        {/* 아바타 + 이름 섹션 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-600 text-sm">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                form.name.slice(0, 1) || 'U'
              )}
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-gray-900">{form.name || '이름 없음'}</div>
              <div className="text-sm text-[#7a6f61]">{form.email || '이메일 없음'}</div>
            </div>
            <label className="px-3 py-2 rounded-lg border border-[#f0ebe1] text-sm text-gray-900 bg-white cursor-pointer hover:bg-[#f5f1e8]">
              사진 변경
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const url = URL.createObjectURL(file)
                    setAvatarUrl(url)
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* 프로필 정보 카드 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            프로필 정보
          </h2>

          <div className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">
                이름
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* 연락처 */}
            <div>
              <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">
                연락처
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">
                이메일
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* 역할 */}
            <div>
              <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">
                역할
              </label>
              <div
                className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${
                  effectiveRole === 'admin'
                    ? 'bg-red-50 text-red-600'
                    : effectiveRole === 'instructor'
                    ? 'bg-blue-50 text-blue-600'
                    : effectiveRole === 'guest'
                    ? 'bg-orange-50 text-orange-600'
                    : 'bg-green-50 text-green-600'
                }`}
              >
                {effectiveRole === 'admin'
                  ? '관리자'
                  : effectiveRole === 'instructor'
                  ? '강사'
                  : effectiveRole === 'guest'
                  ? '비회원'
                  : '회원'}
              </div>
            </div>
          </div>
        </div>

        {/* 알림 설정 카드 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h2>
          <div className="space-y-3">
            {notifError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {notifError}
              </div>
            )}
            {notifLoading && (
              <div className="text-xs text-[#7a6f61] bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg px-3 py-2">
                알림 설정을 불러오는 중입니다...
              </div>
            )}
            <label className="flex items-center justify-between py-2">
              <span className="text-sm text-[#1a1a1a]">레슨 알림</span>
              <button
                onClick={() => setNotif((n) => ({ ...n, lesson: !n.lesson }))}
                aria-pressed={notif.lesson}
                className={`w-11 h-6 rounded-full relative transition-colors ${notif.lesson ? 'bg-blue-600' : 'bg-gray-300'} ${notifLoading || notifSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={notifLoading || notifSaving}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notif.lesson ? 'translate-x-5' : ''}`} />
              </button>
            </label>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm text-[#1a1a1a]">출석 알림</span>
              <button
                onClick={() => setNotif((n) => ({ ...n, attendance: !n.attendance }))}
                aria-pressed={notif.attendance}
                className={`w-11 h-6 rounded-full relative transition-colors ${notif.attendance ? 'bg-blue-600' : 'bg-gray-300'} ${notifLoading || notifSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={notifLoading || notifSaving}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notif.attendance ? 'translate-x-5' : ''}`} />
              </button>
            </label>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm text-[#1a1a1a]">공지사항 알림</span>
              <button
                onClick={() => setNotif((n) => ({ ...n, notice: !n.notice }))}
                aria-pressed={notif.notice}
                className={`w-11 h-6 rounded-full relative transition-colors ${notif.notice ? 'bg-blue-600' : 'bg-gray-300'} ${notifLoading || notifSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={notifLoading || notifSaving}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notif.notice ? 'translate-x-5' : ''}`} />
              </button>
            </label>
            <button
              onClick={async () => {
                setNotifError(null)
                setNotifSaving(true)
                try {
                  await persistNotificationPrefs(notif)
                  alert('알림 설정이 저장되었습니다.')
                } catch (error) {
                  console.error('알림 설정 저장 실패:', error)
                  setNotifError('알림 설정을 저장하는 중 문제가 발생했습니다.')
                } finally {
                  setNotifSaving(false)
                }
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={notifLoading || notifSaving}
            >
              {notifSaving ? '저장 중...' : '알림 설정 저장'}
            </button>
          </div>
        </div>

        {/* 보안 설정 카드 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            보안 설정
          </h2>
          
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full py-3 border border-[#f0ebe1] rounded-lg text-sm font-medium text-gray-900 hover:bg-[#f5f1e8] transition-colors text-left px-4 flex items-center justify-between"
          >
            <span>비밀번호 변경</span>
            <svg className="w-5 h-5 text-[#7a6f61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 관리자 설정 카드 */}
        {isAdmin && (
          <div className="bg-white border border-[#f0ebe1] rounded-xl p-5 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              관리자 설정
            </h2>
            
            <button
              onClick={() => setShowAdminSettingsModal(true)}
              className="w-full py-3 border border-blue-600 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors text-left px-4 flex items-center justify-between"
            >
              <span>관리자 설정</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex-1 py-3 text-white text-sm font-medium rounded-lg transition-colors ${
              hasChanges 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            저장
          </button>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              비밀번호 변경
            </h3>
            
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="현재 비밀번호 입력"
                />
              </div>
              
              <div>
                <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="새 비밀번호 입력 (6자 이상)"
                />
              </div>
              
              <div>
                <label className="block text-xs text-[#7a6f61] mb-1.5 font-medium">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="새 비밀번호 재입력"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordForm({ current: '', new: '', confirm: '' })
                }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 설정 모달 */}
      {showAdminSettingsModal && (
        <AdminSettingsModal
          onClose={async () => {
            setShowAdminSettingsModal(false)
            // 모달 닫을 때 프로필 새로고침 (권한 변경 후 반영)
            console.log('🔄 관리자 설정 모달 닫힘 - 프로필 새로고침')
            await refreshProfile()
            // 약간의 지연 후 프로필 로드 (refreshProfile 완료 대기)
            setTimeout(() => {
              loadProfile()
              
              // 권한에 맞는 기본 페이지로 리다이렉트 (필요시)
              const currentRole = auth.profile?.role || authProfile?.role || profile?.role
              if (currentRole) {
                const roleRoutes = {
                  admin: '/admin/schedule',
                  instructor: '/instructor/schedule',
                  member: '/member/schedule',
                  guest: '/member/schedule',
                }
                const targetRoute = roleRoutes[currentRole] || '/member/schedule'
                const currentPath = window.location.pathname
                
                // 현재 경로가 변경된 권한의 경로가 아니면 리다이렉트
                if (!currentPath.startsWith(`/${currentRole}/`) && !currentPath.startsWith('/profile')) {
                  console.log('🔄 권한 변경 감지 - 리다이렉트:', targetRoute)
                  window.location.href = targetRoute
                }
              }
            }, 300)
          }}
          onRoleChange={async () => {
            // 권한 변경 후 프로필 새로고침
            console.log('🔄 권한 변경 감지 - 프로필 새로고침')
            await refreshProfile()
            setTimeout(() => {
              loadProfile()
            }, 200)
          }}
        />
      )}
    </div>
  )
}
