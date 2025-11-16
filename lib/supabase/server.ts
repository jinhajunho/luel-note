import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config'

const noop = () => {}

export function createSupabaseServerClient() {
	const cookieStore = cookies() as any

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
			get(name: string) {
				return cookieStore.get?.(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
					cookieStore.set?.({ name, value, ...options })
        } catch {
          noop()
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
					cookieStore.set?.({ name, value: '', ...options, maxAge: 0 })
        } catch {
          noop()
        }
      },
    },
  })
}

