'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Header from '@/components/common/Header'
import BottomNavigation from '@/components/common/BottomNavigation'
import StatusBadge from '@/components/common/StatusBadge'
import Loading from '@/components/common/Loading'
import EmptyState from '@/components/common/EmptyState'

// 타입 정의
type AttendanceRecord = {
  id: string
  date: string
  time: string
  classType: string
  paymentType: string
  instructor: string
  attended: boolean
  checkInTime?: string
}

// 출석 통계 카드
function AttendanceStats({ 
  total, 
  attended, 
  absent 
}: { 
  total: number
  attended: number
  absent: number
}) {
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm text-gray-600 mb-1">총 레슨</div>
        <div className="text-2xl font-bold text-gray-900">{total}회</div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm text-gray-600 mb-1">출석</div>
        <div className="text-2xl font-bold text-green-600">{attended}회</div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm text-gray-600 mb-1">결석</div>
        <div className="text-2xl font-bold text-red-600">{absent}회</div>
      </div>
    </div>
  )
}

// 출석 기록 카드
function AttendanceCard({ record }: { record: AttendanceRecord }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* 날짜 */}
      <div className="text-sm text-gray-500 mb-2">
        {new Date(record.date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })}
      </div>

      {/* 시간 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-gray-900">{record.time}</span>
        </div>
        
        <div className={`
          px-3 py-1 rounded-full text-xs font-medium
          ${record.attended 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
          }
        `}>
          {record.attended ? '✓ 출석' : '✗ 결석'}
        </div>
      </div>

      {/* 레슨 유형 + 결제 타입 */}
      <div className="flex items-center gap-2 mb-3">
        <StatusBadge type="class" value={record.classType} size="sm" />
        <StatusBadge type="payment" value={record.paymentType} size="sm" />
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
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          출석 시간: {record.checkInTime}
        </div>
      )}
    </div>
  )
}

// 메인 컴포넌트
export default function MemberAttendancePage() {
  const { profile } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'attended' | 'absent'>('all')

  useEffect(() => {
    if (profile) {
      loadAttendance()
    }
  }, [profile])

  const loadAttendance = async () => {
    try {
      setLoading(true)
      
      // TODO: Supabase에서 데이터 로드
      // 지금은 목 데이터
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          date: '2025-01-20',
          time: '10:00',
          classType: '개인레슨',
          paymentType: '정규수업',
          instructor: '김강사',
          attended: true,
          checkInTime: '09:58'
        },
        {
          id: '2',
          date: '2025-01-18',
          time: '14:00',
          classType: '듀엣레슨',
          paymentType: '정규수업',
          instructor: '이강사',
          attended: true,
          checkInTime: '14:02'
        },
        {
          id: '3',
          date: '2025-01-15',
          time: '16:00',
          classType: '그룹레슨',
          paymentType: '센터제공',
          instructor: '박강사',
          attended: false
        },
        {
          id: '4',
          date: '2025-01-13',
          time: '10:00',
          classType: '개인레슨',
          paymentType: '정규수업',
          instructor: '김강사',
          attended: true,
          checkInTime: '10:01'
        }
      ]
      
      setRecords(mockRecords)
    } catch (error) {
      console.error('❌ 출석 기록 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 필터링된 기록
  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true
    if (filter === 'attended') return record.attended
    if (filter === 'absent') return !record.attended
    return true
  })

  // 통계
  const totalCount = records.length
  const attendedCount = records.filter(r => r.attended).length
  const absentCount = records.filter(r => !r.attended).length

  if (!profile) {
    return <Loading text="로딩 중..." />
  }

  return (
    <>
      <Header profile={profile} />
      
      <main className="pb-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* 페이지 제목 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">출석 기록</h2>
            <p className="text-sm text-gray-500 mt-1">
              나의 레슨 출석 현황을 확인하세요
            </p>
          </div>

          {/* 출석 통계 */}
          <AttendanceStats 
            total={totalCount}
            attended={attendedCount}
            absent={absentCount}
          />

          {/* 필터 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              전체 ({totalCount})
            </button>
            <button
              onClick={() => setFilter('attended')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === 'attended'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              출석 ({attendedCount})
            </button>
            <button
              onClick={() => setFilter('absent')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === 'absent'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              결석 ({absentCount})
            </button>
          </div>

          {/* 출석 기록 목록 */}
          {loading ? (
            <Loading />
          ) : filteredRecords.length > 0 ? (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <AttendanceCard key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="출석 기록이 없습니다"
              description="아직 출석한 레슨이 없습니다."
            />
          )}
        </div>
      </main>

      <BottomNavigation profile={profile} />
    </>
  )
}
