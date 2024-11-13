'use client';

import { SessionCard } from '@/components/sessions/session-card';
import { Button } from '@/components/ui/button';
import { db } from '@/storage/firestore';
import { subscribeToDocuments } from '@/storage/utils/subscribe';
import type { Session } from '@/types/session';
import { collection, query } from '@firebase/firestore';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = React.useState<Session[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, 'sessions'));
    
    return subscribeToDocuments(q, [], setSessions);
  }, []);


  const handleCreateSession = () => {
    router.push('/sessions/create');
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleCreateSession}>
        <PlusIcon />
        Create Session
      </Button>
      <div className="flex flex-col gap-4">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
