'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, undefined)
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
    <form action={formAction} className="space-y-4">
      {/* 에러 메시지 */}
      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {/* 성공 메시지 */}
      {state?.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">
            회원가입이 완료되었습니다! 관리자 승인 후 로그인해주세요.
          </p>
        </div>
      )}

      {/* 전화번호 */}
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
          전화번호 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="phone-display"
          value={phoneDisplay}
          onChange={handlePhoneChange}
          placeholder="010-1234-5678"
          maxLength={13}
          required
          disabled={isPending}
          className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50"
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

      {/* 이름 */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="홍길동"
          required
          disabled={isPending}
          className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50"
        />
      </div>

      {/* 생년월일 */}
      <div>
        <label htmlFor="birth_date" className="block text-sm font-semibold text-gray-700 mb-2">
          생년월일
        </label>
        <input
          type="date"
          id="birth_date"
          name="birth_date"
          disabled={isPending}
          className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50"
        />
      </div>

      {/* 성별 */}
      <div>
        <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
          성별
        </label>
        <select
          id="gender"
          name="gender"
          disabled={isPending}
          className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50"
        >
          <option value="">선택 안 함</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
        </select>
      </div>

      {/* 비밀번호 */}
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
          비밀번호 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="비밀번호 (6자 이상)"
          required
          disabled={isPending}
          className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50"
        />
      </div>

      {/* 비밀번호 확인 */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
          비밀번호 확인 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="비밀번호 확인"
          required
          disabled={isPending}
          className="w-full px-4 py-3 border border-[#f0ebe1] bg-[#fdfbf7] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7EA1B3] focus:ring-2 focus:ring-[#7EA1B3]/20 transition-all disabled:opacity-50"
        />
      </div>

      {/* 회원가입 버튼 */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? '가입 중...' : '회원가입'}
      </button>
    </form>
  )
}
