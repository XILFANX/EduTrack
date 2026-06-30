import { redirect } from 'next/navigation'
import Link from 'next/link'

// Root of /library redirects to dashboard
export default async function LibraryRoot() {
  redirect('/library/dashboard')
}
