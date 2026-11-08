# Rabona payment API

The browser must never create a payment or decide its amount. The API verifies
the Firebase ID token, reads the academy price from Firestore, creates a
`pending` booking and payment record, and uses an idempotency key for retries.

## Endpoints

- `POST /api/payments` — authenticated; body: `academyId`, `planKey` (`m`, `q`,
  or `y`), and an HTTPS `returnUrl`; requires `Idempotency-Key`.
- `GET /api/payments/:paymentId` — authenticated; owners can read their own
  payment and admins can read any payment.
- `POST /api/payments/webhook` — provider-only; sends the raw JSON body with an
  HMAC-SHA256 hex signature in `x-payment-signature`.
- `POST /api/payments/:paymentId/refund` — admin-only; remains unavailable until
  a real provider adapter is configured.

Webhook processing validates the payment ID, transaction ID, amount, currency,
signature, and duplicate transaction ID. Only a verified `paid` event changes
the payment to `paid`, confirms the booking, and creates an active
subscription. Card numbers and CVV are never stored.

## Required server configuration

Run the API with Firebase Admin Application Default Credentials or a supported
service account configuration. Set:

```text
PORT=8787
WEB_APP_ORIGIN=https://your-rabona-domain.example
PAYMENT_CURRENCY=EGP
PAYMENT_WEBHOOK_SECRET=<provider webhook secret>
```

For the frontend, set `VITE_API_URL` to the public API origin when the API is
served separately (leave it empty only when the API is reverse-proxied under
the same origin):

```text
VITE_API_URL=https://api.your-rabona-domain.example
```

For UI-only testing before connecting a provider, the demo is enabled by
default. To disable it and require the real API flow, set:

```text
VITE_PAYMENT_DEMO=false
```

The default demo opens a visibly labelled multi-step checkout. It never calls the payment API,
never marks a payment as `paid`, and never activates a subscription. Remove
this flag before production.

The current provider adapter intentionally returns
`PAYMENT_PROVIDER_NOT_CONFIGURED`; this prevents test data from being treated
as a real payment. Implement the provider-specific hosted-checkout adapter in
`server/paymentProvider.ts` only after selecting a provider and obtaining its
official API and webhook documentation.

After the Firebase Auth account exists, run `npm run set-super-admin` with
server credentials. It verifies `rabonaapp@gmail.com` by Firebase Auth email
and sets the `admin` custom claim; the claim is not writable by the client.
