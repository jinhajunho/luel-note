'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(signup, undefined)

  // 회원가입 성공 시 리다이렉트
  useEffect(() => {
    if (state?.success) {
      alert('회원가입이 완료되었습니다! 로그인 후 이용해주세요.')
      router.push('/login')
    }
  }, [state, router])

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
      backgroundColor: '#fdfbf7',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{ width: '100%', maxWidth: '450px' }}>
        {/* 로고 영역 */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {/* 왕관 아이콘 (200px) */}
          <svg style={{ width: '200px', height: '200px', margin: '0 auto' }} width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
            <path fill="rgb(155,205,232)" stroke="rgb(155,205,232)" strokeWidth="1" opacity="1" d="M 246.5 161 Q 254.8 159.7 257 164.5 L 258 170.5 L 253.5 176 L 247.5 177 L 242 172.5 Q 240.3 162.8 246.5 161 Z" />
            <path fill="rgb(155,205,232)" stroke="rgb(155,205,232)" strokeWidth="1" opacity="1" d="M 247.5 189 Q 255.1 187.9 257 192.5 L 261 214.5 Q 264 222 270.5 226 L 281.5 231 L 291.5 231 Q 304.1 227.1 311.5 218 L 317.5 218 L 322 223.5 L 323 235.5 L 326.5 240 Q 329.5 243 336.5 242 L 343.5 240 L 359.5 230 L 361.5 230 L 364 231 L 364 237.5 L 358.5 243 Q 343.7 254.2 325.5 262 L 315 271.5 L 313 277.5 L 315 282.5 L 325 295.5 Q 328.6 303.4 327 316.5 Q 322.7 335.7 309.5 346 Q 296.1 358.6 275.5 364 L 270.5 364 L 264.5 366 L 237.5 366 L 231.5 364 L 225.5 364 L 208.5 358 Q 195.9 352.1 187 342.5 Q 179 334.5 175 322.5 Q 171.7 315.3 173 303.5 L 175 296.5 L 185 282.5 L 187 275.5 L 186 272.5 L 178.5 265 L 149.5 249 L 136 237.5 Q 134.8 232.3 137.5 231 L 140.5 231 L 153.5 239 L 162.5 242 L 169.5 242 L 176 236.5 L 179 220 L 182.5 218 L 187.5 218 Q 194 226 204.5 230 L 215.5 231 Q 229.4 228.4 236 218.5 L 240 210.5 L 243 192 L 245 192 Q 243.9 189.3 246.5 190 L 247.5 189 Z M 246 243 L 238 247 Q 225 255 220 271 L 222 279 L 235 287 L 244 289 L 262 288 L 274 283 Q 279 281 280 275 Q 280 263 274 259 L 260 245 L 255 243 L 246 243 Z" />
            <path fill="rgb(201,227,237)" stroke="rgb(201,227,237)" strokeWidth="1" opacity="1" d="M 245.5 160 L 253.5 160 L 257 162 Q 259.6 164.3 259 170.5 L 254.5 177 L 246.5 178 L 242 174.5 L 240 167.5 L 245.5 160 Z M 247 161 Q 240 163 242 173 L 248 177 L 254 176 L 258 171 L 257 165 Q 255 160 247 161 Z" />
          </svg>
          
          {/* LUEL NOTE 텍스트 (32px, 간격 -40px) */}
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: 'rgb(155,205,232)', 
            margin: '-40px 0 4px',
            letterSpacing: '0.05em'
          }}>
            LUEL NOTE
          </h1>
          
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Pilates Studio Management System
          </p>
        </div>

        {/* 회원가입 카드 */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
          padding: '24px' 
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
            회원가입
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
            새로운 계정을 만들어보세요
          </p>

          {/* 에러 메시지 */}
          {state?.error && !state?.success && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '12px', 
              fontSize: '14px', 
              marginBottom: '16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              boxSizing: 'border-box'
            }}>
              {state.error}
            </div>
          )}

          {/* 성공 메시지 */}
          {state?.success && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '12px', 
              fontSize: '14px', 
              marginBottom: '16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              boxSizing: 'border-box'
            }}>
              회원가입이 완료되었습니다!
            </div>
          )}

          <form action={formAction}>
            {/* 전화번호 */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="phone" style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                전화번호
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="01012345678"
                maxLength={11}
                required
                disabled={isPending}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '1px solid #f0ebe1', 
                  background: '#fdfbf7', 
                  borderRadius: '12px', 
                  fontSize: '15px', 
                  color: '#111827',
                  opacity: isPending ? '0.5' : '1',
                  cursor: isPending ? 'not-allowed' : 'text',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                숫자만 입력하세요 (하이픈 제외)
              </p>
            </div>

            {/* 이름 */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="name" style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                이름
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="홍길동"
                required
                disabled={isPending}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '1px solid #f0ebe1', 
                  background: '#fdfbf7', 
                  borderRadius: '12px', 
                  fontSize: '15px', 
                  color: '#111827',
                  opacity: isPending ? '0.5' : '1',
                  cursor: isPending ? 'not-allowed' : 'text',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 비밀번호 */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="password" style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="6자 이상 입력하세요"
                required
                disabled={isPending}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '1px solid #f0ebe1', 
                  background: '#fdfbf7', 
                  borderRadius: '12px', 
                  fontSize: '15px', 
                  color: '#111827',
                  opacity: isPending ? '0.5' : '1',
                  cursor: isPending ? 'not-allowed' : 'text',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                최소 6자 이상 입력해주세요
              </p>
            </div>

            {/* 비밀번호 확인 */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="confirmPassword" style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="비밀번호를 다시 입력하세요"
                required
                disabled={isPending}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '1px solid #f0ebe1', 
                  background: '#fdfbf7', 
                  borderRadius: '12px', 
                  fontSize: '15px', 
                  color: '#111827',
                  opacity: isPending ? '0.5' : '1',
                  cursor: isPending ? 'not-allowed' : 'text',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={isPending}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: isPending ? '#9ca3af' : '#2563eb', 
                color: 'white', 
                fontSize: '15px', 
                fontWeight: '600', 
                border: 'none', 
                borderRadius: '12px', 
                cursor: isPending ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box'
              }}
            >
              {isPending ? '처리 중...' : '회원가입'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
            <p>
              이미 계정이 있으신가요?{' '}
              <Link 
                href="/login" 
                style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
