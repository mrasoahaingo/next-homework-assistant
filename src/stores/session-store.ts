import { storage } from '@/storage/firebase';
import { db } from '@/storage/firestore';
import type { Attachment } from '@/types/attachment';
import type { Session, SessionPayload } from '@/types/session';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { create } from 'zustand';

type SessionStore = {
  sessions: Record<string, Session>;
  getSession: (id: string) => Session | undefined;
  setSession: (session: Session) => void;
};

const sessionsCollection = collection(db, 'sessions');

export const useSessionsStore = create<SessionStore>((set, get) => ({
  sessions: {},
  getSession: (id: string) => get().sessions[id],
  setSession: (session: Session) =>
    set((state: { sessions: Record<string, Session> }) => ({
      sessions: { ...state.sessions, [session.id]: session },
    })),
}));

export const saveSession = async (
  session: SessionPayload,
): Promise<{ sessionId: string }> => {
  const docRef = await addDoc(sessionsCollection, session);
  return { sessionId: docRef.id };
};

onSnapshot(sessionsCollection, (snapshot) => {
  for (const change of snapshot.docChanges()) {
    if (change.type === 'added' || change.type === 'modified') {
      const session = change.doc.data() as Session;
      useSessionsStore.getState().setSession(session);
    }
  }
});

export const getSession = async (id: string) => {
  const docSnap = await getDoc(doc(sessionsCollection, id));
  return docSnap;
};

export const uploadFile = async (file: File): Promise<Attachment> => {
  const storageRef = ref(storage, `sessions/${file.name}`);

  const snapshot = await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(snapshot.ref);
  
  return {
    fileName: file.name,
    fileId: snapshot.ref.fullPath,
    fileUrl,
  };
};

export const deleteFile = async (fileId: string) => {
  const storageRef = ref(storage, fileId);
  await deleteObject(storageRef);
};
