import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function DELETE() {
  try {
    // 1. Verify standard session
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Initialize service-role client to bypass RLS and delete auth user
    // The auth user deletion will cascade to public.profiles via the database trigger/fkey
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (error) {
      console.error('Failed to delete user:', error.message)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    // 3. Optional: Sign them out from current session just in case
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
