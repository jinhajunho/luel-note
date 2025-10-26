'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 전화번호 입력 시 자동 하이픈 추가
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '') // 숫자만 추출
    
    // 하이픈 자동 추가
    if (value.length <= 3) {
      setPhone(value)
    } else if (value.length <= 7) {
      setPhone(value.slice(0, 3) + '-' + value.slice(3))
    } else {
      setPhone(value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 하이픈 제거
      const phoneOnly = phone.replace(/\D/g, '')
      
      // 유효성 검사
      if (!/^\d{10,11}$/.test(phoneOnly)) {
        setError('올바른 전화번호를 입력하세요')
        setLoading(false)
        return
      }

      const result = await login(phoneOnly, password)
      
      if (result.success) {
        // 로그인 성공 - 리다이렉트는 middleware가 처리
        router.push('/')
        router.refresh()
      } else {
        setError(result.error || '로그인에 실패했습니다')
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다')
      console.error('로그인 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Luel Note
          </h1>
          <p className="text-gray-600">
            필라테스 & 요가 스튜디오 관리 시스템
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#f0ebe1] p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            로그인
          </h2>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 전화번호 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                전화번호
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                maxLength={13}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                자동으로 하이픈이 추가됩니다
              </p>
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* 비밀번호 찾기 안내 */}
            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-medium text-blue-900 mb-1">💡 비밀번호를 잊으셨나요?</p>
              <p className="text-blue-700">관리자에게 문의하시면 초기화해드립니다</p>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              아직 계정이 없으신가요?{' '}
              <Link 
                href="/signup" 
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            전화번호로 로그인하세요
          </p>
        </div>
      </div>
    </div>
  )
}
