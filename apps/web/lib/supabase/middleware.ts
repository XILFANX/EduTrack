import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session: IMPORTANT — do not remove this await
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch lightweight profile for onboarding guard in proxy.ts
  let profile: { landlord_id: string | null; role: string } | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('landlord_id, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return { supabaseResponse, user, profile }
}
