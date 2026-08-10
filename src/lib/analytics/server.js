/**
 * Server-Side Conversions API (CAPI) & Events API Ready Architecture
 * Executes strictly on the server (e.g. within Server Actions).
 * Does NOT execute or make network calls if environment credentials are absent.
 */

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;

const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

/**
 * Server-side Meta Conversions API (CAPI) Purchase Handler
 */
export async function sendServerMetaPurchase(order, clientIp = null, userAgent = null) {
  if (!META_ACCESS_TOKEN || !META_PIXEL_ID || !order) {
    return { skipped: true, reason: 'Meta Server Credentials not configured' };
  }

  try {
    const payload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: String(order.id || ''),
          action_source: 'website',
          user_data: {
            client_ip_address: clientIp,
            client_user_agent: userAgent
          },
          custom_data: {
            currency: 'EGP',
            value: Number(order.total ?? order.total_amount ?? 0),
            order_id: String(order.id || '')
          }
        }
      ]
    };

    const response = await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Server-side TikTok Events API Purchase Handler
 */
export async function sendServerTikTokPurchase(order, clientIp = null, userAgent = null) {
  if (!TIKTOK_ACCESS_TOKEN || !TIKTOK_PIXEL_ID || !order) {
    return { skipped: true, reason: 'TikTok Server Credentials not configured' };
  }

  try {
    const payload = {
      event_source: 'web',
      event_source_id: TIKTOK_PIXEL_ID,
      data: [
        {
          event: 'CompletePayment',
          event_time: Math.floor(Date.now() / 1000),
          event_id: String(order.id || ''),
          user: {
            ip: clientIp,
            user_agent: userAgent
          },
          properties: {
            currency: 'EGP',
            value: Number(order.total ?? order.total_amount ?? 0)
          }
        }
      ]
    };

    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': TIKTOK_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
}
