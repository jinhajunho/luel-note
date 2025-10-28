'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/types'

interface BottomNavigationProps {
  profile: Profile
}

export default function BottomNavigation({ profile }: BottomNavigationProps) {
  const pathname = usePathname()

  // 현재 페이지 활성 체크
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/admin/dashboard' || pathname === '/instructor/dashboard'
    }
    return pathname.startsWith(href)
  }

  // 역할별 메뉴 정의
  const getMenuItems = () => {
    // 회원 메뉴 (2개)
    if (profile.role === 'member') {
      return [
        {
          href: '/dashboard',
          label: '일정',
          isCenter: true,
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          href: '/attendance',
          label: '출석',
          isCenter: false,
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    }

    // 강사 메뉴 (5개) - 순서: 회원 | 출석 | 일정(중앙) | 수업 | 정산
    if (profile.role === 'instructor') {
      return [
        {
          href: '/instructor/members',
          label: '회원',
          isCenter: false,
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        },
        {
          href: '/instructor/attendance',
          label: '출석',
          isCenter: false,
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          href: '/instructor/dashboard',
          label: '일정',
          isCenter: true,
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          href: '/instructor/lessons',
          label: '수업',
          isCenter: false,
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          href: '/instructor/finance',
          label: '정산',
          isCenter: false,
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    }

    // 관리자 메뉴 (5개) - 순서: 회원 | 출석 | 일정(중앙) | 수업 | 정산
    return [
      {
        href: '/admin/members',
        label: '회원',
        isCenter: false,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      },
      {
        href: '/admin/attendance',
        label: '출석',
        isCenter: false,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        href: '/admin/dashboard',
        label: '일정',
        isCenter: true,
        icon: (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      },
      {
        href: '/admin/classes',
        label: '수업',
        isCenter: false,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
      {
        href: '/admin/finance',
        label: '정산',
        isCenter: false,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    ]
  }

  const menuItems = getMenuItems()

  return (
    <>
      {/* blob-morph 애니메이션 키프레임 */}
      <style jsx global>{`
        @keyframes blob-morph {
          0%, 100% {
            border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          }
          25% {
            border-radius: 60% 40% 30% 70% / 50% 60% 40% 50%;
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 40% 60% 50%;
          }
          75% {
            border-radius: 60% 30% 50% 60% / 40% 60% 50% 60%;
          }
        }

        .blob-button {
          animation: blob-morph 6s ease-in-out infinite;
        }
      `}</style>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0ebe1] z-[1000]">
        <div 
          className="max-w-[600px] mx-auto"
          style={{
            paddingTop: '8px',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
          }}
        >
          <div className="relative flex justify-around items-center px-5">
            {menuItems.map((item) => (
              item.isCenter ? (
                // 가운데 물방울 버튼 (일정)
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    blob-button
                    absolute left-1/2 -translate-x-1/2 -top-6
                    flex flex-col items-center justify-center
                    w-[72px] h-[72px]
                    shadow-lg
                    transition-all duration-300
                    ${isActive(item.href)
                      ? 'bg-gradient-to-br from-blue-400 via-purple-400 to-pink-300 text-white scale-110'
                      : 'bg-gradient-to-br from-cyan-200 via-teal-200 to-pink-200 text-gray-700 hover:scale-105'
                    }
                  `}
                  style={{
                    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%'
                  }}
                >
                  <div className="flex flex-col items-center">
                    {item.icon}
                    <span className="text-[10px] font-semibold mt-1">{item.label}</span>
                  </div>
                </Link>
              ) : (
                // 일반 버튼들
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors
                    ${isActive(item.href)
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-900'
                    }
                  `}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}
