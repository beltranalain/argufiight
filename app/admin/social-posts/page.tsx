import { redirect } from 'next/navigation'

export default function SocialPostsRedirect() {
  redirect('/admin/marketing?tab=posts')
}
