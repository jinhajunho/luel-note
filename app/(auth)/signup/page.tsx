import Link from 'next/link'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center px-4 py-12">
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

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            회원가입
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            가입 후 관리자의 승인을 기다려주세요
          </p>

          <SignupForm />

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 회원가입 후 관리자가 권한을 설정하면 서비스를 이용할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
