import { redirect } from 'next/navigation'

export default function FeaturesRedirect() {
  redirect('/admin/settings?tab=features')
}
