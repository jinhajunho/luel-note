interface AttendanceCardProps {
  memberName: string
  lessonType: string
  paymentType: string
  attended: boolean | null
  onCheckIn?: () => void
  onCheckOut?: () => void
  disabled?: boolean
}

export default function AttendanceCard({
  memberName,
  lessonType,
  paymentType,
  attended,
  onCheckIn,
  onCheckOut,
  disabled = false
}: AttendanceCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* 회원 이름 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">{memberName}</h3>
        
        {/* 출석 상태 표시 */}
        {attended !== null && (
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full
            ${attended 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
            }
          `}>
            {attended ? '출석' : '결석'}
          </span>
        )}
      </div>

      {/* 레슨 정보 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
          {lessonType}
        </span>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          {paymentType}
        </span>
      </div>

      {/* 출석 버튼 */}
      {attended === null && (
        <div className="flex gap-2">
          <button
            onClick={onCheckIn}
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            출석
          </button>
          <button
            onClick={onCheckOut}
            disabled={disabled}
            className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            결석
          </button>
        </div>
      )}

      {/* 출석 처리 완료 후 */}
      {attended !== null && (
        <div className="text-center text-sm text-gray-500">
          {attended ? '✓ 출석 처리되었습니다' : '✗ 결석 처리되었습니다'}
        </div>
      )}
    </div>
  )
}
