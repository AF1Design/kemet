import { Resend } from 'resend';

// Resend Instance configured with environment variable
export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');

export const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'KEMET Sportswear <noreply@kemetmisr.com>';
