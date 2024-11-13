import {
  type DocumentReference,
  type Query,
  onSnapshot,
} from '@firebase/firestore';

type Callback<T> = (documents: T[]) => T[];

export const subscribeToDocuments = <T extends { id: string }>(
  query: Query,
  documents: T[],
  setDocuments: (cb: Callback<T>) => void,
) => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    for (const change of snapshot.docChanges()) {
      const data = change.doc.data();

      const updatedDocument = {
        id: change.doc.id,
        ...data,
      } as T;

      const existingDocument = documents.find(
        (document) => document.id === updatedDocument.id,
      );

      if (change.type === 'added' && !existingDocument) {
        setDocuments((prevDocuments) => [
          ...prevDocuments,
          updatedDocument,
        ]);
      }

      if (change.type === 'modified') {
        setDocuments((prevDocuments) =>
          prevDocuments.map((document) =>
            document.id === updatedDocument.id ? updatedDocument : document,
          ),
        );
      }

      if (change.type === 'removed') {
        setDocuments((prevDocuments) =>
          prevDocuments.filter((document) => document.id !== change.doc.id),
        );
      }
    }
  });

  return unsubscribe;
};

export const subscribeToDocument = <T extends { id: string }>(
  query: DocumentReference,
  setDocument: (document: T) => void,
) => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    const document = {
      id: snapshot.id,
      ...snapshot.data(),
    } as T;

    setDocument(document);
  });

  return unsubscribe;
};
