"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { LessonTypeBadge } from '@/components/common/LessonBadges'
import StatusBadge from '@/components/common/StatusBadge'
import PopoverSelect, { PopoverOption } from '@/components/common/PopoverSelect'
import DatePicker from '@/components/common/DatePicker'
import CalendarModal from '@/components/common/CalendarModal'
import { getLessonTypes, getMaxMembersByTypeName } from '@/lib/utils/lesson-types'
import { addSystemLog } from '@/lib/utils/system-log'
import { useAuth } from '@/lib/auth-context'
import { getAllProfiles } from '@/app/actions/members'
import { getPaymentTypes } from '@/app/actions/payment-types'
import { formatInstructorName } from '@/lib/utils/text'
import { useRouter } from 'next/navigation'

interface Lesson {
  id: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  type: '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
  status: '예정' | '완료' | '취소'
  paymentType: string
  instructor?: string | null // 강사명
  instructorId?: string | null
  members: {
    memberId?: string | null
    name: string
    phone?: string | null
  }[]
}

interface Member {
  id: string
  name: string
  phone: string
}

export default function AdminClassesPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lessonTypeFilter, setLessonTypeFilter] = useState<string>('전체')
  const [instructorFilter, setInstructorFilter] = useState<string>('전체')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)
  
  // 레슨 타입 및 결제 유형 (동적 로드)
