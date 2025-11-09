import { formatInstructorName } from '@/lib/utils/text'

interface Member {
  id: string
  name: string
  passInfo: string  // "12/30" 형식
  attended: boolean | null
  checkInTime?: string  // "10:05" 형식
}

interface AttendanceCardProps {
  time: string
  lessonType: string
  lessonTypeColor: string  // "gray" | "purple" | "pink" | "orange"
  instructor: string
  members: Member[]
  completed?: boolean
  onToggleAttendance?: (memberId: string) => void
  onComplete?: () => void
}

export default function AttendanceCard({
  time,
  lessonType,
  lessonTypeColor,
  instructor,
  members,
  completed = false,
  onToggleAttendance,
  onComplete
}: AttendanceCardProps) {
  const typeColorClasses = {
    gray: 'bg-gray-400 text-white',
    purple: 'bg-purple-500 text-white',
    pink: 'bg-pink-500 text-white',
    orange: 'bg-orange-500 text-white'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      {/* 레슨 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-lg font-bold text-gray-900">{time}</div>
        <div className={`px-3 py-1 text-xs font-bold rounded-full ${typeColorClasses[lessonTypeColor as keyof typeof typeColorClasses]}`}>
          {lessonType}
        </div>
        <div className="text-sm text-gray-600">{formatInstructorName(instructor)}</div>
      </div>

      {/* 회원 목록 */}
      <div className="space-y-2 mb-4">
        {members.map((member) => (
          <div
            key={member.id}
            onClick={() => !completed && onToggleAttendance?.(member.id)}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all
              ${member.attended ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
              ${!completed ? 'cursor-pointer hover:border-gray-300' : 'cursor-default'}
            `}
          >
            {/* 체크박스 */}
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all
              ${member.attended 
                ? 'bg-green-500 border-green-500' 
                : 'bg-white border-gray-300'
              }
            `}>
              {member.attended && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {/* 회원 정보 */}
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{member.name}</div>
              <div className="text-xs text-gray-500">회원권 {member.passInfo}</div>
            </div>

            {/* 출석 시간 */}
            {member.attended && member.checkInTime && (
              <div className="text-sm text-green-600 font-medium">
                {member.checkInTime} 출석
              </div>
            )}
            {member.attended === false && (
              <div className="text-sm text-red-600 font-medium">
                결석
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 레슨 완료 버튼 */}
      <button
        onClick={onComplete}
        disabled={completed}
        className={`
          w-full py-3 rounded-lg font-bold text-sm transition-all
          ${completed
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {completed ? '✓ 레슨 완료됨' : '레슨 완료'}
      </button>
    </div>
  )
}
