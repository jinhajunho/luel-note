import { createClient } from '@supabase/supabase-js'

import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/config'

export const supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

