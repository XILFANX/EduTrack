'use client'

import { useState } from 'react'
import { Plus, BookOpen, Loader2 } from 'lucide-react'
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
import { addBook } from '../actions'

export function AddBookModal({ schoolId }: { schoolId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [copies, setCopies] = useState('1')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const res = await addBook({
      schoolId,
      title,
      author,
      isbn,
      copies: parseInt(copies, 10) || 1
    })

    setLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      setOpen(false)
      setTitle('')
      setAuthor('')
      setIsbn('')
      setCopies('1')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <DialogTitle className="text-xl">Add New Book</DialogTitle>
          <DialogDescription>
            Enter the details of the book to add to the library inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Book Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. Things Fall Apart" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input 
              id="author" 
              placeholder="e.g. Chinua Achebe" 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)} 
              required 
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN (Optional)</Label>
              <Input 
                id="isbn" 
                placeholder="e.g. 978-0385474542" 
                value={isbn} 
                onChange={(e) => setIsbn(e.target.value)} 
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="copies">Copies</Label>
              <Input 
                id="copies" 
                type="number" 
                min="1" 
                value={copies} 
                onChange={(e) => setCopies(e.target.value)} 
                required 
                className="rounded-xl"
              />
            </div>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 h-11 mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Inventory'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
