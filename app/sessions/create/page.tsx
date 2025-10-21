'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils/date'
import { useRouter } from 'next/navigation'

type SessionType = '인트로' | '개인수업' | '듀엣수업' | '그룹수업'

type MemberOption = {
  id: string
  name: string
  phone: string
}

export default function SessionCreatePage() {
  const router = useRouter()
  
  // 폼 상태
  const [sessionType, setSessionType] = useState<SessionType>('개인수업')
  const [date, setDate] = useState(formatDate(new Date()))
  const [time, setTime] = useState('10:00')
  const [instructor, setInstructor] = useState('')
  const [room, setRoom] = useState('A룸')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isGuest, setIsGuest] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [memo, setMemo] = useState('')

  // 임시 회원 목록
  const members: MemberOption[] = [
    { id: '1', name: '홍길동', phone: '01012345678' },
    { id: '2', name: '박민정', phone: '01087654321' },
    { id: '3', name: '이현우', phone: '01011112222' },
    { id: '4', name: '김지은', phone: '01033334444' },
    { id: '5', name: '박상훈', phone: '01055556666' },
    { id: '6', name: '정수민', phone: '01077778888' }
  ]

  // 임시 강사 목록
  const instructors = ['김코치', '이코치', '박코치', '최코치']

  // 수업 타입별 정원
  const capacityByType = {
    '인트로': 2,
    '개인수업': 1,
    '듀엣수업': 2,
    '그룹수업': 4
  }

  const maxCapacity = capacityByType[sessionType]

  // 회원 선택/해제
  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId))
    } else {
      if (selectedMembers.length < maxCapacity) {
        setSelectedMembers([...selectedMembers, memberId])
      } else {
        alert(`${sessionType}은 최대 ${maxCapacity}명까지 등록 가능합니다.`)
      }
    }
  }

  // 게스트 추가
  const addGuest = () => {
    if (!guestName || !guestPhone) {
      alert('게스트 이름과 전화번호를 입력해주세요.')
      return
    }

    if (selectedMembers.length >= maxCapacity) {
      alert(`${sessionType}은 최대 ${maxCapacity}명까지 등록 가능합니다.`)
      return
    }

    // 임시로 게스트 ID 생성
    const guestId = `guest_${Date.now()}`
    setSelectedMembers([...selectedMembers, guestId])
    
    alert(`게스트 ${guestName}님이 추가되었습니다.`)
    setGuestName('')
    setGuestPhone('')
    setIsGuest(false)
  }

  // 수업 생성
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!instructor) {
      alert('강사를 선택해주세요.')
      return
    }

    if (selectedMembers.length === 0) {
      alert('최소 1명 이상의 회원을 선택해주세요.')
      return
    }

    // 실제로는 API 호출
    console.log({
      sessionType,
      date,
      time,
      instructor,
      room,
      selectedMembers,
      memo
    })

    alert('수업이 생성되었습니다!')
    router.push('/sessions')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">수업 생성</h2>
        <p className="text-sm text-gray-500 mt-1">
          새로운 수업을 등록하고 회원을 배정하세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 수업 타입 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            수업 타입 *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['인트로', '개인수업', '듀엣수업', '그룹수업'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSessionType(type)
                  setSelectedMembers([]) // 타입 변경시 선택 초기화
                }}
                className={`
                  px-4 py-3 text-sm font-bold rounded-lg transition-all border-2
                  ${sessionType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                {type}
                <div className="text-xs mt-1 opacity-80">
                  (최대 {capacityByType[type]}명)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 날짜 & 시간 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                날짜 *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                시간 *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 강사 & 룸 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                강사 *
              </label>
              <select
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                {instructors.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                장소 *
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="A룸">A룸</option>
                <option value="B룸">B룸</option>
                <option value="C룸">C룸</option>
              </select>
            </div>
          </div>
        </div>

        {/* 회원 선택 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-bold text-gray-900">
              회원 선택 * ({selectedMembers.length}/{maxCapacity})
            </label>
            <button
              type="button"
              onClick={() => setIsGuest(!isGuest)}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              {isGuest ? '회원 목록 보기' : '+ 게스트 추가'}
            </button>
          </div>

          {/* 게스트 추가 폼 */}
          {isGuest && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    이름
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="게스트 이름"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={addGuest}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  게스트 추가
                </button>
              </div>
            </div>
          )}

          {/* 회원 목록 */}
          {!isGuest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {members.map(member => (
                <label
                  key={member.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedMembers.includes(member.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-blue-200'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {member.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.phone}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 메모 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-bold text-gray-900 mb-2">
            메모 (선택)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            placeholder="수업에 대한 추가 정보를 입력하세요"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            수업 생성
          </button>
        </div>
      </form>
    </div>
  )
}