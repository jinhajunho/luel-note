export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'
import { normalizePhone } from '@/lib/auth-helpers'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const userMetadata =
    (user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {}) ?? {}

  const metadataPhone = userMetadata.phone ? normalizePhone(String(userMetadata.phone)) : ''
  const emailPhone = user.email ? normalizePhone(user.email.split('@')[0]) : ''
  const phoneCandidate = metadataPhone || emailPhone

  try {
    const profile = await prisma.profile.findFirst({
      where: {
        OR: [
          { authId: user.id },
          ...(phoneCandidate ? [{ phone: phoneCandidate }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        birthDate: true,
        gender: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ authenticated: false }, { status: 404 })
    }

    const permissions = await prisma.userPermission.findMany({
      where: { profileId: profile.id },
    })

    const permissionMap = {
      menu_dashboard: false,
      menu_attendance: false,
      menu_members: false,
      menu_classes: false,
      menu_settlements: false,
      menu_settings: false,
    }

    permissions.forEach((permission) => {
      const key = permission.permissionKey as keyof typeof permissionMap
      if (key in permissionMap) {
        permissionMap[key] = permission.granted ?? false
      }
    })

    const contactEmail =
      (typeof userMetadata.contact_email === 'string' && userMetadata.contact_email) || user.email
    const displayName =
      (typeof userMetadata.name === 'string' && userMetadata.name) || profile.name

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: contactEmail ?? undefined,
        phone: profile.phone ?? phoneCandidate ?? undefined,
        name: displayName ?? undefined,
      },
      profile: {
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        role: (profile.role ?? 'guest') as 'guest' | 'member' | 'instructor' | 'admin',
        birth_date: profile.birthDate ? profile.birthDate.toISOString().split('T')[0] : undefined,
        gender: profile.gender ?? undefined,
      },
      permissions: permissionMap,
    })
  } catch (err) {
    console.error('세션 정보 조회 실패:', err)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

