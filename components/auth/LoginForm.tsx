'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { formatPhone } from '@/lib/utils/phone'

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          전화번호
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="01012345678"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          비밀번호
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="비밀번호를 입력하세요"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}