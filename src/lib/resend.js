import { Resend } from 'resend';

export const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY || 're_placeholder_key';
  return new Resend(apiKey);
};

export const resend = new Proxy({}, {
  get(target, prop) {
    const client = getResendClient();
    return client[prop];
  }
});

export const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'KEMET Sportswear <noreply@kemetmisr.com>';
