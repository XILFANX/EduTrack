import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/formatting'

export default async function QuickPayPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const supabase = await createClient()

  // Look up unit by code (unit number used as the quick-pay code)
  // We use the unit number as the "code" for simplicity — look up by unit number
  const { data: unit } = await supabase
    .from('units')
    .select(`
      id, unit_number, rent_amount, status,
      properties ( name, address ),
      tenants ( id, full_name, status )
    `)
    .eq('unit_number', code.toUpperCase())
    .eq('status', 'occupied')
    .single()

  if (!unit) notFound()

  type TenantData = { id: string; full_name: string; status: string | null } | null
  type PropData = { name: string; address: string | null } | null
  const property = unit.properties as unknown as PropData
  const tenant = Array.isArray(unit.tenants)
    ? (unit.tenants.find((t: { status: string | null }) => t.status === 'active') as TenantData ?? null)
    : (unit.tenants as unknown as TenantData)

  // Get landlord for currency info
  const { data: landlord } = await supabase
    .from('landlords')
    .select('id, currency')
    .limit(1)
    .single()

  const currency = landlord?.currency ?? 'KES'

  // Get current month's outstanding balance
  const now = new Date()
  const { data: invoice } = tenant
    ? await supabase
        .from('invoices')
        .select('total_amount, paid_amount, balance, status, due_date')
        .eq('tenant_id', tenant.id)
        .eq('month', now.getMonth() + 1)
        .eq('year', now.getFullYear())
        .single()
    : { data: null }

  const balance = invoice?.balance ?? unit.rent_amount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-xs">ET</span>
            </div>
            <span className="font-semibold text-sm opacity-90">EstateTrack</span>
          </div>
          <p className="text-sm opacity-80 mb-0.5">{property?.name}</p>
          <p className="text-3xl font-bold">Unit {unit.unit_number}</p>
          {tenant && <p className="text-sm opacity-80 mt-1">{tenant.full_name}</p>}
        </div>

        {/* Balance */}
        <div className="p-6 border-b border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
            {invoice ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]} ${now.getFullYear()} Balance` : 'Monthly Rent'}
          </p>
          <p className="text-4xl font-bold text-slate-900">{formatCurrency(balance, currency)}</p>
          {invoice?.due_date && (
            <p className="text-sm text-slate-400 mt-1">
              Due {new Date(invoice.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long' })}
            </p>
          )}
          {invoice?.status === 'paid' && (
            <p className="text-sm text-violet-600 font-medium mt-1">✅ Already paid this month</p>
          )}
        </div>

        {/* Payment options */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-700">Pay via</p>

          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-violet-800 mb-2">💳 Pay online</p>
            <p className="text-violet-700 mb-2">
              {currency === 'KES'
                ? 'Pay via M-Pesa, Airtel Money, or card — your landlord will send a payment link.'
                : 'Pay via card, Apple Pay, or Google Pay through Paddle — your landlord will send a payment link.'}
            </p>
            <p className="text-xs text-violet-600">Reference: Unit <strong>{unit.unit_number}</strong></p>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-300">
              Powered by{' '}
              <Link href="/" className="text-violet-500 hover:underline">EstateTrack</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
