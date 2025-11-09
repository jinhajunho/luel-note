export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getIdTokenFromCookies } from '@/lib/cognito/session'
import { decodeJwt } from '@/lib/cognito/jwt'
import { prisma } from '@/lib/db/prisma'
import { normalizePhone } from '@/lib/auth-helpers'

type CognitoPayload = {
  sub?: string
  email?: string
  ['custom:name']?: string
  name?: string
}

export async function GET() {
  const idToken = await getIdTokenFromCookies()

  if (!idToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  let payload: CognitoPayload
  try {
    payload = decodeJwt<CognitoPayload>(idToken)
  } catch (error) {
    console.error('ID 토큰 디코딩 실패:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const authId = payload.sub
  const email = payload.email
  const phoneCandidate = email ? normalizePhone(email.split('@')[0]) : undefined

  if (!authId && !phoneCandidate) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const profile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(authId ? [{ authId }] : []),
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

    const fallbackName = payload['custom:name'] ?? payload.name ?? profile.name

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authId ?? profile.id,
        email,
        phone: profile.phone,
        name: fallbackName,
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
  } catch (error) {
    console.error('세션 정보 조회 실패:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

