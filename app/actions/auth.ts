'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { AuthError } from '@supabase/supabase-js'

import { prisma } from '@/lib/db/prisma'
import { normalizePhone, phoneToEmail, validatePhone } from '@/lib/auth-helpers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdminClient } from '@/lib/supabase/admin'
import { SUPABASE_FAKE_EMAIL_DOMAIN } from '@/lib/config'

type ActionState =
  | {
      error?: string
      success?: boolean
    }
  | undefined

function resolveLandingPath(role: string) {
  switch (role) {
    case 'admin':
      return '/admin/schedule'
    case 'instructor':
      return '/instructor/schedule'
    case 'member':
    case 'guest':
    default:
      return '/member/schedule'
  }
}

function isNextRedirectError(error: unknown): error is { digest: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

function normalizeUserMetadataPhone(userMetadata: Record<string, unknown> | null | undefined) {
  if (!userMetadata || typeof userMetadata !== 'object') return ''
  const phoneValue = userMetadata.phone ?? userMetadata.phone_number
  if (typeof phoneValue !== 'string') return ''
  return normalizePhone(phoneValue)
}

async function ensureProfile({
  authId,
  phone,
  name,
}: {
  authId: string
  phone?: string
  name?: string
}): Promise<string> {
  const normalizedPhone = phone ? normalizePhone(phone) : ''
  const fallbackName =
    name ??
    (normalizedPhone
      ? `회원_${normalizedPhone.slice(-4).padStart(4, '0')}`
      : `회원_${authId.slice(0, 4)}`)

  const existingProfile = await prisma.profile.findFirst({
    where: {
      OR: [
        { authId },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    },
    select: { id: true, role: true, phone: true, authId: true },
  })

  if (existingProfile) {
    // 회원권/인트로로 생성된 placeholder(guest) 프로필을 실제 회원가입으로 승격
    const memberByPhone = normalizedPhone
      ? await prisma.member.findUnique({
          where: { phone: normalizedPhone },
          select: { id: true, type: true },
        })
      : null

    // 업데이트 규칙:
    // - 전화번호가 비어 있으면 채워넣음
    // - authId를 실제 가입자의 authId로 덮어씀 (게스트 승격 시)
    const shouldPromote =
      memberByPhone?.type === 'guest' &&
      (existingProfile.role === 'guest' || existingProfile.role === 'member')

    const updates: Record<string, unknown> = {}
    if (normalizedPhone && !existingProfile.phone) {
      updates.phone = normalizedPhone
    }
    if (shouldPromote && existingProfile.authId !== authId) {
      updates.authId = authId
    }

    if (Object.keys(updates).length > 0) {
      await prisma.profile.update({
        where: { id: existingProfile.id },
        data: updates,
      })
    }

    if (shouldPromote) {
      // 멤버도 정회원으로 승격
      await prisma.member.update({
        where: { phone: normalizedPhone! },
        data: { type: 'member', status: 'active', profileId: existingProfile.id, name: fallbackName },
      })
    }

    // 관리자/강사는 자동으로 member 레코드를 생성/동기화하지 않음
    // (관리자/강사 로그인 시 guest 멤버 레코드가 재생성되는 현상 방지)
    const canAttachMember =
      normalizedPhone &&
      (!existingProfile.role || existingProfile.role === 'guest' || existingProfile.role === 'member')

    if (canAttachMember) {
      await prisma.member.upsert({
        where: { phone: normalizedPhone },
        update: {
          profileId: existingProfile.id,
          phone: normalizedPhone,
          name: fallbackName,
          status: 'active',
        },
        create: {
          profileId: existingProfile.id,
          phone: normalizedPhone,
          name: fallbackName,
          type: 'guest',
          status: 'active',
          joinDate: new Date(),
        },
      })
    }

    return (shouldPromote ? 'member' : existingProfile.role) ?? 'guest'
  }

  if (!normalizedPhone) {
    throw new Error('전화번호 정보가 없어 프로필을 생성할 수 없습니다.')
  }

  await prisma.$transaction(async (tx) => {
    const newProfile = await tx.profile.create({
      data: {
        authId,
        phone: normalizedPhone,
        name: fallbackName,
        // DB 체크 제약에 따라 기본 역할은 'member'로 생성
        role: 'member',
      },
      select: { id: true },
    })

    await tx.member.upsert({
      where: { phone: normalizedPhone },
      update: {
        profileId: newProfile.id,
        phone: normalizedPhone,
        name: fallbackName,
        status: 'active',
      },
      create: {
        profileId: newProfile.id,
        phone: normalizedPhone,
        name: fallbackName,
        type: 'guest',
        status: 'active',
        joinDate: new Date(),
      },
    })
  })

  return 'guest'
}

function translateAuthError(error: AuthError | null | undefined) {
  if (!error) return '인증에 실패했습니다. 다시 시도해주세요.'
  const message = error.message?.toLowerCase() ?? ''

  if (message.includes('invalid login credentials')) {
    return '아이디 또는 비밀번호가 올바르지 않습니다.'
  }
  if (message.includes('email not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다.'
  }
  if (message.includes('user already registered')) {
    return '이미 가입된 정보입니다.'
  }

  return error.message || '인증 중 오류가 발생했습니다.'
}

// ==================== 로그인 ====================

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const identifierRaw =
    (formData.get('phone') as string | null) ?? formData.get('identifier')?.toString() ?? ''
  const password = formData.get('password') as string

  if (!identifierRaw || !password) {
    return { error: '아이디(전화번호 또는 이메일)와 비밀번호를 입력하세요.' }
  }

  const supabase = createSupabaseServerClient()
  const identifier = identifierRaw.trim()
  const isEmailLogin = identifier.includes('@')
  let normalizedPhone = ''
  let emailForAuth = identifier

  if (!isEmailLogin) {
    normalizedPhone = normalizePhone(identifier)
    if (!validatePhone(normalizedPhone)) {
      return { error: '올바른 전화번호를 입력하세요.' }
    }
    emailForAuth = phoneToEmail(normalizedPhone)
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailForAuth,
      password,
    })

    if (error) {
      return { error: translateAuthError(error) }
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: '사용자 정보를 불러올 수 없습니다.' }
    }

    const metadataPhone = normalizeUserMetadataPhone(user.user_metadata as Record<string, unknown>)
    const derivedPhone =
      normalizedPhone ||
      metadataPhone ||
      (user.email ? normalizePhone(user.email.split('@')[0]) : '')

    const metadataName =
      (typeof user.user_metadata === 'object' && user.user_metadata
        ? String(user.user_metadata.name ?? '')
        : '') || undefined

    const role = await ensureProfile({
      authId: user.id,
      phone: derivedPhone || undefined,
      name: metadataName,
    })

    revalidatePath('/', 'layout')
    redirect(resolveLandingPath(role))
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error
    }
    console.error('[auth] 로그인 실패:', error)
    return { error: '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

// ==================== 회원가입 ====================

export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const phone = formData.get('phone') as string
  const name = formData.get('name') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!phone || !name || !password || !confirmPassword) {
    return { error: '필수 항목을 모두 입력하세요.' }
  }

  if (password !== confirmPassword) {
    return { error: '비밀번호가 일치하지 않습니다.' }
  }

  if (password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' }
  }

  if (!validatePhone(phone)) {
    return { error: '올바른 전화번호 형식이 아닙니다.' }
  }

  const normalizedPhone = normalizePhone(phone)
  const email = phoneToEmail(normalizedPhone)

  const existingProfile = await prisma.profile.findUnique({
    where: { phone: normalizedPhone },
    select: { id: true, authId: true },
  })

  // 기존에 인트로로 생성된 프로필이 있어도 회원가입 허용하고 승격 처리(ensureProfile에서 처리)
  // 실제로 완전 가입된 계정인지 구분하기 어렵기 때문에, 여기서는 차단하지 않음.

  try {
    const { data, error } = await supabaseAdminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        phone: normalizedPhone,
        name,
        fake_email_domain: SUPABASE_FAKE_EMAIL_DOMAIN,
      },
    })

    if (error) {
      return { error: translateAuthError(error) }
    }

    const user = data.user
    if (!user) {
      return { error: '사용자 정보를 생성하지 못했습니다.' }
    }

    await ensureProfile({
      authId: user.id,
      phone: normalizedPhone,
      name,
    })

    const supabase = createSupabaseServerClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.warn('[auth] 가입 직후 자동 로그인 실패:', signInError)
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error
    }
    console.error('[auth] 회원가입 실패:', error)
    return { error: '회원가입 처리 중 오류가 발생했습니다.' }
  }
}

// ==================== 로그아웃 ====================

export async function signOut() {
  const supabase = createSupabaseServerClient()

  await supabase.auth.signOut().catch((error) => {
    console.warn('[auth] 로그아웃 중 오류가 발생했습니다.', error)
  })

  revalidatePath('/', 'layout')
  redirect('/login')
}
