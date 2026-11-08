import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (getApps().length === 0) initializeApp();

const email = process.env.SUPER_ADMIN_EMAIL || 'rabonaapp@gmail.com';
const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { admin: true });
console.log(`Granted admin claim to ${email} (${user.uid}).`);
