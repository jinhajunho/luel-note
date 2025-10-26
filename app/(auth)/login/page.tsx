import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
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

          {/* 로그인 폼 */}
          <LoginForm />

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

        {/* 비밀번호 안내 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-1">💡 비밀번호를 잊으셨나요?</p>
          <p className="text-sm text-blue-700">관리자에게 문의하시면 초기화해드립니다</p>
        </div>

        {/* 하단 안내 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            전화번호로 로그인하세요
          </p>
        </div>
      </div>
    </div>
  )
}
