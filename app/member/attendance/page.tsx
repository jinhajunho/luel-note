'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ==================== 타입 정의 ====================
type AttendanceRecord = {
  id: string
  date: string
  time: string
  type: '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
  instructor: string
  status: 'attended' | 'absent'
  checkInTime?: string
}

type MembershipInfo = {
  name: string
  status: 'active' | 'expired'
  remaining: number
  total: number
  expiryDate: string
}

// ==================== 메인 컴포넌트 ====================
export default function MemberAttendancePage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [membership, setMembership] = useState<MembershipInfo | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    attended: 0,
    absent: 0
  })

  // 레슨 타입 클래스
  const getTypeClass = (type: string) => {
    const classes = {
      '인트로': 'bg-gray-400',
      '개인레슨': 'bg-purple-500',
      '듀엣레슨': 'bg-pink-500',
      '그룹레슨': 'bg-orange-500'
    }
    return classes[type as keyof typeof classes] || 'bg-gray-400'
  }

  useEffect(() => {
    loadAttendance()
  }, [currentDate])

  // 출석 데이터 로드
  const loadAttendance = async () => {
    // TODO: Supabase에서 데이터 가져오기
    const mockRecords: AttendanceRecord[] = [
      {
        id: '1',
        date: '2025-10-22',
        time: '10:00',
        type: '개인레슨',
        instructor: '김강사',
        status: 'attended',
        checkInTime: '09:55'
      },
      {
        id: '2',
        date: '2025-10-20',
        time: '14:00',
        type: '그룹레슨',
        instructor: '이강사',
        status: 'attended',
        checkInTime: '13:58'
      },
      {
        id: '3',
        date: '2025-10-18',
        time: '19:00',
        type: '그룹레슨',
        instructor: '박강사',
        status: 'absent'
      },
      {
        id: '4',
        date: '2025-10-16',
        time: '10:00',
        type: '듀엣레슨',
        instructor: '김강사',
        status: 'attended',
        checkInTime: '10:02'
      }
    ]
    
    setRecords(mockRecords)
    setStats({
      total: mockRecords.length,
      attended: mockRecords.filter(r => r.status === 'attended').length,
      absent: mockRecords.filter(r => r.status === 'absent').length
    })

    // 회원권 정보
    setMembership({
      name: '3개월 개인레슨 12회',
      status: 'active',
      remaining: 8,
      total: 12,
      expiryDate: '2025-12-31'
    })
  }

  // 날짜 변경
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentDate(newDate)
  }

  // 날짜 포맷팅
  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()]
    return `${month}월 ${day}일 (${weekday})`
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* 날짜 선택 */}
      <div className="bg-white px-5 py-4 border-b border-[#f0ebe1] flex items-center gap-3">
        <button
          onClick={() => changeMonth(-1)}
          className="w-9 h-9 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-all font-semibold"
        >
          ←
        </button>
        
        <div className="flex-1 text-center text-base font-semibold text-gray-900">
          {formatMonth(currentDate)}
        </div>
        
        <button
          onClick={() => changeMonth(1)}
          className="w-9 h-9 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-all font-semibold"
        >
          →
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-5 py-5 pb-24">
        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.total}
            </div>
            <div className="text-xs text-[#7a6f61]">총 레슨</div>
          </div>
          
          <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.attended}
            </div>
            <div className="text-xs text-[#7a6f61]">출석</div>
          </div>
          
          <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-500 mb-1">
              {stats.absent}
            </div>
            <div className="text-xs text-[#7a6f61]">결석</div>
          </div>
        </div>

        {/* 회원권 정보 */}
        {membership && (
          <div className="bg-white border border-[#f0ebe1] rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-900">
                {membership.name}
              </div>
              <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                membership.status === 'active' 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {membership.status === 'active' ? '활성' : '만료'}
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#7a6f61]">남은 레슨</span>
              <span className="text-sm font-semibold text-gray-900">
                {membership.remaining}회 / {membership.total}회
              </span>
            </div>
            
            {/* 진행률 바 */}
            <div className="w-full h-2 bg-[#f0ebe1] rounded-full mb-2 overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${((membership.total - membership.remaining) / membership.total) * 100}%` }}
              ></div>
            </div>
            
            <div className="text-xs text-[#7a6f61]">
              만료일: {membership.expiryDate}
            </div>
          </div>
        )}

        {/* 출석 현황 */}
        <div className="bg-white border border-[#f0ebe1] rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            출석 현황
          </h2>
          
          {records.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-sm text-[#7a6f61]">
                출석 기록이 없습니다
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map(record => (
                <div
                  key={record.id}
                  className="border border-[#f0ebe1] rounded-lg p-4"
                >
                  {/* 상단: 날짜, 시간 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatDate(record.date)} {record.time}
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      record.status === 'attended' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {record.status === 'attended' ? '출석' : '결석'}
                    </div>
                  </div>
                  
                  {/* 레슨 정보 */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`px-2.5 py-1 rounded-md text-xs font-medium text-white ${getTypeClass(record.type)}`}>
                      {record.type}
                    </div>
                    <div className="text-xs text-[#7a6f61]">
                      {record.instructor}
                    </div>
                  </div>
                  
                  {/* 체크인 시간 */}
                  {record.checkInTime && (
                    <div className="text-xs text-[#7a6f61]">
                      체크인: {record.checkInTime}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
