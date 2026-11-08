import crypto from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getPaymentProvider } from './paymentProvider';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const firebaseAuth = getAuth();
const app = express();
const port = Number(process.env.PORT || 8787);
const currency = process.env.PAYMENT_CURRENCY || 'EGP';
const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
const allowedOrigin = process.env.WEB_APP_ORIGIN;

app.disable('x-powered-by');
app.use((request, response, next) => {
  if (allowedOrigin && request.headers.origin === allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }
  next();
});

type AuthenticatedRequest = Request & { user?: { uid: string; email?: string; admin: boolean } };

async function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const token = await firebaseAuth.verifyIdToken(header.slice('Bearer '.length));
    request.user = {
      uid: token.uid,
      email: token.email,
      admin: token.admin === true,
    };
    next();
  } catch {
    response.status(401).json({ error: 'Invalid authentication token' });
  }
}

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function planPrice(basePrice: unknown, planKey: unknown): number | null {
  if (typeof basePrice !== 'number' || !Number.isFinite(basePrice) || basePrice < 0) return null;
  if (planKey === 'm') return basePrice;
  if (planKey === 'q') return Math.round((basePrice * 3 * 0.9) / 10) * 10;
  if (planKey === 'y') return Math.round((basePrice * 12 * 0.75) / 10) * 10;
  return null;
}

function paymentIdFor(uid: string, idempotencyKey: string) {
  return `pay_${crypto.createHash('sha256').update(`${uid}:${idempotencyKey}`).digest('hex').slice(0, 40)}`;
}

function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const supplied = Buffer.from(signature, 'utf8');
  const calculated = Buffer.from(expected, 'utf8');
  return supplied.length === calculated.length && crypto.timingSafeEqual(supplied, calculated);
}

