import { prisma } from '@/lib/db/prisma'
import { getIdTokenFromCookies } from '@/lib/cognito/session'
import { decodeJwt } from '@/lib/cognito/jwt'
import { normalizePhone } from '@/lib/auth-helpers'

interface CognitoPayload extends Record<string, unknown> {
  sub?: string
  email?: string
  ['custom:name']?: string
  name?: string
}

export type AuthenticatedProfile = {
  id: string
  name: string | null
  role: string | null
}

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const idToken = await getIdTokenFromCookies()
  if (!idToken) return null

  let payload: CognitoPayload
  try {
    payload = decodeJwt<CognitoPayload>(idToken)
  } catch (error) {
    console.error('[auth] ID 토큰 디코딩 실패', error)
    return null
  }

  const authId = payload.sub
  const email = payload.email
  const phoneCandidate = email ? normalizePhone(email.split('@')[0]) : undefined

  if (!authId && !phoneCandidate) {
    return null
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
        role: true,
      },
    })

    if (!profile) return null

    return {
      id: profile.id,
      name: profile.name,
      role: profile.role ?? null,
    }
  } catch (error) {
    console.error('[auth] 프로필 조회 실패', error)
    return null
  }
}

