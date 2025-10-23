'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'

type Announcement = {
  id: string
  title: string
  content: string
  created_at: string
  author: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      // TODO: 실제 공지사항 API 연동
      // 지금은 임시 데이터
      const mockData: Announcement[] = [
        {
          id: '1',
          title: '환영합니다!',
          content: 'Luel Note에 오신 것을 환영합니다. 왼쪽 메뉴에서 원하는 기능을 선택하세요.',
          created_at: new Date().toISOString(),
          author: '관리자'
        }
      ]
      
      setAnnouncements(mockData)
    } catch (error) {
      console.error('공지사항 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#FFFEF5]">
      <Header currentPage="공지사항" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📢 공지사항</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div 
                key={announcement.id} 
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900">
                      {announcement.title}
                    </h2>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                      {formatDate(announcement.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">
                    {announcement.content}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>작성자: {announcement.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
