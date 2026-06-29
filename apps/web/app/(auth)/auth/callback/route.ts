import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlatformOwner, getPortalUrl } from '@/lib/auth-utils'

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
        await admin.from('profiles').upsert({
          id: user.id,
          role: 'platform_owner',
          full_name: user.user_metadata?.full_name ?? 'Platform Owner',
          landlord_id: null,
        }, { onConflict: 'id' })
        await admin.from('platform_admins').upsert(
          { id: user.id, email: user.email!, is_root: true, granted_by: user.id },
          { onConflict: 'id' }
        )
        return NextResponse.redirect(`${origin}/admin/dashboard`)
      }

      // ── Check if user already has a profile ─────────────────────────────────
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, landlord_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Brand new landlord with no profile → onboarding
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Check if landlord has completed onboarding (has a landlords record)
      let hasLandlordRecord = true
      if (profile.role === 'landlord') {
        const { data: landlordRow } = await supabase
          .from('landlords')
          .select('id')
          .eq('id', user.id)
          .single()
        hasLandlordRecord = !!landlordRow
      }

      // Honor the ?next= param if safe, otherwise route by role
      const portalUrl = getPortalUrl(profile.role, hasLandlordRecord)
      const destination = next !== '/' ? next : portalUrl
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
