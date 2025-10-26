'use client'

import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, undefined)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">
            회원가입이 완료되었습니다! 관리자 승인 후 로그인해주세요.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          전화번호 *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="01012345678"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          숫자만 입력하세요 (하이픈 없이)
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          이름 *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="홍길동"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
          생년월일
        </label>
        <input
          type="date"
          id="birth_date"
          name="birth_date"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
          성별
        </label>
        <select
          id="gender"
          name="gender"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">선택 안 함</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
        </select>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          비밀번호 *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="비밀번호 (6자 이상)"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          비밀번호 확인 *
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="비밀번호 확인"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isPending ? '가입 중...' : '회원가입'}
      </button>
    </form>
  )
}
