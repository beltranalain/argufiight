import type { Metadata } from 'next';
import { AdminDebatesClient } from './admin-debates-client';

export const metadata: Metadata = { title: 'Admin — Debates' };

export default function AdminDebatesPage() {
  return <AdminDebatesClient />;
}
