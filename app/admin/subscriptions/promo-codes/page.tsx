import { redirect } from 'next/navigation'

export default function PromoCodesRedirect() {
  redirect('/admin/subscriptions?tab=promo-codes')
}
