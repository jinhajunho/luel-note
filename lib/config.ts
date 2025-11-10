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

export const SUPABASE_URL = resolveEnv(['SUPABASE_URL'])

export const SUPABASE_ANON_KEY = resolveEnv(['SUPABASE_ANON_KEY'])

export const SUPABASE_SERVICE_ROLE_KEY = resolveEnv(['SUPABASE_SERVICE_ROLE_KEY'])

export const SUPABASE_FAKE_EMAIL_DOMAIN =
  process.env.SUPABASE_FAKE_EMAIL_DOMAIN || 'luel-note.local'

