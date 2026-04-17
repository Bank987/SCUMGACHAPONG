import axios from "axios";

export type WebhookType = 'admin' | 'public' | 'gacha' | 'upgrade';

export const sendWebhook = async (type: WebhookType, payload: any) => {
  let webhookUrl = process.env.WEBHOOK_PUBLIC_URL;
  
  if (type === 'admin') webhookUrl = process.env.WEBHOOK_ADMIN_URL;
  if (type === 'gacha') webhookUrl = process.env.WEBHOOK_GACHA_URL;
  if (type === 'upgrade') webhookUrl = process.env.WEBHOOK_UPGRADE_URL;

  if (!webhookUrl) return;

  try {
    await axios.post(webhookUrl, payload);
  } catch (error) {
    console.error(`Failed to send ${type} webhook:`, error);
  }
};
