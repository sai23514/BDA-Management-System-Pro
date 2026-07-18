import { env, isTwilioConfigured } from '../config/env.js';

export type Channel = 'sms' | 'whatsapp';

export interface SendMessageResult {
  sid: string;
}

/**
 * Send an SMS or WhatsApp message via the Twilio REST API using native
 * `fetch` (Node 20+). Throws a clear error when Twilio is not configured.
 */
export const sendMessage = async (
  channel: Channel,
  to: string,
  body: string,
): Promise<SendMessageResult> => {
  if (!isTwilioConfigured) {
    throw new Error(
      'Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in the server environment.',
    );
  }

  const sender = channel === 'whatsapp' ? env.TWILIO_WHATSAPP_FROM : env.TWILIO_SMS_FROM;
  if (!sender) {
    throw new Error(`No Twilio sender number configured for channel "${channel}".`);
  }

  const toAddr = channel === 'whatsapp' ? `whatsapp:${to}` : to;
  const fromAddr =
    channel === 'whatsapp' && !sender.startsWith('whatsapp:') ? `whatsapp:${sender}` : sender;

  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const params = new URLSearchParams({ To: toAddr, From: fromAddr, Body: body });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: params.toString(),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Twilio request failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { sid: string };
  return { sid: data.sid };
};
