import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export function isPlatformOwner(email?: string | null) {
  if (!email) return false
  return email.toLowerCase() === process.env.PRODUCT_ADMINISTRATOR_EMAIL?.toLowerCase()
}

/**
 * OAuth + Magic Link callback handler.
 * Supabase redirects here after Google OAuth or invite acceptance.
 * Exchanges the auth code for a session and routes the user.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (!sessionError) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.redirect(`${origin}/login?error=no_user`)

      const admin = createAdminClient()

      // ── Platform Owner: hardcoded email always routes to admin ──────────────
      if (isPlatformOwner(user.email)) {
        await admin.from('users').upsert({
          id: user.id,
          role: 'admin',
          full_name: user.user_metadata?.full_name ?? 'Platform Owner',
          phone_number: '0000000000',
        }, { onConflict: 'id' })
        return NextResponse.redirect(`${origin}/admin/dashboard`)
      }

      // ── Check if user already has a profile ─────────────────────────────────
      const { data: profile } = await supabase
        .from('users')
        .select('role, school_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Brand new user with no profile (assumed to be a principal signing up)
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Route them
      const destination = next !== '/' ? next : '/'
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
