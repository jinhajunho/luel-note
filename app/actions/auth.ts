'use server'

import {
  InitiateAuthCommand,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AuthenticationResultType,
  UsernameExistsException,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/prisma'
import { phoneToEmail, normalizePhone, validatePhone } from '@/lib/auth-helpers'
import { getCognitoClient } from '@/lib/cognito/client'
import { setAuthCookies, clearAuthCookies, setRoleCookie } from '@/lib/cognito/session'
import { COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID } from '@/lib/config'
import { decodeJwt } from '@/lib/cognito/jwt'

type ActionState = {
  error?: string
  success?: boolean
} | undefined

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

function ensureAuthResult(result?: AuthenticationResultType | null) {
  if (!result || !result.AccessToken) {
    throw new Error('인증 토큰을 가져올 수 없습니다.')
  }
  return result
}

async function attemptLogin(username: string, password: string) {
  const client = getCognitoClient()
  return client.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    })
  )
}

function isRetryableAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const name = (error as { name?: string }).name
  return name === 'NotAuthorizedException' || name === 'UserNotFoundException'
}

async function resolveUsernameByPhone(phone: string): Promise<string | null> {
  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) return null

  const existingProfile = await prisma.profile.findUnique({
    where: { phone: normalizedPhone },
    select: { authId: true },
  })

  if (!existingProfile?.authId) {
    return null
  }

  try {
    const client = getCognitoClient()
    const response = await client.send(
      new ListUsersCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Filter: `sub = "${existingProfile.authId}"`,
        Limit: 1,
      })
    )

    const user = response.Users?.[0]
    if (user?.Username) {
      return user.Username
    }
  } catch (error) {
    console.warn('[auth] 사용자 이름 조회 실패:', error)
  }

  return null
}

// ==================== 로그인 ====================

export async function login(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const identifierRaw = (formData.get('phone') as string | null) ?? formData.get('identifier')?.toString() ?? ''
  const password = formData.get('password') as string

  if (!identifierRaw || !password) {
    return { error: '아이디(전화번호 또는 이메일)와 비밀번호를 입력하세요.' }
  }

  const identifier = identifierRaw.trim()
  const isEmailLogin = identifier.includes('@')
  let normalizedPhone = ''
  let usernameForAuth = identifier

  if (isEmailLogin) {
    usernameForAuth = identifier
  } else {
    normalizedPhone = normalizePhone(identifier)
    if (!validatePhone(normalizedPhone)) {
      return { error: '올바른 전화번호를 입력하세요.' }
    }
    usernameForAuth = phoneToEmail(normalizedPhone)
  }

  try {
    let authResponse: Awaited<ReturnType<typeof attemptLogin>>

    try {
      authResponse = await attemptLogin(usernameForAuth, password)
    } catch (error) {
      if (!isEmailLogin && normalizedPhone && isRetryableAuthError(error)) {
        const alternativeUsername = await resolveUsernameByPhone(normalizedPhone)
        if (alternativeUsername) {
          authResponse = await attemptLogin(alternativeUsername, password)
          usernameForAuth = alternativeUsername
        } else {
          throw error
        }
      } else {
        throw error
      }
    }

    const authResult = ensureAuthResult(authResponse.AuthenticationResult)

    await setAuthCookies(authResult)

    let cognitoSub: string | undefined
    let cognitoPayload:
      | { sub?: string; email?: string; ['custom:name']?: string; name?: string }
      | undefined

    if (authResult.IdToken) {
      try {
        cognitoPayload = decodeJwt<{
          sub?: string
          email?: string
          ['custom:name']?: string
          name?: string
        }>(authResult.IdToken)
        cognitoSub = cognitoPayload.sub
      } catch (error) {
        console.warn('ID 토큰 디코딩 실패:', error)
      }
    }

    let profile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(cognitoSub ? [{ authId: cognitoSub }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      },
      select: { role: true },
    })

    if (!profile) {
      try {
        const fallbackName =
          cognitoPayload?.['custom:name'] ??
          cognitoPayload?.name ??
          `회원_${normalizedPhone.slice(-4)}`

        const authIdForProfile = cognitoSub ?? normalizedPhone

        await prisma.$transaction(async (tx) => {
          const newProfile = await tx.profile.create({
            data: {
              authId: authIdForProfile,
              phone: normalizedPhone,
              name: fallbackName,
              role: 'guest',
            },
            select: { id: true },
          })

          await tx.member.create({
            data: {
              phone: normalizedPhone,
              profileId: newProfile.id,
              name: fallbackName,
              type: 'guest',
              status: 'active',
              joinDate: new Date(),
            },
          })
        })

        profile = { role: 'guest' }
      } catch (creationError) {
        console.error('프로필 자동 생성 실패:', creationError)
        const fallbackProfile = await prisma.profile.findFirst({
          where: {
            phone: normalizedPhone,
          },
          select: { role: true },
        })

        if (fallbackProfile) {
          profile = { role: fallbackProfile.role ?? 'guest' }
        } else {
          return { error: '프로필을 찾을 수 없습니다. 관리자에게 문의하세요.' }
        }
      }
    }

    const role = profile.role ?? 'guest'
    await setRoleCookie(role, authResult.ExpiresIn ?? 3600)
    revalidatePath('/', 'layout')
    redirect(resolveLandingPath(role))
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error
    }
    console.error('Cognito 로그인 오류:', error)
    return { error: '로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요.' }
  }
}

