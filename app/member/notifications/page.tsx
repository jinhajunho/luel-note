'use client'

import { useMemo, useState } from 'react'
import { Bell, CheckCircle2, XCircle } from 'lucide-react'

type Notification = {
  id: string
  title: string
  body?: string
  createdAt: string
  read: boolean
  type: 'lesson' | 'attendance' | 'notice'
}

const initialData: Notification[] = [
  { id: '1', title: '오늘 14:00 개인레슨 알림', createdAt: '2025-10-30 12:55', read: false, type: 'lesson' },
  { id: '2', title: '출석 완료 처리되었습니다', createdAt: '2025-10-29 16:35', read: true, type: 'attendance' },
  { id: '3', title: '11월 공휴일 휴무 안내', createdAt: '2025-10-28 09:00', read: true, type: 'notice' },
]

export default function MemberNotificationsPage() {
  const [items, setItems] = useState<Notification[]>(initialData)
  const unread = useMemo(() => items.filter(i => !i.read).length, [items])

  const markAll = () => setItems(prev => prev.map(i => ({ ...i, read: true })))
  const toggle = (id: string) => setItems(prev => prev.map(i => i.id === id ? ({ ...i, read: !i.read }) : i))
  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  return (
    <div className="px-5 py-6 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#1a1a1a]" />
          <h1 className="text-lg font-semibold text-[#1a1a1a]">알림</h1>
          {unread > 0 && <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">{unread}</span>}
        </div>
        <button onClick={markAll} className="text-sm text-blue-600">모두 읽음</button>
      </div>

      <div className="space-y-3">
        {items.map(n => (
          <div key={n.id} className={`bg-white border border-[#f0ebe1] rounded-xl p-4 flex items-start justify-between ${n.read ? '' : 'ring-1 ring-blue-100'}`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${n.type==='lesson' ? 'bg-purple-500' : n.type==='attendance' ? 'bg-green-600' : 'bg-gray-400'}`} />
                <span className={`text-sm ${n.read ? 'text-[#7a6f61]' : 'text-[#1a1a1a] font-semibold'}`}>{n.title}</span>
              </div>
              <div className="text-xs text-[#7a6f61]">{n.createdAt}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(n.id)} className="w-8 h-8 rounded-lg bg-gray-50 border border-[#e5dcc8] flex items-center justify-center" aria-label="읽음 토글">
                {n.read ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Bell className="w-4 h-4 text-blue-600" />}
              </button>
              <button onClick={() => remove(n.id)} className="w-8 h-8 rounded-lg bg-gray-50 border border-[#e5dcc8] flex items-center justify-center" aria-label="삭제">
                <XCircle className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center text-sm text-[#7a6f61] py-10">알림이 없습니다</div>
        )}
      </div>
    </div>
  )
}


