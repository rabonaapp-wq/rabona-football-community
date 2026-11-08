import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (getApps().length === 0) initializeApp({ projectId: 'rabona-eg' });

const email = 'rabonaapp@gmail.com';
const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, {
  ...(user.customClaims || {}),
  admin: true,
  superAdmin: true,
});
console.log(`Granted admin and super-admin claims to ${email} (${user.uid}).`);
