'use client'

import { useState, useEffect } from 'react'
import { toggleAttendance, completeClass } from '@/lib/actions/attendance-actions'
import { useAuth } from '@/contexts/AuthContext'
import Loading from '@/components/common/Loading'

// ==================== 타입 정의 ====================
type TabType = 'today' | 'history'

interface ClassSession {
  id: string
  time: string
  classTypeName: string
  classTypeColor: string
  paymentTypeName: string
  paymentTypeColor: string
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
  hasPackage: boolean
  packagePaymentType?: string
}

interface AttendanceHistory {
  id: string
  date: string
  time: string
  classTypeName: string
  classTypeColor: string
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
export default function InstructorAttendancePage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('today')
  const [todaySessions, setTodaySessions] = useState<ClassSession[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [processing, setProcessing] = useState(false)

  // 레슨 타입 색상
  const classTypeColors: Record<string, string> = {
    인트로: 'bg-gray-400',
    개인레슨: 'bg-purple-500',
    듀엣레슨: 'bg-pink-500',
    그룹레슨: 'bg-orange-500',
  }

  // 결제 타입 색상
  const paymentTypeColors: Record<string, string> = {
    체험수업: 'bg-amber-500',
    정규수업: 'bg-blue-500',
    강사제공: 'bg-emerald-500',
    센터제공: 'bg-yellow-400',
  }

  // 오늘 날짜
  const today = new Date()
  const todayStr = `${today.getMonth() + 1}월 ${today.getDate()}일`

  // 데이터 로드
  useEffect(() => {
    if (profile && activeTab === 'today') {
      loadTodaySessions()
    } else if (profile && activeTab === 'history') {
      loadAttendanceHistory()
    }
  }, [profile, activeTab, selectedDate])

  const loadTodaySessions = async () => {
    setLoading(true)
    try {
      // TODO: Supabase에서 오늘 담당 레슨 조회
      // const today = new Date().toISOString().split('T')[0]
      // const { data, error } = await supabase
      //   .from('classes')
      //   .select(`
      //     *,
      //     class_type:class_types(name, color),
      //     payment_type:payment_types(name, color),
      //     class_members(
      //       *,
      //       member:members(name, phone),
      //       membership_package:membership_packages(
      //         remaining_lessons, 
      //         total_lessons,
      //         payment_type_id
      //       )
      //     )
      //   `)
      //   .eq('date', today)
      //   .eq('instructor_id', profile.phone)
      //   .in('status', ['scheduled', 'ongoing'])
      //   .order('time')

      // 임시 목 데이터
      const mockData: ClassSession[] = [
        {
          id: '1',
          time: '10:00',
          classTypeName: '개인레슨',
          classTypeColor: 'bg-purple-500',
          paymentTypeName: '정규수업',
          paymentTypeColor: 'bg-blue-500',
          completed: false,
          members: [
            {
              memberId: 'm1',
              memberName: '홍길동',
              memberPhone: '010-1234-5678',
              remainingLessons: 12,
              totalLessons: 30,
              attended: null,
              hasPackage: true,
              packagePaymentType: '정규수업'
            },
          ],
        },
        {
          id: '2',
          time: '14:00',
          classTypeName: '그룹레슨',
          classTypeColor: 'bg-orange-500',
          paymentTypeName: '강사제공',
          paymentTypeColor: 'bg-emerald-500',
          completed: false,
          members: [
            {
              memberId: 'm2',
              memberName: '김철수',
              memberPhone: '010-2222-3333',
              remainingLessons: 7,
              totalLessons: 20,
              attended: null,
              hasPackage: true,
              packagePaymentType: '강사제공'
            },
            {
              memberId: 'm3',
              memberName: '이영희',
              memberPhone: '010-4444-5555',
              remainingLessons: 14,
              totalLessons: 30,
              attended: null,
              hasPackage: true,
              packagePaymentType: '강사제공'
            },
          ],
        },
      ]

      setTodaySessions(mockData)
    } catch (error) {
      console.error('오늘 레슨 로드 실패:', error)
      alert('레슨 정보를 불러오는데 실패했습니다.')
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
      //     class_members(attended, check_in_time, member:members(name))
      //   `)
      //   .eq('instructor_id', profile.phone)
      //   .eq('status', 'completed')
      //   .gte('date', selectedDate)
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
      ]

      setAttendanceHistory(mockData)
    } catch (error) {
      console.error('출석 기록 로드 실패:', error)
      alert('출석 기록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 출석 토글
  const handleToggleAttendance = async (sessionId: string, memberId: string, memberName: string, hasPackage: boolean) => {
    const session = todaySessions.find(s => s.id === sessionId)
    const member = session?.members.find(m => m.memberId === memberId)
    
    if (!hasPackage && member?.attended !== true) {
      alert(`${memberName} 회원은 사용 가능한 회원권이 없습니다.\n관리자에게 회원권 등록을 요청하세요.`)
      return
    }

    setProcessing(true)

    try {
      const result = await toggleAttendance(sessionId, memberId, member?.attended || null)
      
      if (!result.success) {
        alert(result.message)
        return
      }

      // UI 업데이트
      setTodaySessions((prev) =>
        prev.map((session) => {
          if (session.id === sessionId) {
            return {
              ...session,
              members: session.members.map((m) => {
                if (m.memberId === memberId) {
                  const newAttended = m.attended === null ? true : m.attended ? false : true
                  return {
                    ...m,
                    attended: newAttended,
                    checkInTime: newAttended ? new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : undefined,
                    remainingLessons: newAttended && m.hasPackage ? m.remainingLessons - 1 : m.remainingLessons
                  }
                }
                return m
              }),
            }
          }
          return session
        })
      )

      alert(result.message)

    } catch (error) {
      console.error('출석 처리 오류:', error)
      alert('출석 처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  // 레슨 완료
  const handleCompleteSession = async (sessionId: string) => {
    const session = todaySessions.find((s) => s.id === sessionId)
    if (!session) return

    const hasUnmarked = session.members.some((m) => m.attended === null)
    if (hasUnmarked) {
      if (!confirm('아직 체크하지 않은 회원이 있습니다.\n체크하지 않은 회원은 자동으로 결석 처리됩니다.\n레슨을 완료하시겠습니까?')) {
        return
      }
    }

    setProcessing(true)

    try {
      const result = await completeClass(sessionId)
      
      if (!result.success) {
        alert(result.message)
        return
      }

      alert(result.message)
      await loadTodaySessions()

    } catch (error) {
      console.error('레슨 완료 실패:', error)
      alert('레슨 완료에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* 헤더 */}
      <div className="bg-white border-b border-[#f0ebe1] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">출석 관리</h1>
            <span className="px-3 py-1 bg-[#8b5cf6] text-white text-sm font-semibold rounded-full">
              강사
            </span>
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {todayStr}
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white border-b border-[#f0ebe1]">
        <div className="max-w-7xl mx-auto px-4 flex">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'today'
                ? 'border-[#8b5cf6] text-[#8b5cf6]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            오늘 레슨
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-[#8b5cf6] text-[#8b5cf6]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            출석 기록
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto p-4">
        {/* ==================== 오늘 레슨 탭 ==================== */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {loading ? (
              <Loading />
            ) : todaySessions.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#f0ebe1] p-12 text-center">
                <div className="text-5xl mb-4">📅</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  오늘 예정된 레슨이 없습니다
                </div>
                <div className="text-sm text-gray-600">
                  편안한 하루 보내세요!
                </div>
              </div>
            ) : (
              todaySessions.map((session) => (
                <div key={session.id} className="bg-white rounded-xl border border-[#f0ebe1] p-4">
                  {/* 레슨 헤더 */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#f5f1e8]">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-gray-900">
                        {session.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 ${session.classTypeColor} text-white text-sm font-semibold rounded-lg`}>
                          {session.classTypeName}
                        </span>
                        <span className={`px-3 py-1 ${session.paymentTypeColor} text-white text-sm font-semibold rounded-lg`}>
                          {session.paymentTypeName}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {session.members.length}명
                    </div>
                  </div>

                  {/* 회원 목록 */}
                  <div className="space-y-2 mb-4">
                    {session.members.map((member) => (
                      <div
                        key={member.memberId}
                        onClick={() => !session.completed && !processing && handleToggleAttendance(session.id, member.memberId, member.memberName, member.hasPackage)}
                        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                          session.completed
                            ? 'opacity-60 cursor-not-allowed'
                            : processing
                            ? 'opacity-60 cursor-wait'
                            : member.attended === true
                            ? 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                            : member.attended === false
                            ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                            : !member.hasPackage
                            ? 'bg-gray-100 border border-gray-300'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {/* 체크박스 */}
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            member.attended === true
                              ? 'bg-emerald-500 border-emerald-500'
                              : member.attended === false
                              ? 'bg-red-500 border-red-500'
                              : !member.hasPackage
                              ? 'bg-gray-300 border-gray-400'
                              : 'border-gray-300'
                          }`}
                        >
                          {member.attended === true && (
                            <span className="text-white text-sm font-bold">✓</span>
                          )}
                          {member.attended === false && (
                            <span className="text-white text-sm font-bold">✗</span>
                          )}
                          {!member.hasPackage && (
                            <span className="text-gray-600 text-xs font-bold">!</span>
                          )}
                        </div>

                        {/* 회원 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {member.memberName}
                            </span>
                            {!member.hasPackage && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                회원권 없음
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {member.hasPackage ? (
                              <>회원권 {member.remainingLessons}/{member.totalLessons}</>
                            ) : (
                              <>{member.packagePaymentType || session.paymentTypeName} 회원권 필요</>
                            )}
                          </div>
                        </div>

                        {/* 출석 시간 */}
                        {member.attended === true && member.checkInTime && (
                          <div className="text-xs font-semibold text-emerald-600">
                            {member.checkInTime}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 완료 버튼 */}
                  {!session.completed && (
                    <button
                      onClick={() => handleCompleteSession(session.id)}
                      disabled={processing}
                      className={`w-full py-3 bg-[#8b5cf6] text-white font-semibold rounded-xl transition-colors ${
                        processing ? 'opacity-60 cursor-wait' : 'hover:bg-[#7c3aed]'
                      }`}
                    >
                      {processing ? '처리 중...' : '레슨 완료'}
                    </button>
                  )}

                  {session.completed && (
                    <div className="w-full py-3 bg-gray-100 text-gray-500 font-semibold rounded-xl text-center">
                      ✓ 완료된 레슨
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== 기록 탭 ==================== */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {loading ? (
              <Loading />
            ) : attendanceHistory.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#f0ebe1] p-12 text-center">
                <div className="text-5xl mb-4">📋</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  출석 기록이 없습니다
                </div>
              </div>
            ) : (
              attendanceHistory.map((record) => (
                <div key={record.id} className="bg-white rounded-xl border border-[#f0ebe1] p-4">
                  {/* 레슨 정보 */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#f5f1e8]">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {record.date} {record.time}
                      </div>
                      <span className={`px-2 py-1 ${record.classTypeColor} text-white text-xs font-semibold rounded-lg`}>
                        {record.classTypeName}
                      </span>
                    </div>
                  </div>

                  {/* 출석 현황 */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">
                        출석 <span className="font-semibold text-gray-900">{record.totalAttended}명</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-sm text-gray-700">
                        결석 <span className="font-semibold text-gray-900">{record.totalAbsent}명</span>
                      </span>
                    </div>
                  </div>

                  {/* 회원 목록 */}
                  <div className="flex flex-wrap gap-2">
                    {record.members.map((member, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          member.attended
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {member.name}
                        {member.attended && member.checkInTime && (
                          <span className="ml-2 text-xs opacity-70">
                            {member.checkInTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
