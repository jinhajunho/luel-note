'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ==================== 타입 정의 ====================
type UserProfile = {
  name: string
  phone: string
  email: string
  role: 'member' | 'instructor' | 'admin'
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
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadProfile()
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

  // 프로필 로드
  const loadProfile = async () => {
    // TODO: Supabase에서 데이터 가져오기
    const mockProfile: UserProfile = {
      name: '홍길동',
      phone: '010-1234-5678',
      email: 'hong@example.com',
      role: 'member'
    }
    setProfile(mockProfile)
    setForm({
      name: mockProfile.name,
      phone: mockProfile.phone,
      email: mockProfile.email
    })
  }

  // 프로필 저장
  const handleSave = async () => {
    if (!hasChanges) {
      alert('변경된 내용이 없습니다')
      return
    }

    // TODO: Supabase 업데이트
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
    
    // TODO: Supabase 비밀번호 변경
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
              <div className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium ${
                profile.role === 'admin' ? 'bg-red-50 text-red-600' :
                profile.role === 'instructor' ? 'bg-blue-50 text-blue-600' :
                'bg-green-50 text-green-600'
              }`}>
                {profile.role === 'admin' ? '관리자' :
                 profile.role === 'instructor' ? '강사' : '회원'}
              </div>
            </div>
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
    </div>
  )
}
