import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function FeeStructuresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user?.id)
    .single()

  const { data: structures } = await supabase
    .from('fee_structures')
    .select('*, academic_terms(name), classes(name)')
    .eq('school_id', profile?.school_id)

  const formatKES = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Structures</h1>
          <p className="text-sm text-muted-foreground mt-1">Define standard fees for each class and term.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
          <Plus className="w-4 h-4" />
          New Structure
        </Button>
      </div>

      {!structures || structures.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No fee structures yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            Create a fee structure (e.g. "Term 1 Tuition") to start billing students automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map((s) => (
            <Card key={s.id} className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex justify-between items-start">
                  <span>{s.description || 'General Fee'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatKES(s.amount)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Term: <span className="text-foreground font-medium">{s.academic_terms?.name || 'All Terms'}</span></p>
                  <p>Class: <span className="text-foreground font-medium">{s.classes?.name || 'Whole School'}</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
