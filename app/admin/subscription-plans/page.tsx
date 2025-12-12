import { redirect } from 'next/navigation'

export default function SubscriptionPlansRedirect() {
  redirect('/admin/subscriptions?tab=pricing')
}
