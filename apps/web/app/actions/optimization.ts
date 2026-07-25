'use server'

import { createAdminClient } from '@/lib/supabase/server'

const RETENTION_POLICIES = {
  communications: 180,
  notifications: 30,
  audit_logs: 90,
  search_queries_log: 30,
  invitations: 30
}

const DORMANT = { warn_at: 60, final_warn_at: 85, delete_at: 90 }

export type RetentionCategory = keyof typeof RETENTION_POLICIES

function getThresholdDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// Minimal safe count function that handles missing tables gracefully
async function safeCount(admin: any, table: string, field: string, threshold: string, filter?: { column: string, value: any, op?: string }[]) {
  try {
    let query = admin.from(table).select('id', { count: 'exact', head: true })
    if (field && threshold) {
      query = query.lte(field, threshold)
    }
    if (filter) {
      filter.forEach(f => {
        if (f.op === 'gt') query = query.gt(f.column, f.value)
        else if (f.op === 'is') query = query.is(f.column, f.value)
        else query = query.eq(f.column, f.value)
      })
    }
    const { count } = await query
    return count ?? 0
  } catch (e) {
    return 0 // Table likely doesn't exist
  }
}

export async function getOptimizationStats() {
  const admin = await createAdminClient()

  try {
    const commCount = await safeCount(admin, 'communications', 'created_at', getThresholdDate(RETENTION_POLICIES.communications))
    const notifCount = await safeCount(admin, 'notifications', 'created_at', getThresholdDate(RETENTION_POLICIES.notifications))
    const auditCount = await safeCount(admin, 'audit_logs', 'created_at', getThresholdDate(RETENTION_POLICIES.audit_logs))
    const searchCount = await safeCount(admin, 'search_queries_log', 'created_at', getThresholdDate(RETENTION_POLICIES.search_queries_log))
    const inviteCount = await safeCount(admin, 'invitations', 'created_at', getThresholdDate(RETENTION_POLICIES.invitations))

    // Dormant counts (using 'users' table for EduTrack)
    const warnCount = await safeCount(admin, 'users', 'last_login_at', getThresholdDate(DORMANT.warn_at), [
      { column: 'last_login_at', value: getThresholdDate(DORMANT.final_warn_at), op: 'gt' }
    ])
    const finalCount = await safeCount(admin, 'users', 'last_login_at', getThresholdDate(DORMANT.final_warn_at), [
      { column: 'last_login_at', value: getThresholdDate(DORMANT.delete_at), op: 'gt' }
    ])
    const deleteCount = await safeCount(admin, 'users', 'last_login_at', getThresholdDate(DORMANT.delete_at))

    return {
      success: true,
      stats: {
        communications: commCount,
        notifications: notifCount,
        audit_logs: auditCount,
        search_queries_log: searchCount,
        invitations: inviteCount,
        policies: RETENTION_POLICIES,
        dormant: {
          warning_phase: warnCount,
          final_phase: finalCount,
          deletion_phase: deleteCount
        }
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function purgeCategory(category: RetentionCategory): Promise<{ success: boolean, error?: string }> {
  const admin = await createAdminClient()
  const threshold = getThresholdDate(RETENTION_POLICIES[category])
  try {
    if (category === 'invitations') {
      await admin.from(category).delete().in('status', ['accepted', 'expired']).lte('created_at', threshold)
    } else {
      await admin.from(category).delete().lte('created_at', threshold)
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function notifyWarningPhase() {
  const admin = await createAdminClient()
  const { data: accounts } = await admin
    .from('users')
    .select('id, full_name')
    .lte('last_login_at', getThresholdDate(DORMANT.warn_at))
    .gt('last_login_at', getThresholdDate(DORMANT.final_warn_at))
    .limit(100)
    // Note: If you add 'dormant_warned_at' to users, check it here
}

async function notifyFinalPhase() {
  const admin = await createAdminClient()
  const { data: accounts } = await admin
    .from('users')
    .select('id, full_name')
    .lte('last_login_at', getThresholdDate(DORMANT.final_warn_at))
    .gt('last_login_at', getThresholdDate(DORMANT.delete_at))
    .limit(100)
}

async function processDeletionPhase() {
  const admin = await createAdminClient()
  const { data: accounts } = await admin
    .from('users')
    .select('id, full_name, role')
    .lte('last_login_at', getThresholdDate(DORMANT.delete_at))
    .limit(50)

  if (!accounts?.length) return

  for (const account of accounts) {
    try {
      await admin.auth.admin.deleteUser(account.id)
      await admin.from('users').delete().eq('id', account.id)
    } catch (err) {
      console.error(`[dormant] Failed to delete account ${account.id}:`, err)
    }
  }
}

export async function processAccountDeletion(userId: string): Promise<{ success: boolean, error?: string }> {
  try {
    const admin = await createAdminClient()
    await admin.auth.admin.deleteUser(userId)
    await admin.from('users').delete().eq('id', userId)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function runAutomatedOptimization(): Promise<{ success: boolean, error?: string }> {
  console.log('[optimization] Automated cleanup started:', new Date().toISOString())
  const errors: string[] = []

  const categories: RetentionCategory[] = [
    'communications', 'notifications', 'audit_logs', 'search_queries_log', 'invitations'
  ]
  for (const cat of categories) {
    const result = await purgeCategory(cat)
    if (!result.success) errors.push(`purge:${cat}: ${result.error}`)
  }

  try { await notifyWarningPhase() } catch (e: any) { errors.push(`dormant:warn: ${e.message}`) }
  try { await notifyFinalPhase() } catch (e: any) { errors.push(`dormant:final: ${e.message}`) }
  try { await processDeletionPhase() } catch (e: any) { errors.push(`dormant:delete: ${e.message}`) }

  if (errors.length > 0) {
    console.error('[optimization] Some tasks failed:', errors)
    return { success: false, error: errors.join(' | ') }
  }

  console.log('[optimization] Automated cleanup completed:', new Date().toISOString())
  return { success: true }
}