// ==================== 회원가입 ====================

export async function signup(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
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
    select: { id: true, authId: true, role: true, name: true },
  })

  let reuseProfileId: string | null = null
  if (existingProfile) {
    const hasRealAuth = existingProfile.authId && !existingProfile.authId.startsWith('guest-')
    if (hasRealAuth) {
      return { error: '이미 가입된 전화번호입니다.' }
    }
    reuseProfileId = existingProfile.id
  }

  try {
    const client = getCognitoClient()
    const signUpResponse = await client.send(
      new SignUpCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'custom:name', Value: name },
        ],
      })
    )

    if (!signUpResponse.UserSub) {
      throw new Error('Cognito 사용자 ID가 반환되지 않았습니다.')
    }

    // 이메일 인증을 사용하지 않으므로 바로 확인 처리
    await client.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
      })
    )

    const profileId = reuseProfileId
      ? (
          await prisma.profile.update({
            where: { id: reuseProfileId },
            data: {
              authId: signUpResponse.UserSub,
              phone: normalizedPhone,
              name,
              role: 'guest',
            },
            select: { id: true },
          })
        ).id
      : (
          await prisma.profile.create({
            data: {
              authId: signUpResponse.UserSub,
              phone: normalizedPhone,
              name,
              role: 'guest',
            },
            select: { id: true },
          })
        ).id

    await prisma.member.upsert({
      where: { phone: normalizedPhone },
      update: {
        profileId,
        phone: normalizedPhone,
        name,
        type: 'guest',
        status: 'active',
      },
      create: {
        phone: normalizedPhone,
        profileId,
        name,
        type: 'guest',
        status: 'active',
        joinDate: new Date(),
      },
    })

    revalidatePath('/', 'layout')
    return { success: true, error: undefined }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error
    }
    console.error('Cognito 회원가입 오류:', error)

    let message = '회원가입 처리 중 오류가 발생했습니다.'

    if (error instanceof UsernameExistsException) {
      message = '이미 가입된 전화번호입니다.'
    } else if (typeof error === 'object' && error !== null) {
      const name = 'name' in error ? String((error as any).name) : ''
      const rawMessage = 'message' in error ? String((error as any).message) : ''

      if (name === 'UsernameExistsException') {
        message = '이미 가입된 전화번호입니다.'
      } else if (name === 'InvalidPasswordException') {
        message = '비밀번호 정책을 확인해주세요. 영문 대소문자, 숫자, 특수문자를 포함해야 할 수 있습니다.'
      } else if (name === 'InvalidParameterException') {
        message = '입력 정보가 올바르지 않습니다. 전화번호와 비밀번호를 다시 확인해주세요.'
      } else if (rawMessage) {
        message = rawMessage
      }
    } else if (error instanceof Error && error.message) {
      message = error.message
    }

    return { error: message, success: false }
  }
}

// ==================== 로그아웃 ====================

export async function signOut() {
  await clearAuthCookies()
  revalidatePath('/', 'layout')
  redirect('/login')
}
