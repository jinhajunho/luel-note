'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import ProtectedRoute from '@/components/ProtectedRoute'

type Instructor = {
  phone: string
  name: string
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requireMenu="settings">
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const { profile, refreshProfile } = useAuth()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // 강사 관련 상태
  const [allInstructors, setAllInstructors] = useState<Instructor[]>([])
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([])
  const [loadingInstructors, setLoadingInstructors] = useState(false)

  const isMember = profile?.role === 'member'

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setBirthDate(profile.birth_date || '')
      if (profile.gender === 'male' || profile.gender === 'female') {
        setGender(profile.gender)
      } else {
        setGender('')
      }
    }

    // 회원인 경우 강사 목록 로드
    if (isMember) {
      loadInstructors()
      loadMyInstructors()
    }
  }, [profile, isMember])

  // 전체 강사 목록 로드
  const loadInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone, name')
        .in('role', ['instructor', 'admin'])
        .order('name')

      if (error) throw error
      setAllInstructors(data || [])
    } catch (error) {
      console.error('강사 목록 로드 오류:', error)
    }
  }

  // 내 담당 강사 로드
  const loadMyInstructors = async () => {
    if (!profile?.phone) return

    try {
      const { data, error } = await supabase
        .from('instructor_members')
        .select('instructor_id')
        .eq('member_id', profile.phone)

      if (error) throw error
      setSelectedInstructors(data?.map(d => d.instructor_id) || [])
    } catch (error) {
      console.error('담당 강사 로드 오류:', error)
    }
  }

  const handleUpdateProfile = async () => {
    if (!profile) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          birth_date: birthDate || null,
          gender: gender || null
        })
        .eq('phone', profile.phone)

      if (error) throw error

      await refreshProfile()
      alert('프로필이 업데이트되었습니다!')
    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
      alert('프로필 업데이트에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('새 비밀번호를 입력해주세요.')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }

    if (newPassword.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      alert('비밀번호가 변경되었습니다!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      alert('비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 담당 강사 토글
  const handleToggleInstructor = (instructorPhone: string) => {
    setSelectedInstructors(prev => {
      if (prev.includes(instructorPhone)) {
        return prev.filter(p => p !== instructorPhone)
      } else {
        return [...prev, instructorPhone]
      }
    })
  }

  // 담당 강사 저장
  const handleSaveInstructors = async () => {
    if (!profile?.phone) return

    setLoadingInstructors(true)
    try {
      // 1. 기존 관계 모두 삭제
      const { error: deleteError } = await supabase
        .from('instructor_members')
        .delete()
        .eq('member_id', profile.phone)

      if (deleteError) throw deleteError

      // 2. 새로운 관계 추가
      if (selectedInstructors.length > 0) {
        const insertData = selectedInstructors.map(instructorPhone => ({
          instructor_id: instructorPhone,
          member_id: profile.phone
        }))

        const { error: insertError } = await supabase
          .from('instructor_members')
          .insert(insertData)

        if (insertError) throw insertError
      }

      alert('담당 강사가 저장되었습니다!')
    } catch (error) {
      console.error('담당 강사 저장 오류:', error)
      alert('담당 강사 저장에 실패했습니다.')
    } finally {
      setLoadingInstructors(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">프로필 설정</h2>
        <p className="text-sm text-gray-500 mt-1">
          개인 정보를 수정할 수 있습니다
        </p>
      </div>

      {/* 프로필 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">기본 정보</h3>

        <div className="space-y-4">
          {/* 전화번호 (변경 불가) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호 (변경 불가)
            </label>
            <input
              type="text"
              value={profile.phone}
              disabled
              className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-lg cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              전화번호는 변경할 수 없습니다
            </p>
          </div>

          {/* 역할 (표시만) */}
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
              className="w-full px-4 py-2 bg-gray-100 text-gray-500 border border-gray-300 rounded-lg cursor-not-allowed"
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
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={(e) => setGender('male')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">남성</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={(e) => setGender('female')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">여성</span>
              </label>
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleUpdateProfile}
            disabled={loading || !name}
            className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '프로필 저장'}
          </button>
        </div>
      </div>

      {/* 담당 강사 선택 (회원만) */}
      {isMember && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">담당 강사</h3>
          <p className="text-sm text-gray-500 mb-6">
            수업을 진행할 강사를 선택하세요 (여러 명 가능)
          </p>

          <div className="space-y-3 mb-4">
            {allInstructors.length === 0 ? (
              <p className="text-sm text-gray-500">등록된 강사가 없습니다.</p>
            ) : (
              allInstructors.map((instructor) => (
                <label
                  key={instructor.phone}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedInstructors.includes(instructor.phone)}
                    onChange={() => handleToggleInstructor(instructor.phone)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {instructor.name}
                  </span>
                </label>
              ))
            )}
          </div>

          <button
            onClick={handleSaveInstructors}
            disabled={loadingInstructors}
            className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loadingInstructors ? '저장 중...' : '담당 강사 저장'}
          </button>
        </div>
      )}

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
          <button
            onClick={handleChangePassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full px-6 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      </div>
    </div>
  )
}
