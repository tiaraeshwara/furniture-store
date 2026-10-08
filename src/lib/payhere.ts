import { timingSafeEqual } from "node:crypto";
import md5 from "md5";

export function formatPayHereAmount(amount: number) {
  return amount.toFixed(2);
}

export function generatePayHereHash(
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string,
  merchantSecret: string,
) {
  const hashedSecret = md5(merchantSecret).toUpperCase();
  return md5(
    merchantId +
      orderId +
      formatPayHereAmount(amount) +
      currency +
      hashedSecret,
  ).toUpperCase();
}

export function verifyPayHereNotificationHash(
  merchantId: string,
  orderId: string,
  payhereAmount: string,
  payhereCurrency: string,
  statusCode: string,
  signature: string,
  merchantSecret: string,
) {
  const hashedSecret = md5(merchantSecret).toUpperCase();
  const expected = md5(
    merchantId +
      orderId +
      payhereAmount +
      payhereCurrency +
      statusCode +
      hashedSecret,
  ).toUpperCase();
  const expectedBuffer = Buffer.from(expected, "ascii");
  const signatureBuffer = Buffer.from(signature.toUpperCase(), "ascii");
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}
