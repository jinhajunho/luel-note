// components/common/DatePicker.tsx
'use client'

import { useState } from 'react'
import CalendarModal from './CalendarModal'

interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
}

export default function DatePicker({
  value,
  onChange,
  placeholder = '날짜를 선택하세요',
  disabled = false,
  className = '',
  label,
  required = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const weekday = weekdayNames[date.getDay()]
    return `${year}년 ${month}월 ${day}일 ${weekday}`
  }

  const handleDateSelect = (date: Date) => {
    onChange(date)
    setIsOpen(false)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left border border-gray-200 rounded-lg
          bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          transition-colors
          ${className}
        `}
        aria-label={label || '날짜 선택'}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value ? formatDate(value) : placeholder}
          </span>
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </button>

      <CalendarModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedDate={value}
        onSelectDate={handleDateSelect}
        title="날짜 선택"
      />
    </div>
  )
}
