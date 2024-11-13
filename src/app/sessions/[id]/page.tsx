import { AssistantSession } from '@/components/sessions/assistant-session';
import { ChatSession } from '@/components/sessions/chat-session';
import { getSession } from '@/stores/session-store';
import type { Session } from '@/types/session';
import { notFound } from 'next/navigation';

export default async function SessionPage(props: { params: { id: string } }) {
  const params = await props.params;

  const snapshot = await getSession(params.id);

  if (!snapshot.exists) {
    return notFound();
  }

  const session = { ...snapshot.data(), id: snapshot.id } as Session;

  if (session.threadId) {
    return <AssistantSession threadId={session.threadId} />;
  }

  return <ChatSession session={session} />;
}
