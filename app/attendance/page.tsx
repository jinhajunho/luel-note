'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils/date'
import ProtectedRoute from '@/components/ProtectedRoute'
import { usePermissions } from '@/hooks/usePermissions'

type Session = {
  id: string
  time: string
  type: string
  instructor: string
  room: string
  capacity: number
  enrolled: number
  members: Array<{
    id: string
    name: string
    attended: boolean
  }>
}

type RecentAttendance = {
  id: string
  date: string
  instructor: string
  type: string
  status: '출석' | '결석'
}

function AttendanceCheckContent() {
  const { profile, isAdmin, isInstructor, isMember } = usePermissions()
  const [todaySessions, setTodaySessions] = useState<Session[]>([])
  const [recentAttendances, setRecentAttendances] = useState<RecentAttendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadData()
    }
  }, [profile])

  const getAccessToken = () => {
    const cookies = document.cookie.split('; ')
    
    // 동적으로 프로젝트 ID 추출
    const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
    const authCookie = cookies.find(c => c.startsWith(`sb-${projectId}-auth-token=`))
    
    if (!authCookie) return null

    let cookieValue = decodeURIComponent(authCookie.split('=')[1])
    if (cookieValue.startsWith('base64-')) {
      cookieValue = atob(cookieValue.substring(7))
    }
    
    const sessionData = JSON.parse(cookieValue)
    return sessionData.access_token
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const accessToken = getAccessToken()
      
      if (!accessToken) {
        console.error('인증 토큰 없음')
        return
      }

      console.log('🔵 출석 데이터 조회 시작...')

      // 오늘 날짜
      const today = formatDate(new Date())

      // 1. 오늘 수업 조회
      let classesUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/classes?class_date=eq.${today}&select=*&order=class_time.asc`
      
      // role에 따라 필터링
      if (isInstructor) {
        classesUrl += `&instructor_id=eq.${profile?.phone}`
      } else if (isMember) {
        classesUrl += `&member_id=eq.${profile?.phone}`
      }

      const classesResponse = await fetch(classesUrl, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const classesData = await classesResponse.json()
      console.log('✅ 오늘 수업:', classesData)

      // TODO: class_types와 조인해서 타입 이름 가져오기
      // TODO: 참여 회원 정보 가져오기
      const formattedSessions: Session[] = classesData.map((c: any) => ({
        id: c.id,
        time: c.class_time || '',
        type: '수업', // TODO: class_types 조인
        instructor: c.instructor_id || '',
        room: '룸', // TODO: 룸 정보 추가 필요
        capacity: 1, // TODO: class_types에서 capacity 가져오기
        enrolled: 1,
        members: []
      }))

      setTodaySessions(formattedSessions)

      // 2. 최근 출석 기록 조회
      let attendanceUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/attendances?select=*&order=created_at.desc&limit=10`
      
      if (isMember) {
        attendanceUrl += `&member_id=eq.${profile?.phone}`
      }

      const attendanceResponse = await fetch(attendanceUrl, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const attendanceData = await attendanceResponse.json()
      console.log('✅ 최근 출석:', attendanceData)

      const formattedAttendances: RecentAttendance[] = attendanceData.map((a: any) => ({
        id: a.id,
        date: formatDate(new Date(a.created_at)),
        instructor: '', // TODO: classes 조인해서 instructor 가져오기
        type: '수업', // TODO: class_types 조인
        status: a.status === 'present' ? '출석' : '결석'
      }))

      setRecentAttendances(formattedAttendances)

    } catch (error) {
      console.error('❌ 데이터 로드 오류:', error)
      alert('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (sessionId: string) => {
    try {
      const accessToken = getAccessToken()
      
      if (!accessToken || !profile) {
        alert('인증 정보가 없습니다.')
        return
      }

      console.log('🔵 출석 체크 시작:', sessionId)

      // attendances 테이블에 INSERT
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/attendances`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            class_id: sessionId,
            member_id: profile.phone,
            status: 'present'
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ 출석 체크 실패:', error)
        throw new Error('출석 체크 실패')
      }

      console.log('✅ 출석 체크 성공')
      alert('출석이 완료되었습니다!')
      
      // 데이터 다시 로드
      await loadData()

    } catch (error) {
      console.error('❌ 출석 체크 오류:', error)
      alert('출석 체크에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          출석 체크
          {isMember && <span className="ml-2 text-sm text-gray-500">(내 수업)</span>}
          {isInstructor && <span className="ml-2 text-sm text-gray-500">(내 강의)</span>}
          {isAdmin && <span className="ml-2 text-sm text-gray-500">(전체)</span>}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {formatDate(new Date())}
        </p>
      </div>

      {/* 오늘 수업 */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          오늘의 수업
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todaySessions.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              오늘 예정된 수업이 없습니다
            </div>
          ) : (
            todaySessions.map((session) => (
              <div 
                key={session.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* 시간 */}
                <div className="text-lg font-bold text-gray-900 mb-3">
                  {session.time}
                </div>

                {/* 수업 정보 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">강사</span>
                    <span className="text-sm font-medium text-gray-900">
                      {session.instructor}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">타입</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-200">
                      {session.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">정원</span>
                    <span className={`
                      text-sm font-bold
                      ${session.enrolled >= session.capacity 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                      }
                    `}>
                      {session.enrolled}/{session.capacity}
                    </span>
                  </div>
                </div>

                {/* 출석 체크 버튼 */}
                <button
                  onClick={() => handleCheckIn(session.id)}
                  className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  출석 체크
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 최근 출석 */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          최근 출석 기록
        </h3>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {recentAttendances.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                출석 기록이 없습니다
              </div>
            ) : (
              recentAttendances.map((attendance) => (
                <div 
                  key={attendance.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500 w-24">
                      {attendance.date}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {attendance.instructor || '수업'}
                    </div>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-200">
                      {attendance.type}
                    </span>
                  </div>
                  <span className={`
                    px-3 py-1 text-xs font-bold rounded-full
                    ${attendance.status === '출석'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                    }
                  `}>
                    {attendance.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AttendanceCheckPage() {
  return (
    <ProtectedRoute requireMenu="attendance">
      <AttendanceCheckContent />
    </ProtectedRoute>
  )
}