'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils/date'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { usePermissions } from '@/hooks/usePermissions'

type Session = {
  id: string
  date: string
  time: string
  type: string
  instructor: string
  instructorName: string
  room: string
  capacity: number
  enrolled: number
  status: 'scheduled' | 'completed' | 'cancelled'
  members: Array<{
    id: string
    name: string
    attended: boolean
  }>
}

function SessionsListContent() {
  const { can, profile, isAdmin, isInstructor } = usePermissions()
  const [sessions, setSessions] = useState<Session[]>([])
  const [filterType, setFilterType] = useState<'all' | string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 오늘부터 1주일 기본값
    const today = new Date()
    const oneWeekLater = new Date(today)
    oneWeekLater.setDate(today.getDate() + 7)
    
    setStartDate(formatDate(today))
    setEndDate(formatDate(oneWeekLater))
  }, [])

  useEffect(() => {
    if (profile && startDate && endDate) {
      loadSessions()
    }
  }, [profile, startDate, endDate])

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

  const loadSessions = async () => {
    try {
      setLoading(true)
      const accessToken = getAccessToken()
      
      if (!accessToken) {
        console.error('인증 토큰 없음')
        return
      }

      console.log('🔵 수업 목록 조회 시작...')
      console.log('날짜 범위:', startDate, '~', endDate)

      // classes 조회 (날짜 범위)
      let classesUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/classes?class_date=gte.${startDate}&class_date=lte.${endDate}&select=*&order=class_date.asc,class_time.asc`
      
      // role에 따라 필터링
      if (isInstructor) {
        classesUrl += `&instructor_id=eq.${profile?.phone}`
      }

      const classesResponse = await fetch(classesUrl, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const classesData = await classesResponse.json()
      console.log('✅ 수업 데이터:', classesData)

      // 각 수업에 대해 추가 정보 조회
      const sessionsWithDetails = await Promise.all(
        classesData.map(async (cls: any) => {
          // 강사 이름 조회
          const instructorResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/members?id=eq.${cls.instructor_id}&select=name`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${accessToken}`
              }
            }
          )
          const instructorData = await instructorResponse.json()
          const instructorName = instructorData[0]?.name || cls.instructor_id

          // 회원 이름 조회
          const memberResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/members?id=eq.${cls.member_id}&select=name`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${accessToken}`
              }
            }
          )
          const memberData = await memberResponse.json()
          const memberName = memberData[0]?.name || cls.member_id

          // 출석 정보 조회
          const attendanceResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/attendances?class_id=eq.${cls.id}&member_id=eq.${cls.member_id}&select=status`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${accessToken}`
              }
            }
          )
          const attendanceData = await attendanceResponse.json()
          const attended = attendanceData.length > 0 && attendanceData[0].status === 'present'

          return {
            id: cls.id,
            date: cls.class_date,
            time: cls.class_time || '',
            type: '수업', // TODO: class_types 조인
            instructor: cls.instructor_id,
            instructorName: instructorName,
            room: '룸', // TODO: 룸 정보
            capacity: 1, // TODO: class_types에서 capacity
            enrolled: 1,
            status: cls.status,
            members: [
              {
                id: cls.member_id,
                name: memberName,
                attended: attended
              }
            ]
          }
        })
      )

      console.log('✅ 상세 정보 포함:', sessionsWithDetails)
      setSessions(sessionsWithDetails)

    } catch (error) {
      console.error('❌ 수업 로드 오류:', error)
      alert('수업 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesType = filterType === 'all' || session.type === filterType
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus
    return matchesType && matchesStatus
  })

  const statusText = {
    scheduled: '예정',
    completed: '완료',
    cancelled: '취소'
  }

  const statusColor = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            수업 목록
            {isInstructor && <span className="ml-2 text-sm text-gray-500">(내 수업)</span>}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            전체 {filteredSessions.length}개 수업
          </p>
        </div>

        {can.createClass && (
          <Link
            href="/sessions/create"
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 수업 생성
          </Link>
        )}
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="space-y-4">
          {/* 날짜 필터 */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button 
              onClick={loadSessions}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              조회
            </button>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'scheduled', 'completed', 'cancelled'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`
                    px-4 py-2 text-sm font-bold rounded-lg transition-colors
                    ${filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {status === 'all' ? '전체' : statusText[status]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 수업 목록 */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            조회된 수업이 없습니다
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isFull = session.enrolled >= session.capacity
            const isCompleted = session.status === 'completed'
            const isCancelled = session.status === 'cancelled'

            return (
              <div 
                key={session.id}
                className={`
                  bg-white rounded-xl border-2 p-6 transition-all
                  ${isCancelled 
                    ? 'border-red-200 bg-red-50' 
                    : isCompleted
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:shadow-md'
                  }
                `}
              >
                {/* 수업 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {session.date} {session.time}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                          {session.type}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColor[session.status]}`}>
                          {statusText[session.status]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {session.instructorName}
                    </div>
                    <div className={`
                      text-sm font-bold mt-1
                      ${isFull ? 'text-green-600' : 'text-gray-600'}
                    `}>
                      {session.enrolled}/{session.capacity}명
                    </div>
                  </div>
                </div>

                {/* 회원 목록 */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">참여 회원</div>
                  <div className="flex flex-wrap gap-2">
                    {session.members.map((member) => (
                      <span 
                        key={member.id}
                        className={`
                          px-3 py-1 text-sm rounded-lg border
                          ${member.attended
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        `}
                      >
                        {member.name}
                        {member.attended && ' ✓'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <Link
                    href={`/sessions/${session.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    상세 보기
                  </Link>
                  {can.updateClass && session.status === 'scheduled' && (
                    <>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                        수정
                      </button>
                      <button className="px-4 py-2 bg-red-50 text-red-700 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors">
                        취소
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function SessionsListPage() {
  return (
    <ProtectedRoute requireMenu="classes">
      <SessionsListContent />
    </ProtectedRoute>
  )
}