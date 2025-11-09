"use client"

import { useMemo, useState, useEffect, useCallback } from 'react'
import { getNotificationPreferences as fetchNotificationPrefs } from '@/app/actions/notification-preferences'
import { Bell, CheckCircle2, XCircle } from 'lucide-react'

type Notification = {
  id: string
  title: string
  message?: string | null
  createdAt: string | null
  read: boolean
  type: 'lesson' | 'attendance' | 'notice' | 'custom'
}

export default function NotificationsPopover() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [preferences, setPreferences] = useState({
    lesson: true,
    attendance: true,
    notice: true,
  })

  const isTypeEnabled = useCallback(
    (type: Notification['type']) => {
      if (type === 'lesson') return preferences.lesson
      if (type === 'attendance') return preferences.attendance
      if (type === 'notice') return preferences.notice
      return true
    },
    [preferences]
  )

  const visibleItems = useMemo(
    () => items.filter((item) => isTypeEnabled(item.type)),
    [items, isTypeEnabled]
  )

  const unread = useMemo(() => visibleItems.filter((i) => !i.read).length, [visibleItems])

  const formatTimestamp = useCallback((iso: string | null) => {
    if (!iso) return ''
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`알림을 불러오지 못했습니다. (${res.status})`)
      }
      const data = await res.json()
      const notifications: Notification[] = Array.isArray(data?.data)
        ? data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            message: item.message ?? null,
            createdAt: item.createdAt ?? null,
            read: Boolean(item.read),
            type: (item.type ?? 'custom') as Notification['type'],
          }))
        : []
      setItems(notifications)
    } catch (error) {
      console.error('알림 로드 실패:', error)
      setError('알림을 불러오는 중 문제가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let active = true
    const loadPrefs = async () => {
      try {
        const prefs = await fetchNotificationPrefs()
        if (!active) return
        setPreferences(prefs)
      } catch (error) {
        console.error('알림 설정 로드 실패:', error)
      } finally {
        // no-op
      }
    }
    loadPrefs()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('[data-popover-noti]')) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    function onNewNotice() {
      if (!preferences.notice) return
      load()
    }
    window.addEventListener('app:new-notice', onNewNotice as EventListener)
    return () => window.removeEventListener('app:new-notice', onNewNotice as EventListener)
  }, [load, preferences.notice])

  const markAll = useCallback(async () => {
    if (visibleItems.length === 0) return
    setPending(true)
    try {
      const res = await fetch('/api/notifications/mark-all', { method: 'POST' })
      if (!res.ok) {
        throw new Error(`전체 읽음 처리 실패 (${res.status})`)
      }
      setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch (error) {
      console.error('알림 전체 읽음 실패:', error)
      alert('알림을 전체 읽음으로 표시하지 못했습니다.')
    } finally {
      setPending(false)
    }
  }, [visibleItems.length])

  const toggle = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id)
      if (!target) return
      const next = !target.read
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: next } : item)))
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: next }),
        })
        if (!res.ok) {
          throw new Error(`알림 상태 변경 실패 (${res.status})`)
        }
      } catch (error) {
        console.error('알림 읽음 토글 실패:', error)
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: target.read } : item)))
        alert('알림 상태를 변경하지 못했습니다.')
      }
    },
    [items]
  )

  const remove = useCallback(
    async (id: string) => {
      const snapshot = items
      setItems((prev) => prev.filter((item) => item.id !== id))
      try {
        const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          throw new Error(`알림 삭제 실패 (${res.status})`)
        }
      } catch (error) {
        console.error('알림 삭제 실패:', error)
        alert('알림을 삭제하지 못했습니다.')
        setItems(snapshot)
      }
    },
    [items]
  )

  return (
    <div data-popover-noti className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="알림"
        className="relative w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unread > 0 && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-[#e5dcc8] rounded-xl shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#f0ebe1]">
            <div className="text-sm font-semibold text-[#1a1a1a]">
              알림
              {unread > 0 && (
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">{unread}</span>
              )}
            </div>
            <button
              onClick={markAll}
              disabled={unread === 0 || pending}
              className="text-xs text-blue-600 disabled:text-[#b8c4dd]"
            >
              모두 읽음
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-xs text-[#7a6f61]">알림을 불러오는 중…</div>
            ) : error ? (
              <div className="px-4 py-6 text-center text-xs text-red-600">{error}</div>
            ) : visibleItems.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#7a6f61]">알림이 없습니다</div>
            ) : (
              visibleItems.map((n) => (
                <div key={n.id} className={`px-4 py-3 flex items-start justify-between ${n.read ? '' : 'bg-[#fdfbf7]'}`}>
                  <div>
                    <div className={`text-sm ${n.read ? 'text-[#1a1a1a]' : 'font-semibold text-[#1a1a1a]'}`}>
                      {n.title}
                    </div>
                    {n.message && <div className="text-xs text-[#7a6f61] mt-1 whitespace-pre-line">{n.message}</div>}
                    <div className="text-xs text-[#7a6f61] mt-0.5">{formatTimestamp(n.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => toggle(n.id)}
                      className="w-7 h-7 rounded-lg bg-gray-50 border border-[#e5dcc8] flex items-center justify-center"
                      aria-label="읽음 토글"
                    >
                      {n.read ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Bell className="w-4 h-4 text-blue-600" />}
                    </button>
                    <button
                      onClick={() => remove(n.id)}
                      className="w-7 h-7 rounded-lg bg-gray-50 border border-[#e5dcc8] flex items-center justify-center"
                      aria-label="삭제"
                    >
                      <XCircle className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}


