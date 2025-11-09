'use server'

import {
  UpdateUserAttributesCommand,
  GetUserCommand,
  InitiateAuthCommand,
  NotAuthorizedException,
  type AuthenticationResultType,
} from '@aws-sdk/client-cognito-identity-provider'
import { getCognitoClient } from '@/lib/cognito/client'
import {
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from '@/lib/cognito/session'
import { COGNITO_CLIENT_ID } from '@/lib/config'

type UpdateEmailResult =
  | { success: true; email: string }
  | { success: false; error: string }

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isTokenExpiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const name = (error as { name?: string }).name
  if (name === 'NotAuthorizedException') {
    return true
  }
  if ('message' in (error as Record<string, unknown>)) {
    const message = String((error as { message?: unknown }).message ?? '')
    return message.toLowerCase().includes('access token has expired')
  }
  return false
}

async function refreshTokens(): Promise<AuthenticationResultType | null> {
  const refreshToken = await getRefreshTokenFromCookies()
  if (!refreshToken) {
    return null
  }

  const client = getCognitoClient()
  const response = await client.send(
    new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    })
  )

  const result = response.AuthenticationResult
  if (!result || !result.AccessToken) {
    return null
  }

  await setAuthCookies(result)
  return result
}

export async function updateEmail(nextEmail: string): Promise<UpdateEmailResult> {
  const trimmedEmail = (nextEmail ?? '').trim()
  if (!trimmedEmail) {
    return { success: false, error: '이메일을 입력해주세요.' }
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { success: false, error: '올바른 이메일 형식이 아닙니다.' }
  }

  const client = getCognitoClient()

  let accessToken = await getAccessTokenFromCookies()
  if (!accessToken) {
    const refreshed = await refreshTokens()
    accessToken = refreshed?.AccessToken ?? undefined
    if (!accessToken) {
      return { success: false, error: '세션이 만료되었습니다. 다시 로그인해주세요.' }
    }
  }

  async function performUpdate(token: string) {
    await client.send(
      new UpdateUserAttributesCommand({
        AccessToken: token,
        UserAttributes: [
          {
            Name: 'email',
            Value: trimmedEmail,
          },
        ],
      })
    )
  }

  try {
    await performUpdate(accessToken)
  } catch (error) {
    if (isTokenExpiredError(error)) {
      const refreshed = await refreshTokens()
      const newAccessToken = refreshed?.AccessToken ?? null
      if (!newAccessToken) {
        return { success: false, error: '세션이 만료되었습니다. 다시 로그인해주세요.' }
      }
      await performUpdate(newAccessToken)
      accessToken = newAccessToken
    } else {
      console.error('[profile] 이메일 업데이트 실패', error)
      const message =
        error instanceof NotAuthorizedException
          ? '이메일을 변경할 권한이 없습니다.'
          : '이메일을 변경하는 중 오류가 발생했습니다.'
      return { success: false, error: message }
    }
  }

  try {
    const user = await client.send(
      new GetUserCommand({
        AccessToken: accessToken,
      })
    )

    const updatedEmail =
      user.UserAttributes?.find((attr) => attr.Name === 'email')?.Value ?? trimmedEmail

    // 변경된 이메일이 토큰에 반영되도록 즉시 갱신
    await refreshTokens()
    return {
      success: true as const,
      email: updatedEmail,
    }
  } catch (error) {
    console.error('[profile] 변경된 이메일 확인 실패', error)
    await refreshTokens().catch((err) =>
      console.warn('[profile] 이메일 변경 후 토큰 갱신 실패', err)
    )
    return {
      success: true as const,
      email: trimmedEmail,
    }
  }
}


