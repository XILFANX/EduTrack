import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const { target, specificUserId, title, message } = await req.json()

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles').select('id, landlord_id, role').eq('id', user.id).single()

    if (!profile?.landlord_id || profile.role !== 'landlord') {
      return NextResponse.json({ error: 'Only landlords can send broadcast notifications.' }, { status: 403 })
    }

    const admin = createAdminClient()
    let targets: { id: string }[] = []

    if (target === 'specific' && specificUserId) {
      // Find the specific user's profile
      const { data: userProfile } = await admin.from('profiles')
        .select('id')
        .eq('id', specificUserId)
        .eq('landlord_id', profile.landlord_id)
        .single()
      if (userProfile) targets.push(userProfile)
    } else if (target === 'all_tenants') {
      const { data: tenants } = await admin.from('tenants')
        .select('profile_id')
        .eq('landlord_id', profile.landlord_id)
        .eq('status', 'active')
      if (tenants) targets = tenants.filter(t => t.profile_id).map(t => ({ id: t.profile_id as string }))
    } else if (target === 'all_caretakers') {
      const { data: caretakers } = await admin.from('profiles')
        .select('id')
        .eq('landlord_id', profile.landlord_id)
        .eq('role', 'caretaker')
      if (caretakers) targets = caretakers
    }

    if (targets.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found.' }, { status: 404 })
    }

    for (const t of targets) {
      // Create notification record
      await admin.from('notifications').insert({
        profile_id: t.id,
        sender_id: profile.id, // The landlord
        title,
        message,
        type: 'custom_alert',
        link: '/dashboard'
      })

      // Send Web Push
      await sendNotification(t.id, {
        title,
        body: message,
        data: { url: '/dashboard' }
      })
    }

    return NextResponse.json({ success: true, count: targets.length })
  } catch (err) {
    console.error('[notifications/send]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
