import { prisma } from '@/lib/db/prisma'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/auth-helpers'

export type AuthenticatedProfile = {
  id: string
  name: string | null
  role: string | null
}

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const authId = user.id
  const metadataPhone =
    typeof user.user_metadata === 'object'
      ? normalizePhone(String(user.user_metadata.phone ?? ''))
      : undefined
  const emailPhone = user.email ? normalizePhone(user.email.split('@')[0]) : undefined
  const phoneCandidate = metadataPhone || emailPhone

  try {
    const profile = await prisma.profile.findFirst({
      where: {
        OR: [
          { authId },
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

