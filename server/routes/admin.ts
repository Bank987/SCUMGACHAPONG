import express from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Case } from "../models/Case.js";
import { Settings } from "../models/Settings.js";
import { CheatLog } from "../models/CheatLog.js";
import { SpinHistory } from "../models/SpinHistory.js";
import { TaskHistory } from "../models/TaskHistory.js";
import { createWeaponLicenseWebhookPayload, renderWebhookTemplate, sendWebhook } from "../utils/webhook.js";

const router = express.Router();
const ADMIN_PIN = process.env.ADMIN_PIN || "123456";

function validateGuarantee(caseData: any) {
  if (!caseData.guaranteeEnabled) return null;
  const every = Number(caseData.guaranteeEvery);
  if (!Number.isInteger(every) || every < 1) return "จำนวนรอบการันตีต้องเป็นเลขจำนวนเต็มอย่างน้อย 1";

  const guaranteedItem = caseData.items?.find((item: any) => String(item._id) === String(caseData.guaranteeItemId));
  if (!guaranteedItem) return "กรุณาเลือกไอเทมการันตีที่อยู่ในกล่องนี้ (กล่องใหม่ต้องบันทึกไอเทมก่อน)";
  if (guaranteedItem.rarity?.toLowerCase() !== "mythic") return "ไอเทมการันตีต้องเป็นระดับ Mythic เท่านั้น";
  return null;
}

function clampInteger(value: any, min: number, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

function requireDatabase(res: express.Response) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "Database not connected. Check MONGODB_URI and MongoDB network access." });
    return false;
  }
  return true;
}

function validateCasePayload(caseData: any) {
  if (!caseData || typeof caseData !== "object") return "ข้อมูลกล่องไม่ถูกต้อง";
  if (typeof caseData.name !== "string" || !caseData.name.trim()) return "กรุณากรอกชื่อกล่อง";
  if (typeof caseData.image !== "string" || !caseData.image.trim()) return "กรุณากรอกลิงก์รูปกล่อง";
  if (!Number.isFinite(Number(caseData.price)) || Number(caseData.price) < 0) return "ราคากล่องต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป";
  if (!Array.isArray(caseData.items)) return "รายการไอเทมในกล่องไม่ถูกต้อง";

  for (const [index, item] of caseData.items.entries()) {
    if (!item || typeof item !== "object") return `ไอเทมลำดับที่ ${index + 1} ไม่ถูกต้อง`;
    if (typeof item.name !== "string" || !item.name.trim()) return `กรุณากรอกชื่อไอเทมลำดับที่ ${index + 1}`;
    if (typeof item.image !== "string" || !item.image.trim()) return `กรุณากรอกลิงก์รูปไอเทมลำดับที่ ${index + 1}`;
    if (typeof item.rarity !== "string" || !item.rarity.trim()) return `กรุณาระบุระดับไอเทมลำดับที่ ${index + 1}`;
    if (!Number.isFinite(Number(item.dropRate)) || Number(item.dropRate) < 0) return `อัตราดรอปไอเทมลำดับที่ ${index + 1} ไม่ถูกต้อง`;
    if (typeof item.color !== "string" || !item.color.trim()) return `กรุณาระบุสีไอเทมลำดับที่ ${index + 1}`;
  }

  return null;
}

function getDatabaseError(error: any) {
  if (error?.name === "ValidationError") {
    const message = Object.values(error.errors || {})
      .map((entry: any) => entry.message)
      .filter(Boolean)
      .join(", ");
    return message || "ข้อมูลกล่องไม่ผ่านการตรวจสอบ";
  }
  if (error?.name === "CastError") return `ข้อมูล ID ไม่ถูกต้อง: ${error.path}`;
  if (error?.code === 11000) return "ข้อมูลกล่องซ้ำกับข้อมูลเดิม";
  return "ไม่สามารถบันทึกข้อมูลกล่องได้ กรุณาตรวจสอบฐานข้อมูลและข้อมูลที่กรอก";
}

function normalizeCasePayload(caseData: any) {
  const normalized = {
    name: caseData.name.trim(),
    description: typeof caseData.description === "string" ? caseData.description : "",
    image: caseData.image.trim(),
    price: Number(caseData.price),
    category: typeof caseData.category === "string" ? caseData.category : "1",
    guaranteeEnabled: Boolean(caseData.guaranteeEnabled),
    guaranteeEvery: Number(caseData.guaranteeEvery || 0),
    guaranteeItemId: caseData.guaranteeItemId || null,
    items: caseData.items.map((item: any) => ({
      ...(item._id ? { _id: item._id } : {}),
      name: item.name.trim(),
      image: item.image.trim(),
      rarity: item.rarity.trim(),
      dropRate: Number(item.dropRate),
      color: item.color.trim()
    }))
  };

  if (!normalized.guaranteeEnabled) {
    normalized.guaranteeEvery = 0;
    normalized.guaranteeItemId = null;
  }

  return normalized;
}

