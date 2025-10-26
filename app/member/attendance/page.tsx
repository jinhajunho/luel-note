'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Loading from '@/components/common/Loading'

// ==================== 타입 정의 ====================

interface MembershipPackage {
  id: string
  paymentTypeName: string
  paymentTypeColor: string
  totalLessons: number
  remainingLessons: number
  usedLessons: number
  startDate: string
  endDate: string
  status: 'active' | 'expired' | 'exhausted'
}

interface TodayClass {
  id: string
  date: string
  time: string
  classTypeName: string
  classTypeColor: string
  paymentTypeName: string
  paymentTypeColor: string
  instructorName: string
  attended: boolean | null
  checkInTime?: string
}

interface AttendanceRecord {
  id: string
  date: string
  time: string
  classType: string
  paymentType: string
  instructor: string
  attended: boolean
  checkInTime?: string
}

// ==================== 서브 컴포넌트 ====================

// 회원권 카드
function MembershipCard({ pkg }: { pkg: MembershipPackage }) {
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-gray-100 text-gray-700',
    exhausted: 'bg-red-100 text-red-700',
  }

  const statusLabels = {
    active: '사용 중',
    expired: '만료됨',
    exhausted: '소진됨',
  }

  return (
    <div className="bg-white rounded-xl border border-[#f0ebe1] p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <span className={`px-3 py-1 ${pkg.paymentTypeColor} text-white text-sm font-semibold rounded-lg`}>
          {pkg.paymentTypeName}
        </span>
        <span className={`px-3 py-1 ${statusColors[pkg.status]} text-xs font-semibold rounded-full`}>
          {statusLabels[pkg.status]}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">잔여 횟수</span>
          <span className="text-lg font-bold text-[#7EA1B3]">
            {pkg.remainingLessons} / {pkg.totalLessons}회
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#7EA1B3] h-2 rounded-full transition-all"
            style={{ width: `${(pkg.remainingLessons / pkg.totalLessons) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{pkg.startDate}</span>
          <span>~</span>
          <span>{pkg.endDate}</span>
        </div>
      </div>
    </div>
  )
}

// 오늘 수업 카드
function TodayClassCard({ cls }: { cls: TodayClass }) {
  const getAttendanceStatus = () => {
    if (cls.attended === true) {
      return {
        icon: '✓',
        label: '출석',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      }
    } else if (cls.attended === false) {
      return {
        icon: '✗',
        label: '결석',
        color: 'bg-red-50 text-red-700 border-red-200',
      }
    } else {
      return {
        icon: '○',
        label: '대기',
        color: 'bg-gray-50 text-gray-600 border-gray-200',
      }
    }
  }

  const status = getAttendanceStatus()

  return (
    <div className="bg-white rounded-xl border border-[#f0ebe1] p-4 mb-3">
      {/* 시간 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl font-bold text-gray-900">{cls.time}</div>
        <div className={`px-3 py-1 ${status.color} border rounded-lg text-sm font-semibold`}>
          {status.icon} {status.label}
        </div>
      </div>

      {/* 레슨 유형 + 결제 타입 */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-3 py-1 ${cls.classTypeColor} text-white text-sm font-semibold rounded-lg`}>
          {cls.classTypeName}
        </span>
        <span className={`px-3 py-1 ${cls.paymentTypeColor} text-white text-sm font-semibold rounded-lg`}>
          {cls.paymentTypeName}
        </span>
      </div>

      {/* 강사 */}
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-sm text-gray-600">강사: {cls.instructorName}</span>
      </div>

      {/* 출석 시간 */}
      {cls.attended && cls.checkInTime && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          출석 시간: {cls.checkInTime}
        </div>
      )}
    </div>
  )
}

// 출석 기록 카드
function AttendanceRecordCard({ record }: { record: AttendanceRecord }) {
  return (
    <div className="bg-white rounded-xl border border-[#f0ebe1] p-4 mb-3">
      {/* 날짜 + 시간 + 출석 상태 */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900">
          {record.date} {record.time}
        </div>
        <div className={`px-3 py-1 border rounded-lg text-sm font-semibold ${
          record.attended 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
          }
        `}>
          {record.attended ? '✓ 출석' : '✗ 결석'}
        </div>
      </div>

      {/* 레슨 유형 + 결제 타입 */}
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
        <span>{record.classType}</span>
        <span>·</span>
        <span>{record.paymentType}</span>
      </div>

      {/* 강사 */}
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-sm text-gray-600">{record.instructor}</span>
      </div>

      {/* 출석 시간 */}
      {record.attended && record.checkInTime && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          출석 시간: {record.checkInTime}
        </div>
      )}
    </div>
  )
}

