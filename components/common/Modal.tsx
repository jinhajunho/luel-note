// components/common/Modal.tsx
'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && event.target === modalRef.current) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/50 animate-in fade-in duration-200"
    >
      <div
        className={`bg-white rounded-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300 ${className}`}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="닫기"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* 모달 바디 */}
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  )
}
