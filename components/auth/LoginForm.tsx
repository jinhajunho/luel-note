'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null)
  const [phoneDisplay, setPhoneDisplay] = useState('')

  // 전화번호 입력 시 자동 하이픈 추가
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '') // 숫자만 추출
    
    // 하이픈 자동 추가 (화면 표시용)
    if (value.length <= 3) {
      setPhoneDisplay(value)
    } else if (value.length <= 7) {
      setPhoneDisplay(value.slice(0, 3) + '-' + value.slice(3))
    } else {
      setPhoneDisplay(value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11))
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* 에러 메시지 */}
      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {/* 전화번호 */}
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
          전화번호
        </label>
        <input
          type="text"
          id="phone-display"
          value={phoneDisplay}
          onChange={handlePhoneChange}
          placeholder="010-1234-5678"
          maxLength={13}
          disabled={isPending}
          className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {/* Hidden input: 숫자만 전송 */}
        <input
          type="hidden"
          name="phone"
          value={phoneDisplay.replace(/\D/g, '')}
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
          name="password"
          placeholder="비밀번호를 입력하세요"
          required
          disabled={isPending}
          className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* 로그인 버튼 */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}
