import { redirect } from 'next/navigation'

export default function SEORedirect() {
  redirect('/admin/content?tab=seo')
}
