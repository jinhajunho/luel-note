'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils/date'
import ProtectedRoute from '@/components/ProtectedRoute'
import { usePermissions } from '@/hooks/usePermissions'

// 타입 정의
type Session = {
  id: string
  time: string
  type: '인트로' | '개인수업' | '듀엣수업' | '그룹수업'
  room: string
  instructor?: string
  members: Array<{
    name: string
    attended: boolean
  }>
}

// 캘린더 컴포넌트
function Calendar({ 
  value, 
  onChange 
}: { 
  value: Date
  onChange: (date: Date) => void 
}) {
  const year = value.getFullYear()
  const month = value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const days: (number | null)[] = []
  
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  const prevMonth = () => onChange(new Date(year, month - 1, 1))
  const nextMonth = () => onChange(new Date(year, month + 1, 1))
  const selectDate = (day: number) => onChange(new Date(year, month, day))
  
  const today = new Date()
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }
  
  const isSelected = (day: number) => {
    return (
      day === value.getDate() &&
      month === value.getMonth() &&
      year === value.getFullYear()
    )
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </button>
        <div className="font-bold text-gray-900">
          {year}년 {month + 1}월
        </div>
        <button 
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div 
            key={day}
            className={`
              text-center text-xs font-bold py-2
              ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}
            `}
          >
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <div key={idx} className="aspect-square">
            {day ? (
              <button
                onClick={() => selectDate(day)}
                className={`
                  w-full h-full rounded-lg text-sm font-medium transition-colors
                  ${isSelected(day) 
                    ? 'bg-blue-600 text-white' 
                    : isToday(day)
                    ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

// 강사 KPI
function InstructorKPI({ sessions }: { sessions: Session[] }) {
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => 
    s.members.every(m => m.attended)
  ).length
  const completionRate = totalSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100) 
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm text-gray-500 mb-2">오늘 수업 수</div>
        <div className="text-3xl font-bold text-gray-900">{totalSessions}</div>
        <div className="text-xs text-gray-400 mt-1">예정된 수업</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm text-gray-500 mb-2">오늘의 이수율</div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {completionRate}%
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          완료 {completedSessions} / 총 {totalSessions} 수업
        </div>
      </div>
    </div>
  )
}

// 회원 KPI
function MemberKPI() {
  const totalPasses = 30
  const usedPasses = 18
  const remainingPasses = totalPasses - usedPasses
  const progressRate = Math.round((usedPasses / totalPasses) * 100)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm text-gray-500 mb-2">잔여 회차</div>
        <div className="text-3xl font-bold text-gray-900">{remainingPasses}회</div>
        <div className="text-xs text-gray-400 mt-1">{totalPasses}회 중 {usedPasses}회 사용</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm text-gray-500 mb-2">진행률</div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressRate}%` }}
              />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {progressRate}%
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {usedPasses}/{totalPasses} 완료
        </div>
      </div>
    </div>
  )
}

