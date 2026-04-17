import axios from "axios";

export const sendWebhook = async (type: 'admin' | 'public', payload: any) => {
  const webhookUrl = type === 'admin' ? process.env.WEBHOOK_ADMIN_URL : process.env.WEBHOOK_PUBLIC_URL;

  if (!webhookUrl) return;

  try {
    await axios.post(webhookUrl, payload);
  } catch (error) {
    console.error(`Failed to send ${type} webhook:`, error);
  }
};
