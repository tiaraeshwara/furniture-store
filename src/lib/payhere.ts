import md5 from 'md5';

export function generatePayHereHash(
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string,
  merchantSecret: string
) {
  const hashedSecret = md5(merchantSecret).toUpperCase();
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).replace(/,/g, '');

  return md5(
    merchantId + orderId + formattedAmount + currency + hashedSecret
  ).toUpperCase();
}

export function verifyPayHereNotificationHash(
  merchantId: string,
  orderId: string,
  payhereAmount: string,
  payhereCurrency: string,
  statusCode: string,
  md5sig: string,
  merchantSecret: string
): boolean {
  const hashedSecret = md5(merchantSecret).toUpperCase();
  const expectedHash = md5(
    merchantId + orderId + payhereAmount + payhereCurrency + statusCode + hashedSecret
  ).toUpperCase();

  return expectedHash === md5sig;
}