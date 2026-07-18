'use client'

import { useState } from 'react'
import { Plus, Map, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addBusRoute } from '../actions'

export function AddRouteModal({ schoolId }: { schoolId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [routeName, setRouteName] = useState('')
  const [driverName, setDriverName] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [capacity, setCapacity] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const res = await addBusRoute({
      schoolId,
      routeName,
      driverName,
      vehicleRegistration: vehiclePlate,
      capacity: parseInt(capacity, 10) || 0
    })

    setLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      setOpen(false)
      setRouteName('')
      setDriverName('')
      setVehiclePlate('')
      setCapacity('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Route</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-4">
            <Map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-xl">Add New Route</DialogTitle>
          <DialogDescription>
            Define a new transport route and assign a vehicle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="routeName">Route Name</Label>
            <Input 
              id="routeName" 
              placeholder="e.g. Westlands Route A" 
              value={routeName} 
              onChange={(e) => setRouteName(e.target.value)} 
              required 
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="driverName">Driver Name</Label>
            <Input 
              id="driverName" 
              placeholder="e.g. John Doe" 
              value={driverName} 
              onChange={(e) => setDriverName(e.target.value)} 
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Vehicle Plate</Label>
              <Input 
                id="vehiclePlate" 
                placeholder="e.g. KCA 123A" 
                value={vehiclePlate} 
                onChange={(e) => setVehiclePlate(e.target.value)} 
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input 
                id="capacity" 
                type="number" 
                min="0" 
                value={capacity} 
                onChange={(e) => setCapacity(e.target.value)} 
                className="rounded-xl"
              />
            </div>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 h-11 mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Route'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
