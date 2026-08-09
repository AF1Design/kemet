process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Resend } from 'resend';

// Standard Resend Client Initialization
export const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing environment variable: RESEND_API_KEY');
  }
  return new Resend(apiKey);
};

// Unified Branded Sender for KEMET
export const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'KEMET <support@kemetmisr.com>';
export const SENDER_SUPPORT = SENDER_EMAIL;
export const SENDER_NOREPLY = SENDER_EMAIL;
