export function decodeJwt<T extends Record<string, unknown> = Record<string, unknown>>(token: string): T {
  const segments = token.split('.')
  if (segments.length < 2) {
    throw new Error('Invalid JWT format')
  }

  const payload = segments[1]
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')

  let decoded: string
  if (typeof atob === 'function') {
    decoded = atob(padded)
  } else if (typeof Buffer !== 'undefined') {
    decoded = Buffer.from(padded, 'base64').toString('utf8')
  } else {
    throw new Error('Base64 decoding is not supported in this environment')
  }

  return JSON.parse(decoded) as T
}

