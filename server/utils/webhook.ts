import axios from "axios";

export type WebhookType = 'admin' | 'public' | 'gacha' | 'upgrade' | 'level' | 'task';

export const renderWebhookTemplate = (template: string, values: Record<string, string | number>) => {
  return template.replace(/\{(player|function|level|result)\}/g, (placeholder, key) => {
    return values[key] === undefined ? placeholder : String(values[key]);
  });
};

export const createWeaponLicenseWebhookPayload = (values: {
  player: string;
  functionName: string;
  levelName: string;
  message: string;
  success: boolean;
  image?: string;
}) => ({
  username: "รายงานผลใบอนุญาตครอบครองอาวุธ",
  embeds: [{
    title: values.success ? "อัปเกรดใบอนุญาตสำเร็จ" : "อัปเกรดใบอนุญาตไม่สำเร็จ",
    description: values.message,
    color: values.success ? 0x34d399 : 0xef4444,
    ...(values.image ? { thumbnail: { url: values.image } } : {}),
    fields: [
      { name: "ผู้เล่น", value: values.player, inline: true },
      { name: "ใบอนุญาต", value: values.functionName, inline: true },
      { name: "ระดับ", value: values.levelName, inline: false },
      { name: "ผลลัพธ์", value: values.success ? "สำเร็จ !" : "ไม่สำเร็จ !", inline: true }
    ],
    footer: { text: "ARMORY LICENSE SYSTEM" },
    timestamp: new Date().toISOString()
  }]
});

export const createTaskWebhookPayload = (values: {
  player: string;
  functionName: string;
  taskName: string;
  successRate: number;
  success: boolean;
  image?: string;
}) => ({
  username: "รายงานผลภารกิจ",
  embeds: [{
    title: values.success ? "สุ่มภารกิจสำเร็จ" : "สุ่มภารกิจไม่สำเร็จ",
    description: `${values.player} ทำ ${values.taskName} อัตราสำเร็จ ${values.successRate}% และผลคือ \"${values.success ? "สำเร็จ" : "ไม่สำเร็จ"}\"`,
    color: values.success ? 0x34d399 : 0xef4444,
    ...(values.image ? { thumbnail: { url: values.image } } : {}),
    fields: [
      { name: "ผู้เล่น", value: values.player, inline: true },
      { name: "ฟังก์ชัน", value: values.functionName, inline: true },
      { name: "ภารกิจ", value: values.taskName, inline: false },
      { name: "อัตราสำเร็จ", value: `${values.successRate}%`, inline: true },
      { name: "ผลลัพธ์", value: values.success ? "สำเร็จ !" : "ไม่สำเร็จ !", inline: true }
    ],
    footer: { text: "MISSION TASK SYSTEM" },
    timestamp: new Date().toISOString()
  }]
});

export const sendWebhook = async (type: WebhookType, payload: any) => {
  let webhookUrl = process.env.WEBHOOK_PUBLIC_URL;
  
  if (type === 'admin') webhookUrl = process.env.WEBHOOK_ADMIN_URL;
  if (type === 'gacha') webhookUrl = process.env.WEBHOOK_GACHA_URL;
  if (type === 'upgrade') webhookUrl = process.env.WEBHOOK_UPGRADE_URL;
  if (type === 'level') webhookUrl = process.env.WEBHOOK_LEVEL_URL;
  if (type === 'task') webhookUrl = process.env.WEBHOOK_TASK_URL;

  if (!webhookUrl) return;

  try {
    await axios.post(webhookUrl, payload);
  } catch (error) {
    console.error(`Failed to send ${type} webhook:`, error);
  }
};
