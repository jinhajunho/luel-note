'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import Loading from '@/components/common/Loading'
import Button from '@/components/common/Button'

export default function ProfilePage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // 프로필 정보
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  
  // 비밀번호 변경
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setBirthDate(profile.birthDate || '')
      setGender(profile.gender || '')
    }
  }, [profile])

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      
      // TODO: Supabase 업데이트
      await new Promise(resolve => setTimeout(resolve, 500))
      
      alert('프로필이 업데이트되었습니다.')
    } catch (error) {
      console.error('❌ 프로필 업데이트 오류:', error)
      alert('프로필 업데이트에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('비밀번호를 입력해주세요.')
      return
    }

    if (newPassword.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      setLoading(true)
      
      // TODO: Supabase 비밀번호 변경
      await new Promise(resolve => setTimeout(resolve, 500))
      
      alert('비밀번호가 변경되었습니다.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('❌ 비밀번호 변경 오류:', error)
      alert('비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return <Loading text="로딩 중..." />
  }

  return (
    <>
      <Header profile={profile} />
      
      <main className="pb-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* 페이지 제목 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">프로필 관리</h2>
            <p className="text-sm text-gray-500 mt-1">
              개인 정보를 관리하세요
            </p>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">기본 정보</h3>

            <div className="space-y-4">
              {/* 전화번호 (읽기 전용) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호 (변경 불가)
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              {/* 역할 (읽기 전용) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  역할
                </label>
                <input
                  type="text"
                  value={
                    profile.role === 'admin' ? '관리자' :
                    profile.role === 'instructor' ? '강사' : '회원'
                  }
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 생년월일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  생년월일
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 성별 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성별
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={(e) => setGender(e.target.value as 'male')}
                      className="mr-2"
                    />
                    남성
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={(e) => setGender(e.target.value as 'female')}
                      className="mr-2"
                    />
                    여성
                  </label>
                </div>
              </div>

              {/* 저장 버튼 */}
              <Button
                onClick={handleUpdateProfile}
                disabled={loading}
                fullWidth
              >
                {loading ? '저장 중...' : '프로필 저장'}
              </Button>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">비밀번호 변경</h3>

            <div className="space-y-4">
              {/* 새 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (6자 이상)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 확인"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 변경 버튼 */}
              <Button
                onClick={handleChangePassword}
                disabled={loading || !newPassword || !confirmPassword}
                variant="secondary"
                fullWidth
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation profile={profile} />
    </>
  )
}
