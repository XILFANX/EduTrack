import { redirect } from 'next/navigation'

export default function AdminDocsRoot() {
  // Redirect to the first document by default
  redirect('/admin/docs/00-mission-and-overview')
}
