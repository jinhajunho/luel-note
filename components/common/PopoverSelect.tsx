"use client"

import { useEffect, useState, useRef } from 'react'

export type PopoverOption = {
  label: string
  value: string
  colorDot?: string // tailwind color class e.g. 'bg-purple-500'
}

type Props = {
  label: string
  value: string
  options: PopoverOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

export default function PopoverSelect({ label, value, options, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 다른 PopoverSelect가 열릴 때 이 드롭다운 닫기
  useEffect(() => {
    const handleCloseOther = () => {
      setOpen(false)
    }
    document.addEventListener('popover-select-open', handleCloseOther)
    return () => document.removeEventListener('popover-select-open', handleCloseOther)
  }, [])

  // 드롭다운 열기/닫기
  const handleToggle = () => {
    if (!disabled) {
      const newOpen = !open
      if (newOpen) {
        // 다른 모든 드롭다운 닫기
        document.dispatchEvent(new CustomEvent('popover-select-open'))
      }
      setOpen(newOpen)
    }
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('[data-popover-select]')) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', onDoc)
      return () => document.removeEventListener('mousedown', onDoc)
    }
  }, [open])

  // 드롭다운이 열릴 때 스크롤 위치 조정
  useEffect(() => {
    if (open && containerRef.current) {
      const button = containerRef.current.querySelector('button') as HTMLElement
      if (button) {
        // 드롭다운이 화면 아래로 가려지는지 확인
        const rect = button.getBoundingClientRect()
        const dropdownHeight = 200 // max-h-[200px]
        const spaceBelow = window.innerHeight - rect.bottom
        
        if (spaceBelow < dropdownHeight) {
          // 스크롤 가능한 부모 찾기 (모달 내부 스크롤 컨테이너)
          let scrollableParent: HTMLElement | null = null
          let current: HTMLElement | null = button.parentElement
          
          while (current && current !== document.body) {
            const style = window.getComputedStyle(current)
            if (style.overflowY === 'auto' || style.overflow === 'auto' || style.overflowY === 'scroll' || style.overflow === 'scroll') {
              scrollableParent = current
              break
            }
            current = current.parentElement
          }
          
          if (scrollableParent) {
            // 드롭다운이 완전히 보이도록 스크롤 조정
            setTimeout(() => {
              const buttonRect = button.getBoundingClientRect()
              const dropdownBottom = buttonRect.bottom + dropdownHeight
              const parentRect = scrollableParent!.getBoundingClientRect()
              const availableSpace = parentRect.bottom - buttonRect.top
              
              if (dropdownBottom > parentRect.bottom) {
                const scrollAmount = dropdownBottom - parentRect.bottom + 20 // 20px 여유
                scrollableParent!.scrollBy({
                  top: scrollAmount,
                  behavior: 'smooth'
                })
              }
            }, 50)
          }
        }
      }
    }
  }, [open])

  const currentLabel = options.find(o => o.value === value)?.label ?? value

  return (
    <div ref={containerRef} data-popover-select className="relative">
      <div className="text-[11px] uppercase tracking-wider text-[#7a6f61] mb-1 font-semibold">{label}</div>
      <button 
        onClick={handleToggle} 
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#e5dcc8] shadow-sm hover:border-[#d4c9b5] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="text-sm text-[#1a1a1a] whitespace-nowrap">{currentLabel}</span>
        <svg className="w-4 h-4 text-[#7a6f61] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
      </button>
      {open && (
        <div 
          className="absolute z-[3000] mt-2 w-full bg-white border border-[#e5dcc8] rounded-xl shadow-lg overflow-hidden max-h-[200px] overflow-y-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {options.map(opt => (
            <button 
              key={opt.value} 
              onClick={(e) => {
                e.stopPropagation()
                onChange(opt.value)
                setOpen(false)
              }} 
              className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-[#fdfbf7] whitespace-nowrap"
            >
              {opt.colorDot && <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.colorDot}`} />}
              <span className="text-[#1a1a1a]">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


