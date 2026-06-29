import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Admin Supabase client — uses the SERVICE_ROLE key to bypass RLS.
 *
 * ⚠️  ONLY use this on the server (Server Actions, API routes).
 *     NEVER expose the service-role key to the browser.
 *
 * Typical uses:
 *  - Onboarding: creating a landlord record before the profile.landlord_id
 *    is set (SELECT policy blocks reading it otherwise).
 *  - Webhook handlers that process payments for any landlord.
 *  - Admin operations that span multiple landlord accounts.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
