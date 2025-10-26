'use client'

import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })

      if (response.ok) {
        router.push('/login')
      }
    } catch (error) {
      console.error('로그아웃 실패:', error)
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
        </div>

        {/* 승인 대기 메시지 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⏳</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            승인 대기 중
          </h2>

          <p className="text-gray-600 mb-6">
            회원가입이 완료되었습니다.<br />
            관리자가 권한을 설정하면 서비스를 이용할 수 있습니다.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 스튜디오에 방문하여 관리자에게 승인을 요청해주세요.<br />
              승인 후 다시 로그인하시면 정상적으로 이용하실 수 있습니다.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
