import { redirect } from 'next/navigation'

export default function LegalRedirect() {
  redirect('/admin/content?tab=legal')
}
