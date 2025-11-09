const missing = (name: string): never => {
  throw new Error(`Environment variable ${name} is required but was not provided.`);
};

const resolveEnv = (names: string[], fallback?: string) => {
  for (const name of names) {
    const value = process.env[name]
    if (value) {
      return value
    }
  }
  if (fallback !== undefined) {
    return fallback
  }
  throw new Error(`Environment variable ${names.join(' or ')} is required but was not provided.`)
}

export const AWS_REGION = resolveEnv(
  ['COGNITO_REGION', 'NEXT_PUBLIC_COGNITO_REGION'],
  process.env.COGNITO_REGION ?? process.env.NEXT_PUBLIC_COGNITO_REGION ?? 'ap-northeast-2'
)

export const COGNITO_USER_POOL_ID = resolveEnv(
  ['COGNITO_USER_POOL_ID', 'NEXT_PUBLIC_COGNITO_USER_POOL_ID']
)

export const COGNITO_CLIENT_ID = resolveEnv(
  ['COGNITO_CLIENT_ID', 'NEXT_PUBLIC_COGNITO_CLIENT_ID']
)

export const COGNITO_FAKE_EMAIL_DOMAIN =
  process.env.COGNITO_FAKE_EMAIL_DOMAIN || 'luel-note.local';

