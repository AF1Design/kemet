import { Resend } from 'resend';

// Standard Resend Client Initialization
export const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing environment variable: RESEND_API_KEY');
  }
  return new Resend(apiKey);
};

export const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'KEMET Sportswear <noreply@kemetmisr.com>';