app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '256kb' }), async (request, response) => {
  const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.from('');
  if (!verifyWebhookSignature(rawBody, request.header('x-payment-signature'))) {
    response.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  try {
    const payload = JSON.parse(rawBody.toString('utf8')) as {
      paymentId?: unknown;
      transactionId?: unknown;
      status?: unknown;
      amount?: unknown;
      currency?: unknown;
    };
    if (!isValidId(payload.paymentId) || !isValidId(payload.transactionId) ||
      typeof payload.amount !== 'number' || payload.currency !== currency ||
      !['paid', 'failed', 'cancelled', 'refunded'].includes(String(payload.status))) {
      response.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }
    const paymentId = payload.paymentId;
    const transactionId = payload.transactionId;

    const paymentRef = db.collection('payments').doc(paymentId);
    const transactionRef = db.collection('paymentTransactions').doc(
      crypto.createHash('sha256').update(transactionId).digest('hex')
    );
    await db.runTransaction(async (transaction) => {
      const [paymentSnapshot, transactionSnapshot] = await Promise.all([
        transaction.get(paymentRef),
        transaction.get(transactionRef),
      ]);
      if (transactionSnapshot.exists) return;
      if (!paymentSnapshot.exists) throw new Error('PAYMENT_NOT_FOUND');
      const payment = paymentSnapshot.data()!;
      if (payment.amount !== payload.amount || payment.currency !== payload.currency) {
        throw new Error('PAYMENT_AMOUNT_MISMATCH');
      }

      const nextStatus = String(payload.status);
      transaction.set(transactionRef, {
        paymentId,
        transactionId,
        receivedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(paymentRef, {
        status: nextStatus,
        providerTransactionId: transactionId,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (nextStatus === 'paid') {
        transaction.set(db.collection('subscriptions').doc(paymentId), {
          userUid: payment.userUid,
          academyId: payment.academyId,
          planKey: payment.planKey,
          amount: payment.amount,
          currency: payment.currency,
          status: 'active',
          paymentId,
          activatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.update(db.collection('bookings').doc(payment.bookingId), {
          status: 'confirmed',
          amount: payment.amount,
          paymentId,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    response.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    const status = message === 'PAYMENT_NOT_FOUND' ? 404 : message === 'PAYMENT_AMOUNT_MISMATCH' ? 400 : 500;
    response.status(status).json({ error: message });
  }
});

app.use(express.json({ limit: '64kb' }));

app.post('/api/payments', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  const idempotencyKey = request.header('idempotency-key');
  const { academyId, planKey, returnUrl } = request.body as {
    academyId?: unknown;
    planKey?: unknown;
    returnUrl?: unknown;
  };
  if (!idempotencyKey || idempotencyKey.length > 128 || !isValidId(academyId) ||
    !['m', 'q', 'y'].includes(String(planKey)) || typeof returnUrl !== 'string' ||
    !/^https?:\/\//.test(returnUrl)) {
    response.status(400).json({ error: 'Invalid payment request' });
    return;
  }
  let returnOrigin: string;
  try {
    const parsedReturnUrl = new URL(returnUrl);
    returnOrigin = parsedReturnUrl.origin;
    if (parsedReturnUrl.protocol !== 'https:' || !allowedOrigin || returnOrigin !== allowedOrigin) {
      response.status(400).json({ error: 'Invalid return URL' });
      return;
    }
  } catch {
    response.status(400).json({ error: 'Invalid return URL' });
    return;
  }

  let createdPaymentId: string | null = null;
  try {
    const academySnapshot = await db.collection('academies').doc(academyId).get();
    if (!academySnapshot.exists) {
      response.status(404).json({ error: 'Academy not found' });
      return;
    }
    const academy = academySnapshot.data()!;
    const amount = planPrice(academy.price, planKey);
    if (amount === null) {
      response.status(400).json({ error: 'Invalid plan' });
      return;
    }

    const paymentId = paymentIdFor(request.user!.uid, idempotencyKey);
    createdPaymentId = paymentId;
    const paymentRef = db.collection('payments').doc(paymentId);
    const bookingRef = db.collection('bookings').doc(`booking_${paymentId}`);
    const payment = {
      id: paymentId,
      bookingId: bookingRef.id,
      userUid: request.user!.uid,
      academyId,
      planKey,
      amount,
      currency,
      status: 'pending',
      idempotencyKey,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(paymentRef);
      if (existing.exists) return;
      transaction.set(paymentRef, payment);
      transaction.set(bookingRef, {
        id: bookingRef.id,
        userUid: request.user!.uid,
        academyId,
        planKey,
        planName: planKey === 'm' ? 'اشتراك شهري' : planKey === 'q' ? '3 شهور' : 'سنوي',
        date: new Date().toISOString(),
        status: 'pending',
        paymentId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const provider = getPaymentProvider();
    const checkout = await provider.createCheckout({
      paymentId,
      amount,
      currency,
      description: `Rabona academy subscription ${academyId}`,
      customerEmail: request.user!.email || '',
      returnUrl,
    }, idempotencyKey);
    await paymentRef.update({
      status: 'processing',
      checkoutUrl: checkout.checkoutUrl,
      providerTransactionId: checkout.providerTransactionId || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    response.status(201).json({ paymentId, status: 'processing', checkoutUrl: checkout.checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment creation failed';
    if (createdPaymentId) {
      await db.collection('payments').doc(createdPaymentId).set({
        status: message === 'PAYMENT_PROVIDER_NOT_CONFIGURED' ? 'failed' : 'pending',
        failureReason: message,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    response.status(message === 'PAYMENT_PROVIDER_NOT_CONFIGURED' ? 503 : 500).json({ error: message });
  }
});

app.get('/api/payments/:paymentId', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  if (!isValidId(request.params.paymentId)) {
    response.status(400).json({ error: 'Invalid payment id' });
    return;
  }
  const snapshot = await db.collection('payments').doc(request.params.paymentId).get();
  if (!snapshot.exists) {
    response.status(404).json({ error: 'Payment not found' });
    return;
  }
  const payment = snapshot.data()!;
  if (payment.userUid !== request.user!.uid && !request.user!.admin) {
    response.status(403).json({ error: 'Forbidden' });
    return;
  }
  response.json({
    paymentId: snapshot.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    updatedAt: payment.updatedAt || null,
  });
});

app.post('/api/payments/:paymentId/refund', requireAuth, async (request: AuthenticatedRequest, response: Response) => {
  if (!request.user!.admin) {
    response.status(403).json({ error: 'Admin access required' });
    return;
  }
  response.status(503).json({ error: 'Refund provider is not configured' });
});

app.listen(port, () => {
  console.log(`Rabona API listening on port ${port}`);
});