const [lessonTypes, setLessonTypes] = useState(getLessonTypes())
const [paymentTypes, setPaymentTypes] = useState<Array<{ id: string; name: string; color: string }>>([])
  
  // 레슨 등록 모달
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  // 모달이 열릴 때 배경 스크롤 막기 및 폼 초기화
  useEffect(() => {
    if (showRegisterModal) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      // 폼 초기화
      setRegisterForm({
        type: '' as '' | '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨',
        date: new Date(),
        startTime: '',
        endTime: '',
        paymentTypeId: '',
        paymentTypeName: '',
        instructorId: '',
        instructorName: '',
        selectedMembers: [],
        introGuest: { name: '', phone: '' }
      })
      setMemberSearchQuery('')
      
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [showRegisterModal])

  const [registerForm, setRegisterForm] = useState({
    type: '' as '' | '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨',
    date: new Date(),
    startTime: '',
    endTime: '',
  paymentTypeId: '',
  paymentTypeName: '',
  instructorId: '',
  instructorName: '',
  selectedMembers: [] as { memberId: string }[],
    introGuest: {
      name: '',
      phone: ''
    }
  })
  
  // 회원 목록 (전체 회원)
const [members, setMembers] = useState<Member[]>([])
const [memberSearchQuery, setMemberSearchQuery] = useState('')
const [instructors, setInstructors] = useState<Array<{ id: string; name: string }>>([])

  // 강사 필터 옵션
  const instructorOptions: PopoverOption[] = [
    { label: '전체', value: '전체' },
  ...instructors.map((instructor) => ({
    label: instructor.name,
    value: instructor.name,
  })),
  ]

const instructorSelectOptions: PopoverOption[] = instructors.map((instructor) => ({
  label: instructor.name,
  value: instructor.id,
}))

  // 레슨 데이터 로드 함수
  const loadLessons = async () => {
    try {
    const { getAllClasses } = await import('@/app/actions/classes')
    const result = await getAllClasses()
    if (result.success && result.data) {
      setLessons(result.data)
    } else {
      setLessons([])
    }
    } catch (error) {
      console.error('레슨 목록 로드 실패:', error)
      setLessons([])
    }
  }

  // 회원 데이터 로드 함수
  const loadMembers = async () => {
    try {
      const { getAllMembers } = await import('@/app/actions/members')
      const result = await getAllMembers()
      if (result.success && result.data) {
        const mapped: Member[] = result.data.map((member) => ({
          id: member.id,
          name: member.name,
          phone: member.phone,
        }))
        setMembers(mapped)
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error('회원 목록 로드 실패:', error)
      setMembers([])
    }
  }

  const loadPaymentTypesData = async () => {
    try {
      const types = await getPaymentTypes()
      const mapped = types.map((type) => ({
        id: type.id,
        name: type.name,
        color: type.color,
      }))
      setPaymentTypes(mapped)
    } catch (error) {
      console.error('결제 타입 로드 실패:', error)
      setPaymentTypes([])
    }
  }

  // 강사 목록 로드
  const loadInstructors = async () => {
    try {
      const result = await getAllProfiles()
      if (result.success && result.data) {
        const list = result.data
          .filter((p) => p.role === 'instructor' || p.role === 'admin')
          .map((p) => {
            const displayName = formatInstructorName(p.name) || p.name || ''
            return {
              id: p.id,
              name: displayName,
            }
          })
          .filter((item) => item.name)

        const unique = new Map<string, { id: string; name: string }>()
        list.forEach((item) => {
          if (!unique.has(item.id)) {
            unique.set(item.id, item)
          }
        })
        setInstructors(Array.from(unique.values()))
      } else {
        setInstructors([])
      }
    } catch (error) {
      console.error('강사 목록 로드 실패:', error)
      setInstructors([])
    }
  }

  // 실제 데이터 로드
  useEffect(() => {
    loadLessons()
    loadMembers()
    loadPaymentTypesData()
    loadInstructors()
  }, [])

  // 검색 및 필터링
  useEffect(() => {
    let filtered = [...lessons]

    // 날짜 필터
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    filtered = filtered.filter(lesson => lesson.date === dateStr)

    // 강사 필터
    if (instructorFilter && instructorFilter !== '전체') {
      filtered = filtered.filter(lesson => lesson.instructor === instructorFilter)
    }

    // 레슨유형 필터
    if (lessonTypeFilter && lessonTypeFilter !== '전체') {
      filtered = filtered.filter(lesson => lesson.type === lessonTypeFilter)
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lesson => {
        const memberMatch = lesson.members.some(m => m.name.toLowerCase().includes(query))
        const instructorMatch = lesson.instructor?.toLowerCase().includes(query) || false
        return memberMatch || instructorMatch
      })
    }

    // 날짜별 정렬
    filtered.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date)
      }
      return a.startTime.localeCompare(b.startTime)
    })

    setFilteredLessons(filtered)
  }, [searchQuery, lessons, lessonTypeFilter, instructorFilter, selectedDate])

  // 날짜별 그룹화
  const groupedLessons = filteredLessons.reduce((acc, lesson) => {
    if (!acc[lesson.date]) {
      acc[lesson.date] = []
    }
    acc[lesson.date].push(lesson)
    return acc
  }, {} as Record<string, Lesson[]>)

  // 레슨 유형별 인원 제한
  const getMaxMembers = (type: string) => {
    return getMaxMembersByTypeName(type, lessonTypes)
  }

  // 회원 검색 필터링
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    m.phone.includes(memberSearchQuery)
  )

  // 레슨 등록
  const handleRegisterLesson = async () => {
    if (
      !registerForm.type ||
      !registerForm.startTime ||
      !registerForm.endTime ||
      !registerForm.paymentTypeId ||
      !registerForm.instructorId
    ) {
      alert('모든 필수 항목을 입력해주세요')
      return
    }

    if (registerForm.type === '인트로') {
      if (!registerForm.introGuest.name || !registerForm.introGuest.phone) {
        alert('비회원 이름과 전화번호를 입력해주세요')
        return
      }
    } else {
      if (registerForm.selectedMembers.length === 0) {
        alert('회원을 선택해주세요')
        return
      }

      const maxMembers = getMaxMembers(registerForm.type)
      if (registerForm.selectedMembers.length > maxMembers) {
        alert(`${registerForm.type}은 최대 ${maxMembers}명까지 선택 가능합니다`)
        return
      }
    }

    try {
      const { createClass } = await import('@/app/actions/classes')
      const dateStr = `${registerForm.date.getFullYear()}-${String(registerForm.date.getMonth() + 1).padStart(2, '0')}-${String(registerForm.date.getDate()).padStart(2, '0')}`
      const memberIds =
        registerForm.type === '인트로'
          ? []
          : registerForm.selectedMembers.map((m) => m.memberId)
      const introGuests =
        registerForm.type === '인트로'
          ? [
              {
                name: registerForm.introGuest.name.trim(),
                phone: registerForm.introGuest.phone.trim(),
              },
            ]
          : undefined
 
      const result = await createClass({
        classTypeName: registerForm.type,
        date: dateStr,
        startTime: registerForm.startTime,
        endTime: registerForm.endTime,
        paymentTypeId: registerForm.paymentTypeId,
        paymentTypeName: registerForm.paymentTypeName,
        instructorId: registerForm.instructorId,
        memberIds,
        introGuests,
      })

      if (!result.success) {
        alert(result.error || '레슨 등록에 실패했습니다')
        return
      }

      router.refresh()
      await loadLessons()

      const createdLesson = result.data
      const memberNames =
        createdLesson && createdLesson.members.length > 0
          ? createdLesson.members.map((m) => m.name).filter(Boolean).join(', ')
          : registerForm.type === '인트로'
            ? registerForm.introGuest.name
            : '없음'

      addSystemLog({
        type: 'data_change',
        user: profile?.name || '관리자',
        action: '레슨 등록',
        details: `날짜: ${createdLesson?.date ?? dateStr}, 시간: ${createdLesson?.startTime ?? registerForm.startTime}-${createdLesson?.endTime ?? registerForm.endTime}, 강사: ${(createdLesson?.instructor ?? registerForm.instructorName) || '미지정'}, 회원: ${memberNames || '없음'}. ${registerForm.type} 레슨이 등록되었습니다.`,
      })

      setShowRegisterModal(false)
      setRegisterForm({
        type: '',
        date: new Date(),
        startTime: '',
        endTime: '',
        paymentTypeId: '',
        paymentTypeName: '',
        instructorId: '',
        instructorName: '',
        selectedMembers: [],
        introGuest: { name: '', phone: '' },
      })
      setMemberSearchQuery('')
      alert('레슨이 등록되었습니다')
    } catch (error) {
      console.error('레슨 등록 실패:', error)
      alert('레슨 등록 중 오류가 발생했습니다')
    }
  }

  // 회원 선택 토글
  const toggleMemberSelection = (memberId: string) => {
    if (registerForm.type === '인트로') return
    
    const maxMembers = getMaxMembers(registerForm.type)
    const isSelected = registerForm.selectedMembers.some(m => m.memberId === memberId)
    
    if (isSelected) {
      setRegisterForm(prev => ({
        ...prev,
        selectedMembers: prev.selectedMembers.filter(m => m.memberId !== memberId)
      }))
    } else {
      if (registerForm.selectedMembers.length >= maxMembers) {
        alert(`${registerForm.type}은 최대 ${maxMembers}명까지 선택 가능합니다`)
        return
      }
      setRegisterForm(prev => ({
        ...prev,
        selectedMembers: [...prev.selectedMembers, { memberId }]
      }))
    }
  }

  // 시간 옵션 (시/분 분리)
  const hourOptions: PopoverOption[] = Array.from({ length: 23 - 6 + 1 }, (_, i) => {
    const h = String(6 + i).padStart(2, '0')
    return { label: `${h}시`, value: h }
  })
  const minuteOptions: PopoverOption[] = ['00','10','20','30','40','50'].map(m => ({ label: `${m}분`, value: m }))

  const getTimeParts = (t: string): { h: string; m: string } => {
    if (!t || !t.includes(':')) return { h: '', m: '' }
    const [h, m] = t.split(':')
    return { h, m }
  }
  const setStartTime = (h?: string, m?: string) => {
    const curH = getTimeParts(registerForm.startTime).h
    const curM = getTimeParts(registerForm.startTime).m
    const hour = (h ?? curH) || '06'
    const min = (m ?? curM) || '00'
    setRegisterForm(prev => ({ ...prev, startTime: `${hour}:${min}` }))
  }
  const setEndTime = (h?: string, m?: string) => {
    const curH = getTimeParts(registerForm.endTime).h
    const curM = getTimeParts(registerForm.endTime).m
    const hour = (h ?? curH) || '07'
    const min = (m ?? curM) || '00'
    setRegisterForm(prev => ({ ...prev, endTime: `${hour}:${min}` }))
  }

  const formatDateString = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    return `${year}년 ${month}월 ${day}일 (${weekday})`
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const weekday = weekdayNames[d.getDay()]
    return `${year}년 ${month}월 ${day}일 ${weekday}`
  }
  
  const changeDate = (delta: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + delta)
    setSelectedDate(newDate)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setCalendarModalOpen(false)
  }

  const formatModalTitle = (dateStr: string, startTime: string, endTime: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    return `${year}년 ${month}월 ${day}일 (${weekday}) ${startTime} - ${endTime}`
  }

  const openModal = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    document.body.style.overflow = "hidden"
  }

  const closeModal = () => {
    setSelectedLesson(null)
    document.body.style.overflow = ""
  }

  // 레슨이 있는 날짜 목록 생성
  const lessonDates = Array.from(new Set(lessons.map(l => l.date))).map(d => new Date(d))

  return (
    <div className="pb-24 overflow-x-hidden">
      {/* 날짜 선택기 */}
      <div className="bg-white border-x-0 border-t border-[#f0ebe1] border-b border-[#f0ebe1] rounded-none px-4 py-2 shadow-sm min-h-[56px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => changeDate(-1)}
            className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCalendarModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>{formatDate(selectedDate)}</span>
            <Calendar className="w-4 h-4 text-[#7a6f61]" />
          </button>
          <button
            onClick={() => changeDate(1)}
            className="w-8 h-8 border border-[#f0ebe1] bg-white rounded-lg flex items-center justify-center text-[#7a6f61] hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 강사 필터 */}
      <div className="bg-white border-b border-[#f0ebe1] px-5 py-4">
        <PopoverSelect
          label="강사 필터"
          value={instructorFilter}
          onChange={(value) => setInstructorFilter(value)}
          options={instructorOptions}
        />
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* 레슨유형 드롭다운과 검색창 */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <PopoverSelect
              label="수업유형"
              value={lessonTypeFilter}
              onChange={(value) => setLessonTypeFilter(value)}
              options={[
                { label: '전체', value: '전체', colorDot: 'bg-gray-400' },
                { label: '인트로', value: '인트로', colorDot: 'bg-gray-500' },
                { label: '개인레슨', value: '개인레슨', colorDot: 'bg-purple-500' },
                { label: '듀엣레슨', value: '듀엣레슨', colorDot: 'bg-pink-500' },
                { label: '그룹레슨', value: '그룹레슨', colorDot: 'bg-orange-500' }
              ]}
            />
          </div>
          <div className="flex-1">
            <div className="bg-white border border-[#f0ebe1] rounded-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="회원명으로 검색"
                className="w-full px-4 py-3 border-0 bg-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 레슨 등록 버튼 */}
        <button
          onClick={() => setShowRegisterModal(true)}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          + 레슨 등록
        </button>

        {/* 레슨 목록 */}
        <div className="space-y-6">
          {Object.keys(groupedLessons).length === 0 ? (
            <div className="bg-white border border-[#f0ebe1] rounded-lg p-12 text-center">
              <div className="text-5xl mb-4">📚</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '등록된 레슨이 없습니다'}
              </div>
            </div>
          ) : (
            Object.entries(groupedLessons).map(([date, dateLessons]) => (
              <div key={date}>
                <div className="text-sm font-semibold text-[#7a6f61] mb-3 px-1">
                  {formatDate(date)}
                </div>
                <div className="space-y-3">
                  {dateLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={() => openModal(lesson)}
                      className="bg-white border border-[#f0ebe1] rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-semibold text-[#1a1a1a]">
                          {lesson.startTime} - {lesson.endTime}
                        </span>
                        <LessonTypeBadge type={lesson.type} />
                      </div>
                      {lesson.instructor && (
                        <div className="text-sm text-[#7a6f61] mb-2">
                          강사: {lesson.instructor}
                        </div>
                      )}
                      {lesson.members.length > 0 && (
                        <div className="text-sm text-[#7a6f61]">
                          참여 회원: {lesson.members.map(m => m.name).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 레슨 등록 모달 */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRegisterModal(false)
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <h2 className="text-lg font-semibold text-gray-900">레슨 등록</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4 relative">
              {/* 강사 선택 */}
              <PopoverSelect
                label="강사"
                value={registerForm.instructorId}
                onChange={(value) => {
                  const instructor = instructors.find((item) => item.id === value)
                  setRegisterForm((prev) => ({
                    ...prev,
                    instructorId: value,
                    instructorName: instructor?.name ?? '',
                  }))
                }}
                options={[
                  { label: '강사를 선택하세요', value: '' },
                  ...instructorSelectOptions,
                ]}
              />

              {/* 수업 유형 선택 */}
              <PopoverSelect
                label="수업 유형"
                value={registerForm.type || ''}
                onChange={(value) => setRegisterForm(prev => ({ ...prev, type: value as any, selectedMembers: [] }))}
                options={[
                  { label: '선택하세요', value: '' },
                  ...lessonTypes.filter(lt => lt.active).map(lt => ({
                    label: lt.name,
                    value: lt.name
                  }))
                ]}
              />

              {/* 날짜 선택 */}
              <DatePicker
                label="날짜"
                value={registerForm.date}
                onChange={(date) => setRegisterForm(prev => ({ ...prev, date }))}
                placeholder="날짜를 선택하세요"
              />

              {/* 시작/종료 시간 선택 (시/분 분리) */}
              <div>
                <label className="block text-sm font-medium text-[#7a6f61] mb-2">시간</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <PopoverSelect
                      label="시"
                      value={getTimeParts(registerForm.startTime).h}
                      onChange={(value) => setStartTime(String(value))}
                      options={hourOptions}
                    />
                    <PopoverSelect
                      label="분"
                      value={getTimeParts(registerForm.startTime).m}
                      onChange={(value) => setStartTime(undefined, String(value))}
                      options={minuteOptions}
                    />
                  </div>
                  <span className="text-lg font-semibold text-[#7a6f61] py-2">~</span>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <PopoverSelect
                      label="시"
                      value={getTimeParts(registerForm.endTime).h}
                      onChange={(value) => setEndTime(String(value))}
                      options={hourOptions}
                    />
                    <PopoverSelect
                      label="분"
                      value={getTimeParts(registerForm.endTime).m}
                      onChange={(value) => setEndTime(undefined, String(value))}
                      options={minuteOptions}
                    />
                  </div>
                </div>
              </div>

              {/* 결제 타입 선택 */}
              <PopoverSelect
                label="결제유형"
                value={registerForm.paymentTypeId}
                onChange={(value) => {
                  const selected = paymentTypes.find((pt) => pt.id === value)
                  setRegisterForm((prev) => ({
                    ...prev,
                    paymentTypeId: value,
                    paymentTypeName: selected?.name ?? '',
                  }))
                }}
                options={[
                  { label: '선택하세요', value: '' },
                  ...paymentTypes.map((pt) => ({
                    label: pt.name,
                    value: pt.id,
                    colorDot:
                      pt.color === 'gray' ? 'bg-gray-400' :
                      pt.color === 'purple' ? 'bg-purple-500' :
                      pt.color === 'pink' ? 'bg-pink-500' :
                      pt.color === 'orange' ? 'bg-orange-500' :
                      pt.color === 'blue' ? 'bg-blue-500' :
                      pt.color === 'green' ? 'bg-green-500' :
                      pt.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-red-500'
                  }))
                ]}
              />

              {/* 인트로 비회원 정보 입력 */}
              {registerForm.type === '인트로' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#7a6f61] mb-2">비회원 이름</label>
                    <input
                      type="text"
                      value={registerForm.introGuest.name}
                      onChange={(e) => setRegisterForm(prev => ({
                        ...prev,
                        introGuest: { ...prev.introGuest, name: e.target.value }
                      }))}
                      placeholder="이름을 입력하세요"
                      className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#7a6f61] mb-2">비회원 전화번호</label>
                    <input
                      type="tel"
                      value={registerForm.introGuest.phone}
                      onChange={(e) => setRegisterForm(prev => ({
                        ...prev,
                        introGuest: { ...prev.introGuest, phone: e.target.value }
                      }))}
                      placeholder="전화번호를 입력하세요"
                      className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 회원 선택 */}
              {registerForm.type !== '인트로' && registerForm.type !== '' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#7a6f61]">회원 선택</label>
                    <span className="text-xs text-[#7a6f61]">
                      {registerForm.selectedMembers.length}/{getMaxMembers(registerForm.type)}명
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="회원 이름 또는 전화번호 검색"
                      className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:border-blue-600 bg-white"
                    />
                  </div>

                  <div className="border border-[#f0ebe1] rounded-lg max-h-[200px] overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-[#7a6f61]">검색 결과가 없습니다</div>
                    ) : (
                      filteredMembers.map((member) => {
                        const isSelected = registerForm.selectedMembers.some(m => m.memberId === member.id)
                        const isDisabled = !isSelected && registerForm.selectedMembers.length >= getMaxMembers(registerForm.type)
                        
                        return (
                          <label
                            key={member.id}
                            className={`flex items-center gap-3 p-3 border-b border-[#f0ebe1] last:border-b-0 cursor-pointer hover:bg-[#fdfbf7] transition-colors ${
                              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMemberSelection(member.id)}
                              disabled={isDisabled}
                              className="w-5 h-5 text-blue-600 border-[#f0ebe1] rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-[#1a1a1a]">{member.name}</div>
                              <div className="text-xs text-[#7a6f61]">{member.phone}</div>
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#f0ebe1]">
              <button
                onClick={handleRegisterLesson}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 레슨 상세 모달 */}
      {selectedLesson && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <h2 className="text-lg font-semibold text-gray-900">
                {formatModalTitle(selectedLesson.date, selectedLesson.startTime, selectedLesson.endTime)}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <LessonTypeBadge type={selectedLesson.type} />
                {selectedLesson.instructor && (
                  <span className="text-sm text-[#7a6f61]">강사: {selectedLesson.instructor}</span>
                )}
              </div>

              {selectedLesson.members.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-[#1a1a1a] mb-3">참여 회원</h4>
                  <div className="space-y-2">
                    {selectedLesson.members.map((member, idx) => (
                      <div
                        key={member.memberId || idx}
                        className="flex items-center justify-between p-3 border border-[#f0ebe1] rounded-lg bg-white"
                      >
                        <div>
                          <div className="text-[#1a1a1a] font-medium">{member.name}</div>
                          {member.phone && (
                            <div className="text-xs text-[#7a6f61] mt-0.5">{member.phone}</div>
                          )}
                        </div>
                        <StatusBadge type="payment" value={selectedLesson.paymentType as any} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#7a6f61]">
                  <p className="text-sm">참여 회원이 없습니다</p>
                </div>
              )}

              {selectedLesson.status === '예정' && (
                <div className="pt-4 border-t border-[#f0ebe1]">
                  <button
                    onClick={() => {
                      if (!selectedLesson) return
                      if (!confirm('이 레슨을 삭제하시겠습니까?')) return
                      ;(async () => {
                        try {
                          const { deleteClass } = await import('@/app/actions/classes')
                          const result = await deleteClass(selectedLesson.id)
                          if (!result.success) {
                            alert(result.error || '레슨 삭제에 실패했습니다')
                            return
                          }
                      router.refresh()
                      await loadLessons()
                          closeModal()
                          alert('레슨이 삭제되었습니다')
                        } catch (error) {
                          console.error('레슨 삭제 실패:', error)
                          alert('레슨 삭제 중 오류가 발생했습니다')
                        }
                      })()
                    }}
                    className="w-full py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 캘린더 모달 */}
      <CalendarModal
        isOpen={calendarModalOpen}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        onClose={() => setCalendarModalOpen(false)}
        lessonDates={lessonDates.map(d => d.toISOString().split('T')[0])}
        title="날짜 선택"
      />
    </div>
  )
}