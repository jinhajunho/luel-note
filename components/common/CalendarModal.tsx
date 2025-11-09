// components/common/CalendarModal.tsx
'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'

interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  onSelectDate: (date: Date) => void
  lessonDates?: string[] // YYYY-MM-DD 형식
  title?: string
}

export default function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  lessonDates = [],
  title = '날짜 선택'
}: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)

  useEffect(() => {
    setCurrentMonth(selectedDate)
  }, [selectedDate])

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
    const isToday = date.getTime() === today.getTime()
    const isSelected = date.getTime() === selected.getTime()
    const hasLesson = lessonDates.includes(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    )

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`
          h-10 w-10 rounded-lg text-sm font-medium transition-colors relative
          ${isSelected
            ? 'bg-blue-600 text-white'
            : isToday
            ? 'bg-blue-100 text-blue-900 font-semibold'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        aria-label={`${year}년 ${month + 1}월 ${day}일`}
      >
        {day}
        {hasLesson && (
          <div className={`
            absolute bottom-1 left-1/2 transform -translate-x-1/2
            w-1 h-1 rounded-full
            ${isSelected ? 'bg-white' : 'bg-gray-900'}
          `} />
        )}
      </button>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeMonth(-1)}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:border-gray-900 hover:text-gray-900 text-gray-600 transition-colors"
            aria-label="이전 달"
          >
            ←
          </button>
          <div className="font-semibold text-gray-900">
            {year}년 {month + 1}월
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:border-gray-900 hover:text-gray-900 text-gray-600 transition-colors"
            aria-label="다음 달"
          >
            →
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((day, i) => (
            <div
              key={day}
              className={`
                text-center text-xs font-semibold py-2
                ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}
              `}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    </Modal>
  )
}

