import type { AuthenticationResultType } from '@aws-sdk/client-cognito-identity-provider'
import { cookies } from 'next/headers'

const COOKIE_OPTIONS = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

const ACCESS_TOKEN_COOKIE = 'cognito-access-token'
const ID_TOKEN_COOKIE = 'cognito-id-token'
const REFRESH_TOKEN_COOKIE = 'cognito-refresh-token'
const ROLE_COOKIE = 'cognito-role'

export const ID_TOKEN_COOKIE_NAME = ID_TOKEN_COOKIE
export const ROLE_COOKIE_NAME = ROLE_COOKIE
export const ACCESS_TOKEN_COOKIE_NAME = ACCESS_TOKEN_COOKIE
export const REFRESH_TOKEN_COOKIE_NAME = REFRESH_TOKEN_COOKIE

export async function setAuthCookies(auth: AuthenticationResultType) {
  const store = await cookies()
  const maxAge = auth.ExpiresIn ?? 3600 // seconds

  if (auth.AccessToken) {
    store.set(ACCESS_TOKEN_COOKIE, auth.AccessToken, {
      ...COOKIE_OPTIONS,
      maxAge,
    })
  }

  if (auth.IdToken) {
    store.set(ID_TOKEN_COOKIE, auth.IdToken, {
      ...COOKIE_OPTIONS,
      maxAge,
    })
  }

  if (auth.RefreshToken) {
    store.set(REFRESH_TOKEN_COOKIE, auth.RefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }
}

export async function clearAuthCookies() {
  const store = await cookies()

  ;[ACCESS_TOKEN_COOKIE, ID_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, ROLE_COOKIE].forEach((key) => {
    store.delete(key)
  })
}

export async function getIdTokenFromCookies() {
  const store = await cookies()
  return store.get(ID_TOKEN_COOKIE)?.value
}

export async function getAccessTokenFromCookies() {
  const store = await cookies()
  return store.get(ACCESS_TOKEN_COOKIE)?.value
}

export async function getRefreshTokenFromCookies() {
  const store = await cookies()
  return store.get(REFRESH_TOKEN_COOKIE)?.value
}

export async function setRoleCookie(role: string, maxAgeSeconds = 3600) {
  const store = await cookies()
  store.set(ROLE_COOKIE, role, {
    ...COOKIE_OPTIONS,
    maxAge: maxAgeSeconds,
  })
}

export async function clearRoleCookie() {
  const store = await cookies()
  store.delete(ROLE_COOKIE)
}

