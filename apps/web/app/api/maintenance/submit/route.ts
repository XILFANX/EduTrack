import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const formData = await req.formData()
    const title       = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const category    = formData.get('category') as string
    const urgency     = formData.get('urgency') as string
    const propertyId  = formData.get('property_id') as string | null
    const unitId      = formData.get('unit_id') as string | null
    const photosStr   = formData.get('photos') as string | null

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles').select('landlord_id').eq('id', user.id).single()

    // If no property_id provided, look it up from the tenant's unit
    let resolvedPropertyId = propertyId
    if (!resolvedPropertyId && unitId) {
      const admin = createAdminClient()
      const { data: unit } = await admin
        .from('units').select('property_id').eq('id', unitId).single()
      resolvedPropertyId = unit?.property_id ?? null
    }
    if (!resolvedPropertyId) {
      // Try to get from the tenant's record
      const admin = createAdminClient()
      const { data: tenant } = await admin
        .from('tenants')
        .select('unit_id, units ( property_id )')
        .eq('profile_id', user.id).eq('status', 'active').single()
      resolvedPropertyId = (tenant?.units as any)?.property_id ?? null
    }

    if (!resolvedPropertyId || !profile?.landlord_id) {
      return NextResponse.json({ error: 'Could not determine property. Contact your landlord.' }, { status: 422 })
    }

    // Get tenant record for linking
    const admin = createAdminClient()
    const { data: tenant } = await admin
      .from('tenants').select('id, unit_id')
      .eq('profile_id', user.id).eq('status', 'active').single()

    const { error } = await admin.from('maintenance_requests').insert({
      landlord_id:  profile.landlord_id,
      property_id:  resolvedPropertyId,
      unit_id:      unitId ?? tenant?.unit_id ?? null,
      tenant_id:    tenant?.id ?? null,
      title,
      description,
      category: category || 'other',
      urgency: urgency || 'medium',
      status: 'open',
      submitted_by: user.id,
      created_by:   user.id,
      photos: photosStr ? JSON.parse(photosStr) : null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify caretakers for all new requests (fallback to landlord if no caretaker)
    const { data: caretakers } = await admin.from('profiles')
      .select('id')
      .eq('landlord_id', profile.landlord_id)
      .eq('role', 'caretaker')

    let targets = caretakers

    // Fallback to landlord if no caretaker is assigned
    if (!targets || targets.length === 0) {
      const { data: landlords } = await admin.from('profiles')
        .select('id')
        .eq('landlord_id', profile.landlord_id)
        .eq('role', 'landlord')
      targets = landlords
    }
      
    if (targets && targets.length > 0) {
      const { sendNotification } = await import('@/lib/notifications')
      const isUrgent = urgency === 'emergency' || urgency === 'high'
      const notifTitle = isUrgent ? `🚨 ${urgency.toUpperCase()} Maintenance Request` : `New Maintenance Request`
      
      for (const s of targets) {
        // Store notification in DB
        await admin.from('notifications').insert({
          profile_id: s.id,
          title: notifTitle,
          message: title,
          type: 'maintenance_alert',
          link: '/maintenance'
        })
        
        // Send Web Push
        await sendNotification(s.id, {
          title: notifTitle,
          body: title,
          data: { url: '/maintenance' }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[maintenance/submit]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
