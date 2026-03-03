'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export function MessageButton({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: targetId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const convId = data.conversation?.id;
      if (convId) {
        router.push(`/messages?conv=${convId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick} loading={loading}>
      <MessageSquare size={13} />
      Message
    </Button>
  );
}