router.use(async (req, res, next) => {
  try {
    const pin = req.headers["x-admin-pin"];
    if (pin !== ADMIN_PIN) {
      return res.status(403).json({ error: "Forbidden: Invalid Admin PIN" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users || []);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { gameName, spins, upgradePoints, levelTickets, taskPoints, weaponLicenseLevel, allowedCases, isBanned, banReason, cheatWarnings } = req.body;

    const updateData: any = {};
    if (gameName !== undefined) {
      if (typeof gameName !== "string") return res.status(400).json({ error: "gameName must be a string" });
      const normalizedGameName = gameName.trim();
      if (normalizedGameName.length < 2 || normalizedGameName.length > 32) {
        return res.status(400).json({ error: "ชื่อในเกมต้องมีความยาว 2-32 ตัวอักษร" });
      }
      const duplicate = await User.exists({
        _id: { $ne: req.params.id },
        gameName: { $regex: `^${normalizedGameName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
      });
      if (duplicate) return res.status(409).json({ error: "ชื่อในเกมนี้ถูกใช้งานแล้ว" });
      updateData.gameName = normalizedGameName;
      updateData.gameNameLocked = true;
    }
    if (spins !== undefined) updateData.spins = spins;
    if (upgradePoints !== undefined) updateData.upgradePoints = upgradePoints;
    if (levelTickets !== undefined) {
      const value = clampInteger(levelTickets, 0, Number.MAX_SAFE_INTEGER);
      if (value === null) return res.status(400).json({ error: "levelTickets must be a number" });
      updateData.levelTickets = value;
    }
    if (taskPoints !== undefined) {
      const value = clampInteger(taskPoints, 0, Number.MAX_SAFE_INTEGER);
      if (value === null) return res.status(400).json({ error: "taskPoints must be a number" });
      updateData.taskPoints = value;
    }
    if (weaponLicenseLevel !== undefined) {
      const value = clampInteger(weaponLicenseLevel, 0, 15);
      if (value === null) return res.status(400).json({ error: "weaponLicenseLevel must be a number" });
      updateData.weaponLicenseLevel = value;
    }
    if (allowedCases !== undefined) updateData.allowedCases = allowedCases;
    if (isBanned !== undefined) updateData.isBanned = isBanned;
    if (banReason !== undefined) updateData.banReason = banReason;
    if (cheatWarnings !== undefined) updateData.cheatWarnings = cheatWarnings;

    const oldUser = await User.findById(req.params.id);
    const user = await User.findOneAndUpdate({ _id: req.params.id }, { $set: updateData }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Track admin manual ban/unban
    if (oldUser && oldUser.isBanned !== user.isBanned) {
      await CheatLog.create({
        userId: user._id,
        action: user.isBanned ? "ADMIN BANNED" : "ADMIN UNBANNED",
        cheatType: "Manual Action",
        description: user.isBanned ? `แบนโดยแอดมิน: ${user.banReason}` : "ปลดแบนโดยแอดมิน"
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/users/:id/weapon-license-access", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        levelTickets: { $gte: 1 },
        $or: [
          { weaponLicenseLevel: { $lt: 15 } },
          { weaponLicenseLevel: { $exists: false } }
        ]
      },
      {
        $inc: {
          levelTickets: -1,
          weaponLicenseLevel: 1
        }
      },
      { new: true }
    );

    if (!user) {
      const checkUser = await User.findById(req.params.id);
      if (!checkUser) return res.status(404).json({ error: "User not found" });
      if (Number(checkUser.weaponLicenseLevel || 0) >= 15) return res.status(400).json({ error: "Weapon license is already at max level" });
      if (Number(checkUser.levelTickets || 0) < 1) return res.status(400).json({ error: "Insufficient TIER Access" });
      return res.status(409).json({ error: "Weapon license data changed, please retry" });
    }

    const settings = await Settings.findOne({}) || new Settings();
    const levelName = settings.weaponLicenseLevelNames?.[user.weaponLicenseLevel - 1] || `LEVEL ${user.weaponLicenseLevel}`;
    const message = renderWebhookTemplate(settings.weaponLicenseWebhookSuccessMessage, {
      player: user.gameName || user.username,
      function: settings.weaponLicenseName,
      level: levelName,
      result: "สำเร็จ !"
    });

    void sendWebhook("level", createWeaponLicenseWebhookPayload({
      player: user.gameName || user.username,
      functionName: settings.weaponLicenseName,
      levelName,
      message,
      success: true,
      image: settings.weaponLicenseImage
    }));

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await Promise.all([
      SpinHistory.deleteMany({ userId: user._id }),
      TaskHistory.deleteMany({ userId: user._id }),
      CheatLog.deleteMany({ userId: user._id }),
      User.deleteOne({ _id: user._id })
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/users", async (req, res) => {
  try {
    await Promise.all([
      SpinHistory.deleteMany({}),
      TaskHistory.deleteMany({}),
      CheatLog.deleteMany({}),
      User.deleteMany({})
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/cases", async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const cases = await Case.find({});
    res.json(cases || []);
  } catch (err) {
    console.error("Admin fetch cases error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cases", async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const validationError = validateCasePayload(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const caseData = normalizeCasePayload(req.body);
    const guaranteeError = validateGuarantee(caseData);
    if (guaranteeError) return res.status(400).json({ error: guaranteeError });
    const newCase = await Case.create(caseData);
    res.json(newCase);
  } catch (err) {
    console.error("Admin create case error:", err);
    res.status(500).json({ error: getDatabaseError(err) });
  }
});

router.put("/cases/:id", async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    const validationError = validateCasePayload(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const caseData = normalizeCasePayload(req.body);
    const guaranteeError = validateGuarantee(caseData);
    if (guaranteeError) return res.status(400).json({ error: guaranteeError });
    const updatedCase = await Case.findOneAndUpdate({ _id: req.params.id }, { $set: caseData }, { new: true, runValidators: true });
    if (!updatedCase) return res.status(404).json({ error: "Case not found" });

    res.json(updatedCase);
  } catch (err) {
    console.error("Admin update case error:", err);
    res.status(500).json({ error: getDatabaseError(err) });
  }
});

router.delete("/cases/:id", async (req, res) => {
  try {
    if (!requireDatabase(res)) return;
    await Case.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete case error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/logs", async (req, res) => {
  try {
    const logs = await CheatLog.find({}).sort({ createdAt: -1 }).populate('userId', 'username avatar');
    res.json(logs || []);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const {
      backgroundImage,
      spotlightImages,
      promoBanner,
      combatArmoryName,
      combatArmoryImage,
      weaponLicenseName,
      weaponLicenseImage,
      weaponLicenseLevelNames,
      weaponLicenseWebhookSuccessMessage,
      weaponLicenseWebhookFailureMessage,
      taskFunctionName,
      taskFunctionImage,
      taskNames,
      taskImages
    } = req.body;

    if (weaponLicenseLevelNames !== undefined && (
      !Array.isArray(weaponLicenseLevelNames) ||
      weaponLicenseLevelNames.length !== 15 ||
      weaponLicenseLevelNames.some((name: any) => typeof name !== "string" || !name.trim())
    )) {
      return res.status(400).json({ error: "weaponLicenseLevelNames must contain exactly 15 non-empty names" });
    }

    const stringFields = {
      weaponLicenseName,
      weaponLicenseImage,
      weaponLicenseWebhookSuccessMessage,
      weaponLicenseWebhookFailureMessage,
      taskFunctionName,
      taskFunctionImage
    };
    for (const [field, value] of Object.entries(stringFields)) {
      if (value !== undefined && typeof value !== "string") {
        return res.status(400).json({ error: `${field} must be a string` });
      }
    }

    if (taskNames !== undefined && (!Array.isArray(taskNames) || taskNames.length !== 3 || taskNames.some((name: any) => typeof name !== "string" || !name.trim()))) {
      return res.status(400).json({ error: "taskNames must contain exactly 3 non-empty names" });
    }
    if (taskImages !== undefined && (!Array.isArray(taskImages) || taskImages.length !== 3 || taskImages.some((image: any) => typeof image !== "string"))) {
      return res.status(400).json({ error: "taskImages must contain exactly 3 image URLs" });
    }

    const weaponLicenseSettings = {
      weaponLicenseName,
      weaponLicenseImage,
      weaponLicenseLevelNames: weaponLicenseLevelNames?.map((name: string) => name.trim()),
      weaponLicenseWebhookSuccessMessage,
      weaponLicenseWebhookFailureMessage
    };
    const taskSettings = {
      taskFunctionName,
      taskFunctionImage,
      taskNames: taskNames?.map((name: string) => name.trim()),
      taskImages
    };
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({
        backgroundImage,
        spotlightImages,
        promoBanner,
        combatArmoryName,
        combatArmoryImage,
        ...weaponLicenseSettings,
        ...taskSettings
      });
    } else {
      if (backgroundImage !== undefined) (settings as any).backgroundImage = backgroundImage;
      if (spotlightImages !== undefined) (settings as any).spotlightImages = spotlightImages;
      if (promoBanner !== undefined) (settings as any).promoBanner = promoBanner;
      if (combatArmoryName !== undefined) (settings as any).combatArmoryName = combatArmoryName;
      if (combatArmoryImage !== undefined) (settings as any).combatArmoryImage = combatArmoryImage;
      for (const [field, value] of Object.entries(weaponLicenseSettings)) {
        if (value !== undefined) (settings as any)[field] = value;
      }
      for (const [field, value] of Object.entries(taskSettings)) {
        if (value !== undefined) (settings as any)[field] = value;
      }
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
