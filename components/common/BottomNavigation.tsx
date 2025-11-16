'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getNavItemsByRole, type NavItem } from '@/lib/navigation'

type BottomNavigationProps = {
  items?: NavItem[]
}

export default function BottomNavigation({ items }: BottomNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading } = useAuth()

  if (!items && (loading || !profile)) {
    return null
  }

  const menuItems = items ?? (profile ? getNavItemsByRole(profile.role) : [])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0ebe1] z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-2 relative">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const isCenterButton = item.isCenter

          if (isCenterButton) {
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="absolute left-1/2 top-0 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg text-white flex items-center justify-center"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg,#3b82f6 0%,#2563eb 50%,#1d4ed8 100%)'
                    : 'linear-gradient(135deg,#38bdf8 0%,#2563eb 50%,#7c3aed 100%)',
                  bottom: 'calc(env(safe-area-inset-bottom))'
                }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
              </button>
            )
          }

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex min-w-[60px] flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
