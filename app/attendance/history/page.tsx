'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils/date'

type SessionRecord = {
  id: string
  date: string
  time: string
  type: '인트로' | '개인수업' | '듀엣수업' | '그룹수업'
  instructor: string
  room: string
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
        room: 'A룸',
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
        room: 'B룸',
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
        room: 'C룸',
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
        room: 'A룸',
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
        room: 'B룸',
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
    if (sortOrder === 'recent') {
      return new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
    } else {
      return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
    }
  })

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">출석 히스토리</h2>
        <p className="text-sm text-gray-500 mt-1">
          수업별 출석 기록 조회 및 수정
        </p>
      </div>

      {/* 날짜 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
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
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            조회
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">총 수업</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">인트로</div>
          <div className="text-2xl font-bold text-purple-600">{stats.intro}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">개인수업</div>
          <div className="text-2xl font-bold text-blue-600">{stats.personal}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">듀엣수업</div>
          <div className="text-2xl font-bold text-green-600">{stats.duet}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">그룹수업</div>
          <div className="text-2xl font-bold text-orange-600">{stats.group}</div>
        </div>
      </div>

      {/* 정렬 */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">
          수업 기록 ({sessions.length}건)
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSortOrder('recent')}
            className={`
              px-3 py-1 text-sm font-medium rounded-lg transition-colors
              ${sortOrder === 'recent'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            최근순
          </button>
          <button
            onClick={() => setSortOrder('oldest')}
            className={`
              px-3 py-1 text-sm font-medium rounded-lg transition-colors
              ${sortOrder === 'oldest'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            오래된순
          </button>
        </div>
      </div>

      {/* 수업 카드 목록 */}
      <div className="space-y-4">
        {sortedSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            조회된 수업이 없습니다
          </div>
        ) : (
          sortedSessions.map((session) => (
            <div 
              key={session.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              {/* 수업 헤더 */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-gray-900">
                    {session.date} {session.time}
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                    {session.type}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {session.instructor} · {session.room}
                </div>
              </div>

              {/* 회원 출석 */}
              <div className="space-y-3">
                {session.members.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    {/* 출석 체크박스 */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.attended}
                        onChange={() => handleAttendanceToggle(session.id, member.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {member.name}
                      </span>
                    </label>

                    {/* 상태 뱃지 */}
                    <span className={`
                      px-2 py-1 text-xs font-bold rounded-full
                      ${member.attended
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                      }
                    `}>
                      {member.attended ? '출석' : '결석'}
                    </span>

                    {/* 메모 입력 */}
                    <input
                      type="text"
                      value={member.memo}
                      onChange={(e) => handleMemoChange(session.id, member.id, e.target.value)}
                      placeholder="메모 (선택)"
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}