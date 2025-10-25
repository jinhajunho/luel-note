'use client'

import { useState, useEffect } from 'react'

// ==================== 타입 정의 ====================
type TabType = 'today' | 'history'

interface ClassSession {
  id: string
  time: string
  classTypeName: string
  classTypeColor: string
  instructorName: string
  members: MemberAttendance[]
  completed: boolean
}

interface MemberAttendance {
  memberId: string
  memberName: string
  memberPhone: string
  remainingLessons: number
  totalLessons: number
  attended: boolean | null
  checkInTime?: string
}

interface AttendanceHistory {
  id: string
  date: string
  time: string
  classTypeName: string
  classTypeColor: string
  instructorName: string
  members: {
    name: string
    attended: boolean
    checkInTime?: string
  }[]
  completed: boolean
  totalAttended: number
  totalAbsent: number
}

// ==================== 메인 컴포넌트 ====================
export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('today')
  const [todaySessions, setTodaySessions] = useState<ClassSession[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // 레슨 타입 색상
  const classTypeColors: Record<string, string> = {
    인트로: 'bg-gray-400',
    개인레슨: 'bg-purple-500',
    듀엣레슨: 'bg-pink-500',
    그룹레슨: 'bg-orange-500',
  }

  // 오늘 날짜
  const today = new Date()
  const todayStr = `${today.getMonth() + 1}월 ${today.getDate()}일`

  // 데이터 로드
  useEffect(() => {
    if (activeTab === 'today') {
      loadTodaySessions()
    } else {
      loadAttendanceHistory()
    }
  }, [activeTab, selectedDate])

  const loadTodaySessions = async () => {
    setLoading(true)
    try {
      // TODO: Supabase에서 오늘 레슨 조회
      // const today = new Date().toISOString().split('T')[0]
      // const { data, error } = await supabase
      //   .from('classes')
      //   .select(`
      //     *,
      //     class_type:class_types(name, color),
      //     instructor:profiles!classes_instructor_id_fkey(name),
      //     class_members(
      //       member_id,
      //       attended,
      //       check_in_time,
      //       member:members(name, phone),
      //       membership_package:membership_packages(remaining_lessons, total_lessons)
      //     )
      //   `)
      //   .eq('date', today)
      //   .eq('status', 'scheduled')
      //   .order('time')

      // 임시 목 데이터
      const mockData: ClassSession[] = [
        {
          id: '1',
          time: '10:00',
          classTypeName: '개인레슨',
          classTypeColor: 'bg-purple-500',
          instructorName: '이지은',
          completed: false,
          members: [
            {
              memberId: 'm1',
              memberName: '홍길동',
              memberPhone: '010-1234-5678',
              remainingLessons: 12,
              totalLessons: 30,
              attended: null,
            },
          ],
        },
        {
          id: '2',
          time: '14:00',
          classTypeName: '그룹레슨',
          classTypeColor: 'bg-orange-500',
          instructorName: '박서준',
          completed: false,
          members: [
            {
              memberId: 'm2',
              memberName: '김철수',
              memberPhone: '010-2222-3333',
              remainingLessons: 7,
              totalLessons: 20,
              attended: null,
            },
            {
              memberId: 'm3',
              memberName: '이영희',
              memberPhone: '010-4444-5555',
              remainingLessons: 14,
              totalLessons: 30,
              attended: null,
            },
            {
              memberId: 'm4',
              memberName: '박민지',
              memberPhone: '010-6666-7777',
              remainingLessons: 5,
              totalLessons: 20,
              attended: null,
            },
          ],
        },
      ]

      setTodaySessions(mockData)
    } catch (error) {
      console.error('오늘 레슨 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceHistory = async () => {
    setLoading(true)
    try {
      // TODO: Supabase에서 출석 기록 조회
      // const { data, error } = await supabase
      //   .from('classes')
      //   .select(`
      //     *,
      //     class_type:class_types(name, color),
      //     instructor:profiles!classes_instructor_id_fkey(name),
      //     class_members(attended, check_in_time, member:members(name))
      //   `)
      //   .eq('status', 'completed')
      //   .order('date', { ascending: false })
      //   .order('time', { ascending: false })

      // 임시 목 데이터
      const mockData: AttendanceHistory[] = [
        {
          id: '1',
          date: '2025-01-14',
          time: '10:00',
          classTypeName: '개인레슨',
          classTypeColor: 'bg-purple-500',
          instructorName: '이지은',
          completed: true,
          totalAttended: 1,
          totalAbsent: 0,
          members: [
            {
              name: '홍길동',
              attended: true,
              checkInTime: '10:05',
            },
          ],
        },
        {
          id: '2',
          date: '2025-01-14',
          time: '09:00',
          classTypeName: '그룹레슨',
          classTypeColor: 'bg-orange-500',
          instructorName: '박서준',
          completed: true,
          totalAttended: 2,
          totalAbsent: 1,
          members: [
            {
              name: '김철수',
              attended: true,
              checkInTime: '09:02',
            },
            {
              name: '이영희',
              attended: true,
              checkInTime: '09:05',
            },
            {
              name: '박민지',
              attended: false,
            },
          ],
        },
      ]

      setAttendanceHistory(mockData)
    } catch (error) {
      console.error('출석 기록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 출석 토글
  const toggleAttendance = (sessionId: string, memberId: string) => {
    setTodaySessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            members: session.members.map((member) => {
              if (member.memberId === memberId) {
                const newAttended = member.attended === null ? true : member.attended ? false : true
                return {
                  ...member,
                  attended: newAttended,
                  checkInTime: newAttended ? new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : undefined,
                }
              }
              return member
            }),
          }
        }
        return session
      })
    )
  }

  // 레슨 완료
  const completeSession = async (sessionId: string) => {
    const session = todaySessions.find((s) => s.id === sessionId)
    if (!session) return

    const hasUnmarked = session.members.some((m) => m.attended === null)
    if (hasUnmarked) {
      if (!confirm('아직 체크하지 않은 회원이 있습니다. 레슨을 완료하시겠습니까?')) {
        return
      }
    }

    try {
      // TODO: Supabase UPDATE
      // 1. 출석한 회원들의 회원권 차감
      // 2. 레슨 상태를 'completed'로 변경

      alert('레슨이 완료되었습니다!')
      loadTodaySessions()
    } catch (error) {
      console.error('레슨 완료 실패:', error)
      alert('레슨 완료에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] pb-20">
      <div className="max-w-2xl mx-auto bg-[#fdfbf7] min-h-screen shadow-xl">
        {/* ==================== 헤더 ==================== */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#f0ebe1]">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">출석 관리</h1>
              <p className="text-xs text-[#7a6f61] mt-0.5">{todayStr}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 text-2xl">🔔</button>
              <button className="w-9 h-9 text-xl opacity-70 hover:opacity-100">
                👤
              </button>
            </div>
          </div>
        </header>

        {/* ==================== 탭 메뉴 ==================== */}
        <div className="bg-white px-5 border-b border-[#f0ebe1]">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'today'
                  ? 'text-gray-900 font-semibold border-gray-900'
                  : 'text-[#9d917f] border-transparent hover:text-[#7a6f61]'
              }`}
            >
              오늘
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'text-gray-900 font-semibold border-gray-900'
                  : 'text-[#9d917f] border-transparent hover:text-[#7a6f61]'
              }`}
            >
              기록
            </button>
          </div>
        </div>

        {/* ==================== 오늘 탭 ==================== */}
        {activeTab === 'today' && (
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="text-center py-10 text-gray-500">로딩 중...</div>
            ) : todaySessions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                오늘 예정된 레슨이 없습니다
              </div>
            ) : (
              todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white border border-[#f0ebe1] rounded-xl p-4 space-y-3"
                >
                  {/* 레슨 헤더 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {session.time}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${session.classTypeColor} text-white text-xs font-medium rounded-lg`}
                    >
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      {session.classTypeName}
                    </span>
                    <span className="text-sm text-gray-600">
                      {session.instructorName}
                    </span>
                  </div>

                  {/* 회원 목록 */}
                  <div className="space-y-2">
                    {session.members.map((member) => (
                      <div
                        key={member.memberId}
                        onClick={() => toggleAttendance(session.id, member.memberId)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          member.attended === true
                            ? 'bg-green-50 border border-green-200'
                            : member.attended === false
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {/* 체크박스 */}
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            member.attended === true
                              ? 'bg-green-500 border-green-500'
                              : member.attended === false
                              ? 'bg-red-500 border-red-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {member.attended === true && (
                            <span className="text-white text-xs">✓</span>
                          )}
                          {member.attended === false && (
                            <span className="text-white text-xs">✗</span>
                          )}
                        </div>

                        {/* 회원 정보 */}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {member.memberName}
                          </div>
                          <div className="text-xs text-gray-500">
                            회원권 {member.remainingLessons}/{member.totalLessons} · {member.memberPhone}
                          </div>
                        </div>

                        {/* 출석 시간 */}
                        {member.attended === true && member.checkInTime && (
                          <div className="text-xs font-medium text-green-600">
                            {member.checkInTime}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 완료 버튼 */}
                  {!session.completed && (
                    <button
                      onClick={() => completeSession(session.id)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                    >
                      레슨 완료
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== 기록 탭 ==================== */}
        {activeTab === 'history' && (
          <>
            {/* 통계 */}
            <div className="grid grid-cols-3 gap-3 p-4">
              <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">24</div>
                <div className="text-xs text-gray-600 mt-1">완료 레슨</div>
              </div>
              <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">92%</div>
                <div className="text-xs text-gray-600 mt-1">출석률</div>
              </div>
              <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-xs text-gray-600 mt-1">결석</div>
              </div>
            </div>

            {/* 기록 목록 */}
            <div className="px-4 pb-4 space-y-3">
              {loading ? (
                <div className="text-center py-10 text-gray-500">로딩 중...</div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  출석 기록이 없습니다
                </div>
              ) : (
                attendanceHistory.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white border border-[#f0ebe1] rounded-xl p-4 space-y-3"
                  >
                    {/* 레슨 헤더 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {record.time}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${record.classTypeColor} text-white text-xs font-medium rounded-lg`}
                      >
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        {record.classTypeName}
                      </span>
                      <span className="text-sm text-gray-600">
                        {record.instructorName}
                      </span>
                    </div>

                    {/* 회원 목록 */}
                    <div className="space-y-1.5">
                      {record.members.map((member, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">{member.name}</span>
                          {member.attended ? (
                            <span className="text-green-600 font-medium">
                              ✓ 출석 {member.checkInTime && `(${member.checkInTime})`}
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">✗ 결석</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 통계 */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <span>출석 {record.totalAttended}명</span>
                      <span>결석 {record.totalAbsent}명</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ==================== 하단 네비게이션 ==================== */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0ebe1] z-40">
          <div className="max-w-2xl mx-auto flex justify-around py-2">
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">📅</span>
              <span className="text-xs">일정</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">📝</span>
              <span className="text-xs">레슨</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">👥</span>
              <span className="text-xs">회원</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-900 font-semibold">
              <span className="text-xl">✅</span>
              <span className="text-xs">출석</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400">
              <span className="text-xl">💰</span>
              <span className="text-xs">정산</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
