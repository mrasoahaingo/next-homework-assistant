import admin from 'firebase-admin';

const serviceAccount = require('../../next-homework-assistant-firebase-adminsdk-6dj5t-f87c9a5cd1.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
