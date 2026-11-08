import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || '';

interface CreatePaymentInput {
  academyId: string;
  planKey: 'm' | 'q' | 'y';
  returnUrl: string;
}

interface CreatePaymentResponse {
  paymentId: string;
  status: 'pending' | 'processing';
  checkoutUrl: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error('AUTH_REQUIRED');

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => null)) as
    | CreatePaymentResponse
    | { error?: string }
    | null;
  if (!response.ok || !payload || !('checkoutUrl' in payload)) {
    throw new Error(payload && 'error' in payload && payload.error ? payload.error : 'PAYMENT_FAILED');
  }
  return payload;
}
