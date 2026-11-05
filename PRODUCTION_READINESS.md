# Rabona Production Readiness

Status date: 2026-11-05

## Verified

- PASS - `npm run lint` passes.
- PASS - `npm run build` passes.
- PASS - Firestore rules compile with Firebase CLI dry-run.
- PASS - Composite indexes are declared in `firestore.indexes.json`.
- FIXED - Public profile reads now use `publicProfiles/{uid}` instead of exposing private user documents.
- FIXED - Admin UI access no longer treats academy role as administrator access.
- FIXED - Browser users cannot self-assign admin through the user creation rule.
- FIXED - Post feed query includes public posts or the current user's own posts.
- FIXED - Like counter transitions are tied to the matching like document in atomic writes.
- FIXED - Comment updates are limited to the author's text and timestamp.
- FIXED - Notification creation is no longer open to every authenticated user.
- FIXED - Academy details load directly from Firestore when local cache is missing.
- FIXED - Academy plan selection creates a `pending` booking request.
- FIXED - Account deletion removes core profile documents, owned posts, bookings, and Firebase Auth after recent Google reauthentication.
- FIXED - Firebase CLI project alias now points to `rabona-eg`.

## Pending External Actions

- PENDING - Enable Firebase Storage in the `rabona-eg` Firebase Console. The code and Storage rules are present, but the project currently reports Storage as not set up.
- PENDING - Provision administrator access using Firebase Admin SDK custom claim `admin: true` or an `admins/{uid}` document. Do not create this through the browser.
- PENDING - Deploy `firestore.rules`, `storage.rules`, and `firestore.indexes.json` after reviewing them in the Firebase Console.
- PENDING - Configure authorized domains for Google Authentication.
- PENDING - Enable and validate Firebase App Check before production enforcement.
- PENDING - Configure a trusted product catalog and payment provider before enabling paid orders.
- PENDING - Decide and implement a server-side cleanup job for Storage files and expired stories.
- PENDING - Run Firebase Emulator Suite security tests with separate player, coach, admin, and unauthenticated identities.

## Known Gaps

- FAIL - Store products are currently empty and orders remain browser-local; this is not a production commerce flow.
- FAIL - AdminDashboard still contains local/demo state and is not a complete persistent administration system.
- FAIL - Story and some profile media flows still use data URLs instead of durable Storage paths.
- FAIL - Booking capacity and duplicate-booking protection require a trusted transaction or backend function before accepting real subscriptions.
- FAIL - Account deletion does not yet delete Storage media or nested likes/comments for every owned post.
- WARN - Vite reports a future `__dirname` compatibility warning and the main JavaScript bundle is larger than 500 kB.

## Deployment Sequence

1. Review and back up the Firebase project.
2. Enable Storage and configure its bucket.
3. Provision admin claim/document through trusted tooling.
4. Run emulator security tests.
5. Deploy rules and indexes:

   `npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage`

6. Deploy the web build through the approved hosting pipeline.
7. Verify login, signup, feed, upload, academy discovery, booking request, and logout on desktop and mobile.
8. Enable App Check enforcement only after legitimate traffic is validated.

No production data was modified by this audit. The rules dry-run was performed without deployment.