// 강사 수업 목록
function InstructorSessionList({ selectedDate, sessions }: { selectedDate: Date, sessions: Session[] }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {formatDate(selectedDate)}의 수업
      </h3>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            선택한 날짜에 예정된 수업이 없습니다
          </div>
        ) : (
          sessions.map((session) => {
            const attendedCount = session.members.filter(m => m.attended).length
            const totalCount = session.members.length
            const isFull = attendedCount >= totalCount

            return (
              <div 
                key={session.id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-900">
                      {session.time}
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                      {session.type}
                    </span>
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                      {session.room}
                    </span>
                  </div>
                  <div className={`
                    px-3 py-1 text-xs font-bold rounded-full
                    ${isFull 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }
                  `}>
                    {attendedCount}/{totalCount}
                  </div>
                </div>

                <div className="space-y-2">
                  {session.members.map((member, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-sm text-gray-700">
                        {member.name}
                      </span>
                      <span className={`
                        px-2 py-1 text-xs font-bold rounded-full
                        ${member.attended 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                        }
                      `}>
                        {member.attended ? '출석' : '미출석'}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="w-full mt-4 px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  수업 완료
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// 회원 수업 목록
function MemberSessionList({ selectedDate, sessions }: { selectedDate: Date, sessions: Session[] }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {formatDate(selectedDate)}의 내 수업
      </h3>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            선택한 날짜에 예정된 수업이 없습니다
          </div>
        ) : (
          sessions.map((session) => {
            const attendedCount = session.members.filter(m => m.attended).length
            const totalCount = session.members.length

            return (
              <div 
                key={session.id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-900">
                      {session.time}
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                      {session.type}
                    </span>
                  </div>
                  <div className="px-3 py-1 text-xs font-bold rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                    {attendedCount}/{totalCount}
                  </div>
                </div>

                {session.instructor && (
                  <div className="mb-3 text-sm text-gray-600">
                    강사: {session.instructor}
                  </div>
                )}

                {session.members.length > 1 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-2">함께하는 회원</div>
                    <div className="flex flex-wrap gap-2">
                      {session.members.map((member, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-200"
                        >
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="w-full mt-4 px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                  출석하기
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// 대시보드 컨텐츠
function DashboardContent() {
  const { isMember } = usePermissions()
  const [viewMode, setViewMode] = useState<'instructor' | 'member'>(isMember ? 'member' : 'instructor')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    const mockSessions: Session[] = [
      {
        id: '0',
        time: '오전 09:00',
        type: '인트로',
        room: 'A룸',
        instructor: '김코치',
        members: [
          { name: '김지은', attended: false },
          { name: '박상훈', attended: false }
        ]
      },
      {
        id: '1',
        time: '오전 10:00',
        type: '개인수업',
        room: 'A룸',
        instructor: '이코치',
        members: [{ name: '홍길동', attended: true }]
      },
      {
        id: '2',
        time: '오후 02:00',
        type: '듀엣수업',
        room: 'B룸',
        instructor: '박코치',
        members: [
          { name: '박민정', attended: true },
          { name: '이현우', attended: false }
        ]
      },
      {
        id: '3',
        time: '오후 05:00',
        type: '그룹수업',
        room: 'C룸',
        instructor: '최코치',
        members: [
          { name: '박지훈', attended: true },
          { name: '서지현', attended: true },
          { name: '이도윤', attended: false },
          { name: '최유리', attended: false }
        ]
      }
    ]
    // TODO: role에 따라 필터링
    // - admin/instructor: 모든 수업 또는 본인 수업
    // - member: 본인이 등록한 수업만
    setSessions(mockSessions)
  }, [selectedDate])

  return (
    <div className="space-y-6">
      {/* 페이지 제목 + 토글 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(selectedDate)}
          </p>
        </div>

        {!isMember && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('instructor')}
              className={`
                px-4 py-2 rounded-md text-sm font-bold transition-all
                ${viewMode === 'instructor'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              강사 모드
            </button>
            <button
              onClick={() => setViewMode('member')}
              className={`
                px-4 py-2 rounded-md text-sm font-bold transition-all
                ${viewMode === 'member'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              회원 모드
            </button>
          </div>
        )}
      </div>

      {viewMode === 'instructor' ? (
        <>
          <InstructorKPI sessions={sessions} />
          <Calendar value={selectedDate} onChange={setSelectedDate} />
          <InstructorSessionList selectedDate={selectedDate} sessions={sessions} />
        </>
      ) : (
        <>
          <MemberKPI />
          <Calendar value={selectedDate} onChange={setSelectedDate} />
          <MemberSessionList selectedDate={selectedDate} sessions={sessions} />
        </>
      )}
    </div>
  )
}

// 메인 페이지
export default function DashboardPage() {
  return (
    <ProtectedRoute requireMenu="dashboard">
      <DashboardContent />
    </ProtectedRoute>
  )
}