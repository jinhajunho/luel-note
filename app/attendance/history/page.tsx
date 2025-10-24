'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils/date'

type SessionRecord = {
  id: string
  date: string
  time: string
  type: '인트로' | '개인수업' | '듀엣수업' | '그룹수업'
  instructor: string
  members: Array<{
    id: string
    name: string
    attended: boolean
    memo: string
  }>
}

type Stats = {
  total: number
  intro: number
  personal: number
  duet: number
  group: number
}

export default function AttendanceHistoryPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    intro: 0,
    personal: 0,
    duet: 0,
    group: 0
  })
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent')

  useEffect(() => {
    // 오늘 날짜 기본값
    const today = new Date()
    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(today.getDate() - 7)
    
    setStartDate(formatDate(oneWeekAgo))
    setEndDate(formatDate(today))

    loadData()
  }, [])

  const loadData = () => {
    // 임시 목업 데이터
    const mockSessions: SessionRecord[] = [
      {
        id: '1',
        date: '2025-01-19',
        time: '오전 10:00',
        type: '개인수업',
        instructor: '김코치',
        members: [
          { id: '1', name: '홍길동', attended: true, memo: '' }
        ]
      },
      {
        id: '2',
        date: '2025-01-19',
        time: '오후 02:00',
        type: '듀엣수업',
        instructor: '이코치',
        members: [
          { id: '2', name: '박민정', attended: true, memo: '잘했음' },
          { id: '3', name: '이현우', attended: false, memo: '개인 사정' }
        ]
      },
      {
        id: '3',
        date: '2025-01-18',
        time: '오전 09:00',
        type: '인트로',
        instructor: '박코치',
        members: [
          { id: '4', name: '김지은', attended: true, memo: '' },
          { id: '5', name: '박상훈', attended: true, memo: '' }
        ]
      },
      {
        id: '4',
        date: '2025-01-18',
        time: '오후 05:00',
        type: '그룹수업',
        instructor: '최코치',
        members: [
          { id: '6', name: '박지훈', attended: true, memo: '' },
          { id: '7', name: '서지현', attended: true, memo: '' },
          { id: '8', name: '이도윤', attended: false, memo: '무단 결석' },
          { id: '9', name: '최유리', attended: true, memo: '' }
        ]
      },
      {
        id: '5',
        date: '2025-01-17',
        time: '오후 03:00',
        type: '개인수업',
        instructor: '김코치',
        members: [
          { id: '10', name: '정수민', attended: true, memo: '진도 빠름' }
        ]
      }
    ]

    setSessions(mockSessions)

    // 통계 계산
    const newStats: Stats = {
      total: mockSessions.length,
      intro: mockSessions.filter(s => s.type === '인트로').length,
      personal: mockSessions.filter(s => s.type === '개인수업').length,
      duet: mockSessions.filter(s => s.type === '듀엣수업').length,
      group: mockSessions.filter(s => s.type === '그룹수업').length
    }
    setStats(newStats)
  }

  const handleSearch = () => {
    loadData()
    alert(`${startDate} ~ ${endDate} 조회`)
  }

  const handleAttendanceToggle = (sessionId: string, memberId: string) => {
    setSessions(sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          members: session.members.map(member => {
            if (member.id === memberId) {
              return { ...member, attended: !member.attended }
            }
            return member
          })
        }
      }
      return session
    }))
  }

  const handleMemoChange = (sessionId: string, memberId: string, memo: string) => {
    setSessions(sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          members: session.members.map(member => {
            if (member.id === memberId) {
              return { ...member, memo }
            }
            return member
          })
        }
      }
      return session
    }))
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`)
    const dateB = new Date(`${b.date} ${b.time}`)
    return sortOrder === 'recent' 
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">출석 기록</h2>
        <p className="text-sm text-gray-500 mt-1">
          수업별 출석 현황을 확인하고 관리하세요
        </p>
      </div>

      {/* 검색 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              시작 날짜
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              종료 날짜
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              조회
            </button>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">전체</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">인트로</div>
          <div className="text-2xl font-bold text-blue-600">{stats.intro}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">개인수업</div>
          <div className="text-2xl font-bold text-green-600">{stats.personal}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">듀엣수업</div>
          <div className="text-2xl font-bold text-purple-600">{stats.duet}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">그룹수업</div>
          <div className="text-2xl font-bold text-orange-600">{stats.group}</div>
        </div>
      </div>

      {/* 정렬 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={() => setSortOrder(sortOrder === 'recent' ? 'oldest' : 'recent')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {sortOrder === 'recent' ? '최신순' : '오래된순'}
        </button>
      </div>

      {/* 수업 목록 */}
      <div className="space-y-4">
        {sortedSessions.map(session => (
          <div key={session.id} className="bg-white rounded-xl border border-gray-200 p-6">
            {/* 수업 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`
                  px-3 py-1 rounded-full text-sm font-bold
                  ${session.type === '인트로' && 'bg-blue-100 text-blue-700'}
                  ${session.type === '개인수업' && 'bg-green-100 text-green-700'}
                  ${session.type === '듀엣수업' && 'bg-purple-100 text-purple-700'}
                  ${session.type === '그룹수업' && 'bg-orange-100 text-orange-700'}
                `}>
                  {session.type}
                </span>
                <span className="text-sm text-gray-500">{session.date}</span>
                <span className="text-sm text-gray-500">{session.time}</span>
                <span className="text-sm font-medium text-gray-700">{session.instructor}</span>
              </div>
            </div>

            {/* 회원 목록 */}
            <div className="space-y-3">
              {session.members.map(member => (
                <div key={member.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => handleAttendanceToggle(session.id, member.id)}
                    className={`
                      flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all
                      ${member.attended
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300 hover:border-green-500'
                      }
                    `}
                  >
                    {member.attended && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="font-bold text-gray-900 mb-2">{member.name}</div>
                    <input
                      type="text"
                      value={member.memo}
                      onChange={(e) => handleMemoChange(session.id, member.id, e.target.value)}
                      placeholder="메모 입력..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