// ==================== 메인 컴포넌트 ====================
export default function MemberAttendancePage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'today' | 'packages' | 'history'>('today')
  const [loading, setLoading] = useState(true)
  
  // 데이터
  const [membershipPackages, setMembershipPackages] = useState<MembershipPackage[]>([])
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])

  // 통계
  const [stats, setStats] = useState({
    totalAttended: 0,
    totalAbsent: 0,
    attendanceRate: 0,
  })

  useEffect(() => {
    if (profile) {
      loadData()
    }
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      // TODO: Supabase에서 데이터 로드
      // 1. 회원권 정보
      // 2. 오늘 수업
      // 3. 출석 기록

      // 임시 목 데이터
      const mockPackages: MembershipPackage[] = [
        {
          id: '1',
          paymentTypeName: '정규수업',
          paymentTypeColor: 'bg-blue-500',
          totalLessons: 30,
          remainingLessons: 12,
          usedLessons: 18,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          status: 'active',
        },
        {
          id: '2',
          paymentTypeName: '강사제공',
          paymentTypeColor: 'bg-emerald-500',
          totalLessons: 5,
          remainingLessons: 3,
          usedLessons: 2,
          startDate: '2025-01-01',
          endDate: '2025-06-30',
          status: 'active',
        },
      ]

      const mockTodayClasses: TodayClass[] = [
        {
          id: '1',
          date: '2025-01-20',
          time: '10:00',
          classTypeName: '개인레슨',
          classTypeColor: 'bg-purple-500',
          paymentTypeName: '정규수업',
          paymentTypeColor: 'bg-blue-500',
          instructorName: '김강사',
          attended: null,
        },
        {
          id: '2',
          date: '2025-01-20',
          time: '14:00',
          classTypeName: '그룹레슨',
          classTypeColor: 'bg-orange-500',
          paymentTypeName: '정규수업',
          paymentTypeColor: 'bg-blue-500',
          instructorName: '이강사',
          attended: null,
        },
      ]

      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          date: '2025-01-18',
          time: '10:00',
          classType: '개인레슨',
          paymentType: '정규수업',
          instructor: '김강사',
          attended: true,
          checkInTime: '09:58'
        },
        {
          id: '2',
          date: '2025-01-15',
          time: '14:00',
          classType: '그룹레슨',
          paymentType: '센터제공',
          instructor: '박강사',
          attended: false
        },
        {
          id: '3',
          date: '2025-01-13',
          time: '10:00',
          classType: '개인레슨',
          paymentType: '정규수업',
          instructor: '김강사',
          attended: true,
          checkInTime: '10:01'
        }
      ]

      setMembershipPackages(mockPackages)
      setTodayClasses(mockTodayClasses)
      setAttendanceRecords(mockRecords)

      // 통계 계산
      const attended = mockRecords.filter(r => r.attended).length
      const absent = mockRecords.filter(r => !r.attended).length
      const total = attended + absent
      setStats({
        totalAttended: attended,
        totalAbsent: absent,
        attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
      })

    } catch (error) {
      console.error('데이터 로드 실패:', error)
      alert('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const todayStr = `${today.getMonth() + 1}월 ${today.getDate()}일`

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* 헤더 */}
      <div className="bg-white border-b border-[#f0ebe1] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">출석 확인</h1>
            <span className="px-3 py-1 bg-[#7EA1B3] text-white text-sm font-semibold rounded-full">
              회원
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
                ? 'border-[#7EA1B3] text-[#7EA1B3]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            오늘 수업
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'packages'
                ? 'border-[#7EA1B3] text-[#7EA1B3]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            회원권
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-[#7EA1B3] text-[#7EA1B3]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            출석 기록
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto p-4">
        {loading ? (
          <Loading />
        ) : (
          <>
            {/* 오늘 수업 탭 */}
            {activeTab === 'today' && (
              <div>
                {todayClasses.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#f0ebe1] p-12 text-center">
                    <div className="text-5xl mb-4">📅</div>
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      오늘 예정된 수업이 없습니다
                    </div>
                    <div className="text-sm text-gray-600">
                      편안한 하루 보내세요!
                    </div>
                  </div>
                ) : (
                  todayClasses.map(cls => (
                    <TodayClassCard key={cls.id} cls={cls} />
                  ))
                )}
              </div>
            )}

            {/* 회원권 탭 */}
            {activeTab === 'packages' && (
              <div>
                {membershipPackages.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#f0ebe1] p-12 text-center">
                    <div className="text-5xl mb-4">💳</div>
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      등록된 회원권이 없습니다
                    </div>
                    <div className="text-sm text-gray-600">
                      관리자에게 회원권 등록을 요청하세요
                    </div>
                  </div>
                ) : (
                  membershipPackages.map(pkg => (
                    <MembershipCard key={pkg.id} pkg={pkg} />
                  ))
                )}
              </div>
            )}

            {/* 출석 기록 탭 */}
            {activeTab === 'history' && (
              <>
                {/* 통계 */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{stats.totalAttended}</div>
                    <div className="text-xs text-gray-600 mt-1">출석</div>
                  </div>
                  <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.totalAbsent}</div>
                    <div className="text-xs text-gray-600 mt-1">결석</div>
                  </div>
                  <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
                    <div className="text-xs text-gray-600 mt-1">출석률</div>
                  </div>
                </div>

                {/* 기록 목록 */}
                <div>
                  {attendanceRecords.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#f0ebe1] p-12 text-center">
                      <div className="text-5xl mb-4">📋</div>
                      <div className="text-lg font-semibold text-gray-900 mb-2">
                        출석 기록이 없습니다
                      </div>
                    </div>
                  ) : (
                    attendanceRecords.map(record => (
                      <AttendanceRecordCard key={record.id} record={record} />
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
