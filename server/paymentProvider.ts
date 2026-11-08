export interface CheckoutRequest {
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  returnUrl: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  providerTransactionId?: string;
}

export interface PaymentProvider {
  createCheckout(request: CheckoutRequest, idempotencyKey: string): Promise<CheckoutResponse>;
  refund?(providerTransactionId: string, idempotencyKey: string): Promise<void>;
}

export class UnavailablePaymentProvider implements PaymentProvider {
  async createCheckout(): Promise<CheckoutResponse> {
    throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new UnavailablePaymentProvider();
}
