"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { formatPhone } from '@/lib/auth-helpers'
import AdminSettingsModal from '@/components/common/AdminSettingsModal'
import {
  getNotificationPreferences as fetchNotificationPrefs,
  updateNotificationPreferences as persistNotificationPrefs,
} from '@/app/actions/notification-preferences'
import { usePathname, useRouter } from 'next/navigation'
import { addSystemLog } from '@/lib/utils/system-log'
import { updateEmail } from '@/app/actions/profile'

type MenuKey = 'notices' | 'profile' | 'notifications'

type NoticeItem = {
  id: string
  title: string
  content: string
  authorName?: string | null
  createdAt?: string | null
}

export default function ProfileMenuPopover() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<MenuKey | null>(null)
  const [showAdminSettings, setShowAdminSettings] = useState(false)
  const [lessonToggle, setLessonToggle] = useState<boolean>(true)
  const [attendanceToggle, setAttendanceToggle] = useState<boolean>(true)
  const [noticeToggle, setNoticeToggle] = useState<boolean>(true)
  const [notificationLoading, setNotificationLoading] = useState(true)
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)

  const [notices, setNotices] = useState<NoticeItem[]>([])
  const [noticesLoading, setNoticesLoading] = useState(false)
  const [noticesError, setNoticesError] = useState<string | null>(null)
  const [savingNotice, setSavingNotice] = useState(false)
  const [deleteInFlight, setDeleteInFlight] = useState<string | null>(null)
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' })

  const { profile, user, refreshProfile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const router = useRouter()
  const pathname = usePathname()
  const isAdminContext = pathname?.startsWith('/admin') ?? false
  const isAdminView = isAdmin && isAdminContext
  const [currentEmail, setCurrentEmail] = useState(user?.email ?? '')
  const [emailInput, setEmailInput] = useState(user?.email ?? '')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSaving, setEmailSaving] = useState(false)

  useEffect(() => {
    if (!isAdminView && showAdminSettings) {
      setShowAdminSettings(false)
    }
  }, [isAdminView, showAdminSettings])

  useEffect(() => {
    let active = true
    const loadPreferences = async () => {
      try {
        setNotificationLoading(true)
        setNotificationError(null)
        const prefs = await fetchNotificationPrefs()
        if (!active) return
        setLessonToggle(prefs.lesson)
        setAttendanceToggle(prefs.attendance)
        setNoticeToggle(prefs.notice)
      } catch (error) {
        console.error('알림 설정 로드 실패:', error)
        if (active) {
          setNotificationError('알림 설정을 불러오는 중 문제가 발생했습니다.')
        }
      } finally {
        if (active) {
          setNotificationLoading(false)
        }
      }
    }

    loadPreferences()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const nextEmail = user?.email ?? ''
    setCurrentEmail(nextEmail)
    setEmailInput(nextEmail)
  }, [user?.email])

  useEffect(() => {
    if (modal !== 'profile') {
      setEmailError(null)
      setEmailSaving(false)
    }
  }, [modal])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('[data-popover-profile]')) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const formattedNotices = useMemo(() => {
    return notices.map((notice) => {
      if (!notice.createdAt) return { ...notice, createdAtLabel: '' }
      const date = new Date(notice.createdAt)
      if (Number.isNaN(date.getTime())) {
        return { ...notice, createdAtLabel: '' }
      }
      const formatter = new Intl.DateTimeFormat('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
      return {
        ...notice,
        createdAtLabel: formatter.format(date),
      }
    })
  }, [notices])

  const fetchNotices = useCallback(async () => {
    try {
      setNoticesLoading(true)
      setNoticesError(null)
      const res = await fetch('/api/notices', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`failed to load notices (${res.status})`)
      }
      const data = await res.json()
      setNotices(Array.isArray(data?.data) ? data.data : [])
    } catch (error) {
      console.error('공지 목록 로드 실패:', error)
      setNoticesError('공지사항을 불러오는 중 문제가 발생했습니다.')
    } finally {
      setNoticesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotices()
  }, [fetchNotices])

  const handleCreateNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }
    try {
      setSavingNotice(true)
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noticeForm.title.trim(),
          content: noticeForm.content.trim(),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = body?.error || '공지사항을 저장하는 중 문제가 발생했습니다.'
        alert(message)
        return
      }
      const title = noticeForm.title.trim()
      setNoticeForm({ title: '', content: '' })
      fetchNotices()
      addSystemLog({
        type: 'data_change',
        user: profile?.name || '관리자',
        action: '공지사항 등록',
        details: `제목: ${title}. 공지사항이 등록되었습니다.`
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('app:new-notice', {
            detail: { title },
          })
        )
      }
    } catch (error) {
      console.error('공지 저장 실패:', error)
      alert('공지사항을 저장하는 중 문제가 발생했습니다.')
    } finally {
      setSavingNotice(false)
    }
  }

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) {
      return
    }
    try {
      setDeleteInFlight(id)
      const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = body?.error || '공지사항을 삭제하는 중 문제가 발생했습니다.'
        alert(message)
        return
      }
      fetchNotices()
      addSystemLog({
        type: 'data_change',
        user: profile?.name || '관리자',
        action: '공지사항 삭제',
        details: `공지 ID: ${id}. 공지사항이 삭제되었습니다.`
      })
    } catch (error) {
      console.error('공지 삭제 실패:', error)
      alert('공지사항을 삭제하는 중 문제가 발생했습니다.')
    } finally {
      setDeleteInFlight(null)
    }
  }

  const noticesEmpty = !noticesLoading && formattedNotices.length === 0

  return (
    <div data-popover-profile className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="프로필"
        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-300"
      >
        {profile?.name?.slice(0, 1) || 'U'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e5dcc8] rounded-xl shadow-lg overflow-hidden z-50">
          <button onClick={() => { setOpen(false); setModal('notices') }} className="w-full px-4 py-3 text-sm text-left hover:bg-[#fdfbf7] text-[#1a1a1a]">공지사항</button>
          <button onClick={() => { setOpen(false); setModal('profile') }} className="w-full px-4 py-3 text-sm text-left hover:bg-[#fdfbf7] text-[#1a1a1a]">프로필 정보</button>
          <button onClick={() => { setOpen(false); setModal('notifications') }} className="w-full px-4 py-3 text-sm text-left hover:bg-[#fdfbf7] text-[#1a1a1a]">알림설정</button>
          <div className="h-px bg-[#f0ebe1] my-1" />
          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/signout', { method: 'POST' })
              } catch (error) {
                console.error('로그아웃 요청 실패:', error)
              }
              router.push('/login')
            }}
            className="w-full px-4 py-3 text-sm text-left hover:bg-[#fef2f2] text-red-600"
          >
            로그아웃
          </button>
        </div>
      )}

      {/* 공지사항 모달 */}
      {modal === 'notices' && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-5"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setModal(null)
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <div className="text-base font-semibold text-[#1a1a1a] flex items-center gap-2">
                <span>공지사항</span>
                {isAdminView && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    관리자 전용
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModal(null)}
                  aria-label="닫기"
                  className="w-8 h-8 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {isAdminView && (
              <div className="px-4 pt-4 pb-1 border-b border-[#f0ebe1]">
                <form className="space-y-3" onSubmit={handleCreateNotice}>
                  <input
                    name="notice-title"
                    type="text"
                    placeholder="제목을 입력하세요"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={savingNotice}
                  />
                  <textarea
                    name="notice-content"
                    placeholder="내용을 입력하세요"
                    rows={4}
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm((prev) => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={savingNotice}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNoticeForm({ title: '', content: '' })}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-[#1a1a1a] rounded-lg transition-colors disabled:opacity-60"
                      disabled={savingNotice}
                    >
                      초기화
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60"
                      disabled={savingNotice}
                    >
                      {savingNotice ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="p-4 flex-1 overflow-y-auto">
              {noticesLoading ? (
                <div className="text-sm text-[#7a6f61]">공지사항을 불러오는 중...</div>
              ) : noticesError ? (
                <div className="text-sm text-red-600">{noticesError}</div>
              ) : noticesEmpty ? (
                <div className="rounded-lg bg-[#fdfbf7] border border-[#f0ebe1] px-3 py-6 text-sm text-center text-[#7a6f61]">
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {formattedNotices.map((notice) => (
                    <div key={notice.id} className="bg-[#fdfbf7] border border-[#f0ebe1] rounded-xl p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-[#1a1a1a] mb-1">{notice.title}</div>
                          <div className="text-xs text-[#7a6f61]">
                            {notice.createdAtLabel || ''}
                            {notice.authorName ? ` · ${notice.authorName}` : ''}
                          </div>
                        </div>
                        {isAdminView && (
                          <button
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                            disabled={deleteInFlight === notice.id}
                          >
                            {deleteInFlight === notice.id ? '삭제 중...' : '삭제'}
                          </button>
                        )}
                      </div>
                      <div className="text-[#7a6f61] whitespace-pre-line">{notice.content}</div>
                    </div>
                  ))}
                </div>
              )}
              {!isAdminView && !noticesLoading && formattedNotices.length > 0 && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 mt-3 text-xs text-blue-700">
                  새로운 공지는 관리자 계정에서 등록할 수 있습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modal === 'profile' && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-5"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setModal(null)
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <div className="text-base font-semibold text-[#1a1a1a]">프로필 정보</div>
              <button onClick={() => setModal(null)} aria-label="닫기" className="w-8 h-8 rounded-lg hover:bg-gray-100">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#7a6f61] mb-1">이름</label>
                  <div className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm bg-gray-50 text-gray-900 min-h-[40px] flex items-center">
                    {profile?.name ?? '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#7a6f61] mb-1">연락처</label>
                  <div className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm bg-gray-50 text-gray-900 min-h-[40px] flex items-center">
                    {profile?.phone ? formatPhone(profile.phone) : '—'}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-[#7a6f61] mb-1">현재 이메일</label>
                  <div className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm bg-gray-50 text-gray-900 min-h-[40px] flex items-center">
                    {currentEmail || '—'}
                  </div>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const trimmed = emailInput.trim()
                  if (!trimmed) {
                    setEmailError('새 이메일을 입력해주세요.')
                    return
                  }
                  setEmailError(null)
                  setEmailSaving(true)
                  try {
                    const result = await updateEmail(trimmed)
                    if (!result.success) {
                      setEmailError(result.error)
                      return
                    }
                    setCurrentEmail(result.email)
                    setEmailInput(result.email)
                    await refreshProfile()
                    alert('이메일이 저장되었습니다')
                    setModal(null)
                  } catch (error) {
                    console.error('이메일 저장 실패:', error)
                    setEmailError('이메일을 저장하는 중 문제가 발생했습니다.')
                  } finally {
                    setEmailSaving(false)
                  }
                }}
                className="space-y-3"
              >
                <div className="text-sm font-semibold text-[#1a1a1a]">이메일 변경</div>
                <input
                  name="email"
                  type="email"
                  placeholder="새 이메일"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    emailError ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-[#f0ebe1] focus:border-blue-600 focus:ring-blue-200'
                  }`}
                  disabled={emailSaving}
                />
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                <button
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-60"
                  disabled={emailSaving}
                >
                  {emailSaving ? '저장 중...' : '이메일 저장'}
                </button>
              </form>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  alert('비밀번호가 저장되었습니다')
                  setModal(null)
                }}
                className="space-y-3"
              >
                <div className="text-sm font-semibold text-[#1a1a1a]">비밀번호 변경</div>
                <input name="current" type="password" placeholder="현재 비밀번호" className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm" />
                <input name="new" type="password" placeholder="새 비밀번호 (6자 이상)" className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm" />
                <input name="confirm" type="password" placeholder="새 비밀번호 확인" className="w-full px-3 py-2 border border-[#f0ebe1] rounded-lg text-sm" />
                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">비밀번호 저장</button>
              </form>

              {isAdminView && (
                <div className="pt-4 border-t border-[#f0ebe1]">
                  <button
                    onClick={() => setShowAdminSettings(true)}
                    className="w-full py-2.5 border border-blue-600 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors text-left px-3 flex items-center justify-between"
                  >
                    <span>관리자 설정</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAdminView && showAdminSettings && <AdminSettingsModal onClose={() => setShowAdminSettings(false)} />}

      {modal === 'notifications' && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-5"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setModal(null)
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#f0ebe1]">
              <div className="text-base font-semibold text-[#1a1a1a]">알림 설정</div>
              <button onClick={() => setModal(null)} aria-label="닫기" className="w-8 h-8 rounded-lg hover:bg-gray-100">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              {notificationError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {notificationError}
                </div>
              )}
              {notificationLoading && (
                <div className="text-xs text-[#7a6f61] bg-[#fdfbf7] border border-[#f0ebe1] rounded-lg px-3 py-2">
                  알림 설정을 불러오는 중입니다...
                </div>
              )}
              <label className="flex items-center justify-between py-2">
                <span className="text-sm text-[#1a1a1a]">레슨 알림</span>
                <button
                  onClick={() => setLessonToggle((v) => !v)}
                  aria-pressed={lessonToggle}
                  className={`w-11 h-6 rounded-full relative ${lessonToggle ? 'bg-blue-600' : 'bg-gray-300'} ${notificationLoading || notificationSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={notificationLoading || notificationSaving}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${lessonToggle ? 'translate-x-5' : ''}`} />
                </button>
              </label>
              <label className="flex items-center justify-between py-2">
                <span className="text-sm text-[#1a1a1a]">출석 알림</span>
                <button
                  onClick={() => setAttendanceToggle((v) => !v)}
                  aria-pressed={attendanceToggle}
                  className={`w-11 h-6 rounded-full relative ${attendanceToggle ? 'bg-blue-600' : 'bg-gray-300'} ${notificationLoading || notificationSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={notificationLoading || notificationSaving}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${attendanceToggle ? 'translate-x-5' : ''}`} />
                </button>
              </label>
              <label className="flex items-center justify-between py-2">
                <span className="text-sm text-[#1a1a1a]">공지사항 알림</span>
                <button
                  onClick={() => setNoticeToggle((v) => !v)}
                  aria-pressed={noticeToggle}
                  className={`w-11 h-6 rounded-full relative ${noticeToggle ? 'bg-blue-600' : 'bg-gray-300'} ${notificationLoading || notificationSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={notificationLoading || notificationSaving}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${noticeToggle ? 'translate-x-5' : ''}`} />
                </button>
              </label>
              <button
                onClick={async () => {
                  setNotificationError(null)
                  setNotificationSaving(true)
                  try {
                    await persistNotificationPrefs({
                      lesson: lessonToggle,
                      attendance: attendanceToggle,
                      notice: noticeToggle,
                    })
                    alert('알림 설정이 저장되었습니다.')
                    setModal(null)
                  } catch (error) {
                    console.error('알림 설정 저장 실패:', error)
                    setNotificationError('알림 설정을 저장하는 중 문제가 발생했습니다.')
                  } finally {
                    setNotificationSaving(false)
                  }
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={notificationLoading || notificationSaving}
              >
                {notificationSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
