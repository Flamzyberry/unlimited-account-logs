export function getFlutterwaveSecretKey() {
  return process.env.FLW_SECRET_KEY || '';
}

export async function createFlutterwavePayment(input: {
  txRef: string;
  amount: number;
  email: string;
  name?: string | null;
  phone?: string | null;
  redirectUrl: string;
}) {
  const secretKey = getFlutterwaveSecretKey();
  if (!secretKey) throw new Error('FLW_SECRET_KEY is not configured');

  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amount,
      currency: 'NGN',
      redirect_url: input.redirectUrl,
      customer: {
        email: input.email,
        ...(input.name ? { name: input.name } : {}),
        ...(input.phone ? { phonenumber: input.phone } : {}),
      },
      customizations: {
        title: 'Unlimited Account Logs',
        description: 'Digital product order',
      },
      configurations: {
        session_duration: 30,
        max_retry_attempt: 5,
      },
    }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== 'success' || !payload?.data?.link) {
    throw new Error(payload?.message || 'Flutterwave could not create the payment.');
  }

  return payload.data.link as string;
}

export async function verifyFlutterwaveTransaction(transactionId: string) {
  const secretKey = getFlutterwaveSecretKey();
  if (!secretKey) throw new Error('FLW_SECRET_KEY is not configured');

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== 'success') {
    throw new Error(payload?.message || 'Flutterwave transaction verification failed.');
  }

  return payload.data;
}
