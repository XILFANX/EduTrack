'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Building2, ChevronDown } from 'lucide-react'

interface Property {
  id: string
  name: string
}

export function PropertySelector({ properties }: { properties: Property[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPropertyId = searchParams.get('property') ?? 'all'

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value
      const params = new URLSearchParams(searchParams.toString())
      if (val === 'all') {
        params.delete('property')
      } else {
        params.set('property', val)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="relative flex items-center gap-2 min-w-0">
      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="relative">
        <select
          value={currentPropertyId}
          onChange={handleChange}
          className="appearance-none bg-transparent text-sm font-medium text-foreground pr-6 py-0.5 focus:outline-none cursor-pointer max-w-[200px] truncate"
          aria-label="Select property"
        >
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      </div>
    </div>
  )
}
