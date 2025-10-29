'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import Loading from '@/components/common/Loading'
import { toggleAttendance, completeClass } from '@/lib/actions/attendance-actions'

// ==================== 타입 정의 ====================
type TabType = 'today' | 'history'

interface ClassSession {
  id: string
  time: string
  classTypeName: string
  classTypeColor: string
  paymentTypeName: string
  paymentTypeColor: string
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
  hasPackage: boolean
  packagePaymentType?: string
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

// ==================== 캘린더 모달 컴포넌트 ====================
function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}: {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  onSelectDate: (date: Date) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate))

  useEffect(() => {
    setCurrentMonth(new Date(selectedDate))
  }, [selectedDate])

  if (!isOpen) return null

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selected = new Date(selectedDate)
  selected.setHours(0, 0, 0, 0)

  // 수업 있는 날 (예시 - 실제로는 API에서 가져와야 함)
  const sessionDays = [15, 16, 18, 20, 22, 23, 25]

  const changeMonth = (delta: number) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + delta)
    setCurrentMonth(newMonth)
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(year, month, day)
    onSelectDate(newDate)
    onClose()
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10"></div>)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)

    const isToday = date.getTime() === today.getTime()
    const isSelected = date.getTime() === selected.getTime()
    const hasSession = sessionDays.includes(day)

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`h-10 flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all relative ${
          isSelected
            ? 'bg-[#1a1a1a] text-white'
            : isToday
            ? 'bg-[#fef3c7] text-[#1a1a1a] font-semibold'
            : 'text-[#1a1a1a] hover:bg-[#f5f1e8]'
        }`}
      >
        {day}
        {hasSession && (
          <span
            className={`absolute bottom-1 w-1 h-1 rounded-full ${
              isSelected ? 'bg-white' : 'bg-[#7a6f61]'
            }`}
          ></span>
        )}
      </button>
    )
  }

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* 모달 */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-[600px] mx-auto animate-slide-up">
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 모달 컨텐츠 */}
        <div className="p-5 pb-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#1a1a1a]">날짜 선택</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeMonth(-1)}
                className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-base font-semibold text-[#7a6f61] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
              >
                ‹
              </button>
              <div className="text-sm font-semibold text-[#1a1a1a] min-w-[90px] text-center">
                {year}년 {month + 1}월
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-base font-semibold text-[#7a6f61] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
              >
                ›
              </button>
            </div>
          </div>

          {/* 요일 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((day, idx) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-2 ${
                  idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-[#7a6f61]'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-7 gap-1">{days}</div>

          {/* 범례 */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#f0ebe1]">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#fef3c7] rounded-lg"></div>
              <span className="text-xs text-[#7a6f61]">오늘</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#1a1a1a] rounded-lg"></div>
              <span className="text-xs text-[#7a6f61]">선택</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-[#7a6f61] rounded-full"></div>
              <span className="text-xs text-[#7a6f61]">수업 있음</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ==================== 메인 컴포넌트 ====================
export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('today')
  const [todaySessions, setTodaySessions] = useState<ClassSession[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [processing, setProcessing] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // 레슨 타입 색상 (고정)
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
      // Mock 데이터
      setTimeout(() => {
        setTodaySessions([
          {
            id: '1',
            time: '10:00',
            classTypeName: '개인레슨',
            classTypeColor: classTypeColors['개인레슨'],
            paymentTypeName: '정규수업',
            paymentTypeColor: paymentTypeColors['정규수업'],
            instructorName: '이강사',
            completed: false,
            members: [
              {
                memberId: '1',
                memberName: '홍길동',
                memberPhone: '010-1234-5678',
                remainingLessons: 12,
                totalLessons: 30,
                attended: null,
                hasPackage: true,
              },
            ],
          },
          {
            id: '2',
            time: '11:00',
            classTypeName: '그룹레슨',
            classTypeColor: classTypeColors['그룹레슨'],
            paymentTypeName: '정규수업',
            paymentTypeColor: paymentTypeColors['정규수업'],
            instructorName: '김강사',
            completed: false,
            members: [
              {
                memberId: '2',
                memberName: '김철수',
                memberPhone: '010-2222-3333',
                remainingLessons: 7,
                totalLessons: 20,
                attended: null,
                hasPackage: true,
              },
              {
                memberId: '3',
                memberName: '박영희',
                memberPhone: '010-3333-4444',
                remainingLessons: 14,
                totalLessons: 30,
                attended: null,
                hasPackage: true,
              },
            ],
          },
        ])
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      setLoading(false)
    }
  }

  const loadAttendanceHistory = async () => {
    setLoading(true)
    try {
      // TODO: Supabase에서 출석 기록 조회
      // Mock 데이터
      setTimeout(() => {
        setAttendanceHistory([
          {
            id: '1',
            date: '10월 21일',
            time: '10:00',
            classTypeName: '개인레슨',
            classTypeColor: classTypeColors['개인레슨'],
            instructorName: '이강사',
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
        ])
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('기록 로드 실패:', error)
      setLoading(false)
    }
  }

  // 날짜 변경
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate)
    setSelectedDate(newDate.toISOString().split('T')[0])
  }

  // 캘린더에서 날짜 선택
  const handleSelectDate = (date: Date) => {
    setCurrentDate(date)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  // 현재 날짜 표시
  const getDateDisplay = () => {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    const date = currentDate.getDate()
    const day = weekdays[currentDate.getDay()]
    return `${year}년 ${month}월 ${date}일 (${day})`
  }

  // 출석 처리
  const handleToggleAttendance = async (
    sessionId: string,
    memberId: string,
    memberName: string,
    hasPackage: boolean
  ) => {
    if (!hasPackage) {
      alert(`${memberName}님은 회원권이 없습니다.\n관리자에게 회원권 등록을 요청하세요.`)
      return
    }

    setProcessing(true)

    try {
      const result = await toggleAttendance(sessionId, memberId)

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
                    checkInTime: newAttended
                      ? new Date().toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : undefined,
                    remainingLessons:
                      newAttended && m.hasPackage ? m.remainingLessons - 1 : m.remainingLessons,
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
      if (
        !confirm(
          '아직 체크하지 않은 회원이 있습니다.\n체크하지 않은 회원은 자동으로 결석 처리됩니다.\n레슨을 완료하시겠습니까?'
        )
      ) {
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
    <div className="min-h-screen bg-[#fdfbf7] pb-20">
      {/* Header */}
      <Header role="admin" />

      {/* 날짜 선택 */}
      <div className="bg-white px-5 py-4 border-b border-[#f0ebe1] flex items-center gap-3">
        <button
          onClick={() => changeDate(-1)}
          className="w-9 h-9 border border-[#f0ebe1] bg-white rounded-lg text-base font-semibold text-[#7a6f61] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
        >
          ‹
        </button>
        <button
          onClick={() => setIsCalendarOpen(true)}
          className="flex-1 text-center text-base font-semibold text-[#1a1a1a] hover:text-[#7a6f61] transition-colors cursor-pointer"
        >
          {getDateDisplay()}
        </button>
        <button
          onClick={() => changeDate(1)}
          className="w-9 h-9 border border-[#f0ebe1] bg-white rounded-lg text-base font-semibold text-[#7a6f61] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all"
        >
          ›
        </button>
      </div>

      {/* 캘린더 모달 */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={currentDate}
        onSelectDate={handleSelectDate}
      />

      {/* 탭 메뉴 */}
      <div className="bg-white flex border-b border-[#f0ebe1]">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-3.5 px-5 text-center text-[15px] font-medium border-b-2 transition-colors ${
            activeTab === 'today'
              ? 'text-[#1a1a1a] font-semibold border-[#1a1a1a]'
              : 'text-[#7a6f61] border-transparent hover:text-[#1a1a1a] hover:bg-[#fdfbf7]'
          }`}
        >
          오늘 레슨
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3.5 px-5 text-center text-[15px] font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'text-[#1a1a1a] font-semibold border-[#1a1a1a]'
              : 'text-[#7a6f61] border-transparent hover:text-[#1a1a1a] hover:bg-[#fdfbf7]'
          }`}
        >
          출석 기록
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="p-5">
        {/* ==================== 오늘 레슨 탭 ==================== */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* 통계 */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a1a] mb-1">
                  {todaySessions.length}
                </div>
                <div className="text-xs text-[#7a6f61]">전체 레슨</div>
              </div>
              <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a1a] mb-1">
                  {todaySessions.filter((s) => s.completed).length}
                </div>
                <div className="text-xs text-[#7a6f61]">완료</div>
              </div>
              <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a1a] mb-1">
                  {todaySessions.filter((s) => !s.completed).length}
                </div>
                <div className="text-xs text-[#7a6f61]">대기 중</div>
              </div>
            </div>

            {loading ? (
              <Loading />
            ) : todaySessions.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#f0ebe1] p-12 text-center">
                <div className="text-5xl mb-4">📅</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  오늘 예정된 레슨이 없습니다
                </div>
                <div className="text-sm text-gray-600">새로운 레슨을 등록해보세요</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white border border-[#f0ebe1] rounded-xl p-4 hover:border-[#e8dcc8] hover:shadow-sm transition-all"
                  >
                    {/* 레슨 헤더 */}
                    <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-[#f5f1e8]">
                      <div className="text-base font-semibold text-[#1a1a1a] min-w-[50px]">
                        {session.time}
                      </div>
                      <span
                        className={`px-2.5 py-1 ${session.classTypeColor} text-white text-[11px] font-semibold rounded-md`}
                      >
                        {session.classTypeName}
                      </span>
                      <div className="text-[13px] text-[#7a6f61] ml-auto">
                        {session.instructorName}
                      </div>
                    </div>

                    {/* 회원 목록 */}
                    <div className="flex flex-col gap-2 mb-3">
                      {session.members.map((member) => (
                        <div
                          key={member.memberId}
                          onClick={() =>
                            !session.completed &&
                            !processing &&
                            handleToggleAttendance(
                              session.id,
                              member.memberId,
                              member.memberName,
                              member.hasPackage
                            )
                          }
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            session.completed
                              ? 'opacity-60 cursor-not-allowed'
                              : processing
                              ? 'opacity-60 cursor-wait'
                              : member.attended === true
                              ? 'bg-[#d1fae5]'
                              : 'bg-[#fdfbf7] hover:bg-[#f9f8f5]'
                          }`}
                        >
                          {/* 체크박스 */}
                          <div
                            className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                              member.attended === true
                                ? 'bg-[#22c55e] border-[#22c55e]'
                                : 'border-[#d1d5db]'
                            }`}
                          >
                            {member.attended === true && (
                              <span className="text-white text-sm font-bold">✓</span>
                            )}
                          </div>

                          {/* 회원 정보 */}
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[#1a1a1a] mb-0.5">
                              {member.memberName}
                            </div>
                            <div className="text-xs text-[#7a6f61]">
                              회원권 {member.remainingLessons}/{member.totalLessons}
                            </div>
                          </div>

                          {/* 출석 시간 */}
                          {member.attended === true && member.checkInTime && (
                            <div className="text-xs font-medium text-[#22c55e]">
                              {member.checkInTime}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 완료 버튼 */}
                    {!session.completed ? (
                      <button
                        onClick={() => handleCompleteSession(session.id)}
                        disabled={processing}
                        className={`w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors ${
                          processing ? 'opacity-60 cursor-wait' : 'hover:bg-blue-700'
                        }`}
                      >
                        {processing ? '처리 중...' : '레슨 완료'}
                      </button>
                    ) : (
                      <div className="w-full py-3 bg-[#22c55e] text-white text-sm font-semibold rounded-lg text-center cursor-not-allowed">
                        ✓ 레슨 완료됨
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== 출석 기록 탭 ==================== */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* 통계 */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a1a] mb-1">24</div>
                <div className="text-xs text-[#7a6f61]">완료 레슨</div>
              </div>
              <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a1a] mb-1">92%</div>
                <div className="text-xs text-[#7a6f61]">출석률</div>
              </div>
              <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a1a] mb-1">3</div>
                <div className="text-xs text-[#7a6f61]">결석</div>
              </div>
            </div>

            {/* 기록 목록 */}
            {loading ? (
              <Loading />
            ) : attendanceHistory.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#f0ebe1] p-12 text-center">
                <div className="text-5xl mb-4">📋</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">출석 기록이 없습니다</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {attendanceHistory.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white border border-[#f0ebe1] rounded-xl p-4"
                  >
                    {/* 레슨 정보 */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#f5f1e8]">
                      <div className="flex items-center gap-2.5">
                        <div className="text-sm font-semibold text-[#1a1a1a]">
                          {record.date} {record.time}
                        </div>
                        <span
                          className={`px-2 py-1 ${record.classTypeColor} text-white text-xs font-semibold rounded`}
                        >
                          {record.classTypeName}
                        </span>
                      </div>
                      <div className="text-xs text-[#7a6f61]">{record.instructorName}</div>
                    </div>

                    {/* 출석 현황 */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#22c55e] rounded-full"></span>
                        <span className="text-sm text-[#1a1a1a]">
                          출석 <span className="font-semibold">{record.totalAttended}명</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#ef4444] rounded-full"></span>
                        <span className="text-sm text-[#1a1a1a]">
                          결석 <span className="font-semibold">{record.totalAbsent}명</span>
                        </span>
                      </div>
                    </div>

                    {/* 회원 목록 */}
                    <div className="flex flex-wrap gap-2">
                      {record.members.map((member, idx) => (
                        <div
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${
                            member.attended
                              ? 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]'
                              : 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]'
                          }`}
                        >
                          {member.name}
                          {member.attended && member.checkInTime && (
                            <span className="ml-2 text-xs opacity-70">{member.checkInTime}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BottomNavigation */}
      <BottomNavigation role="admin" />
    </div>
  )
}

