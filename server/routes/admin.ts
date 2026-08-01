import express from "express";
import { User } from "../models/User.js";
import { Case } from "../models/Case.js";
import { Settings } from "../models/Settings.js";
import { CheatLog } from "../models/CheatLog.js";
import { SpinHistory } from "../models/SpinHistory.js";
import { renderWebhookTemplate, sendWebhook } from "../utils/webhook.js";

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
    const { spins, upgradePoints, levelTickets, weaponLicenseLevel, allowedCases, isBanned, banReason, cheatWarnings } = req.body;

    const updateData: any = {};
    if (spins !== undefined) updateData.spins = spins;
    if (upgradePoints !== undefined) updateData.upgradePoints = upgradePoints;
    if (levelTickets !== undefined) {
      const value = clampInteger(levelTickets, 0, Number.MAX_SAFE_INTEGER);
      if (value === null) return res.status(400).json({ error: "levelTickets must be a number" });
      updateData.levelTickets = value;
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
      result: "สำเร็จ ! (ACCESS)"
    });

    void sendWebhook("level", {
      username: "รายงานผลใบอนุญาตครอบครองอาวุธ",
      content: message
    });

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
    const cases = await Case.find({});
    res.json(cases || []);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cases", async (req, res) => {
  try {
    const guaranteeError = validateGuarantee(req.body);
    if (guaranteeError) return res.status(400).json({ error: guaranteeError });
    const newCase = await Case.create(req.body);
    res.json(newCase);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/cases/:id", async (req, res) => {
  try {
    const guaranteeError = validateGuarantee(req.body);
    if (guaranteeError) return res.status(400).json({ error: guaranteeError });
    const updatedCase = await Case.findOneAndUpdate({ _id: req.params.id }, { $set: req.body }, { new: true });
    if (!updatedCase) return res.status(404).json({ error: "Case not found" });

    res.json(updatedCase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/cases/:id", async (req, res) => {
  try {
    await Case.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
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
      weaponLicenseWebhookFailureMessage
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
      weaponLicenseWebhookFailureMessage
    };
    for (const [field, value] of Object.entries(stringFields)) {
      if (value !== undefined && typeof value !== "string") {
        return res.status(400).json({ error: `${field} must be a string` });
      }
    }

    const weaponLicenseSettings = {
      weaponLicenseName,
      weaponLicenseImage,
      weaponLicenseLevelNames: weaponLicenseLevelNames?.map((name: string) => name.trim()),
      weaponLicenseWebhookSuccessMessage,
      weaponLicenseWebhookFailureMessage
    };
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({
        backgroundImage,
        spotlightImages,
        promoBanner,
        combatArmoryName,
        combatArmoryImage,
        ...weaponLicenseSettings
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
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
