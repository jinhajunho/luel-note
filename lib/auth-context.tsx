'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { normalizeText } from '@/lib/utils/text'
import { usePathname } from 'next/navigation'

type AuthUser = {
  id: string
  email?: string
  phone?: string
  name?: string
}

type Profile = {
  id: string
  phone: string
  name: string
  role: 'admin' | 'instructor' | 'member' | 'guest'
  birth_date?: string
  gender?: string
}

type UserPermissions = {
  menu_dashboard: boolean
  menu_attendance: boolean
  menu_members: boolean
  menu_classes: boolean
  menu_settlements: boolean
  menu_settings: boolean
}

type AuthContextType = {
  user: AuthUser | null
  profile: Profile | null
  permissions: UserPermissions | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  permissions: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

async function fetchSession() {
  const url = `/api/auth/session?ts=${Date.now()}`
  const res = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate',
      pragma: 'no-cache',
      expires: '0',
    },
  })

  if (res.status === 401 || res.status === 404) {
    return { authenticated: false } as const
  }

  if (!res.ok) {
    throw new Error(`Failed to load session: ${res.status}`)
  }

  return res.json() as Promise<{
    authenticated: boolean
    user?: AuthUser
    profile?: Profile
    permissions?: UserPermissions
  }>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchSession()
      if (data.authenticated && data.user) {
        const normalizedName = normalizeText(data.user.name)
        const normalizedProfile: Profile = {
          id: data.profile?.id ?? data.user.id,
          phone: data.profile?.phone ?? (data.user.phone ?? ''),
          name: data.profile ? normalizeText(data.profile.name) : normalizedName,
          role: (data.profile?.role ?? 'guest') as Profile['role'],
          birth_date: data.profile?.birth_date,
          gender: data.profile?.gender,
        }
        setUser({
          ...data.user,
          name: normalizedName,
        })
        setProfile(normalizedProfile)
        setPermissions(
          data.permissions ?? {
            menu_dashboard: true,
            menu_attendance: true,
            menu_members: true,
            menu_classes: true,
            menu_settlements: true,
            menu_settings: true,
          }
        )
      } else {
        setUser(null)
        setProfile(null)
        setPermissions(null)
      }
    } catch (error) {
      console.error('세션 정보를 불러오지 못했습니다:', error)
      setUser(null)
      setProfile(null)
      setPermissions(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, pathname])

  const refreshProfile = useCallback(async () => {
    await load()
  }, [load])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('로그아웃 요청 실패:', error)
    } finally {
      setUser(null)
      setProfile(null)
      setPermissions(null)
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        permissions,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
