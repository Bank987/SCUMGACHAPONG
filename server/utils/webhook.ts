import axios from "axios";

export type WebhookType = 'admin' | 'public' | 'gacha' | 'upgrade' | 'level';

export const renderWebhookTemplate = (template: string, values: Record<string, string | number>) => {
  return template.replace(/\{(player|function|level|result)\}/g, (placeholder, key) => {
    return values[key] === undefined ? placeholder : String(values[key]);
  });
};

export const sendWebhook = async (type: WebhookType, payload: any) => {
  let webhookUrl = process.env.WEBHOOK_PUBLIC_URL;
  
  if (type === 'admin') webhookUrl = process.env.WEBHOOK_ADMIN_URL;
  if (type === 'gacha') webhookUrl = process.env.WEBHOOK_GACHA_URL;
  if (type === 'upgrade') webhookUrl = process.env.WEBHOOK_UPGRADE_URL;
  if (type === 'level') webhookUrl = process.env.WEBHOOK_LEVEL_URL;

  if (!webhookUrl) return;

  try {
    await axios.post(webhookUrl, payload);
  } catch (error) {
    console.error(`Failed to send ${type} webhook:`, error);
  }
};
