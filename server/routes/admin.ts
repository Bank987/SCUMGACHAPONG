import express from "express";
import { User } from "../models/User.js";
import { Case } from "../models/Case.js";
import { Settings } from "../models/Settings.js";
import { CheatLog } from "../models/CheatLog.js";

const router = express.Router();
const ADMIN_PIN = process.env.ADMIN_PIN || "123456";

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
    const { spins, upgradePoints, allowedCases, isBanned, banReason, cheatWarnings } = req.body;

    const updateData: any = {};
    if (spins !== undefined) updateData.spins = spins;
    if (upgradePoints !== undefined) updateData.upgradePoints = upgradePoints;
    if (allowedCases !== undefined) updateData.allowedCases = allowedCases;
    if (isBanned !== undefined) updateData.isBanned = isBanned;
    if (banReason !== undefined) updateData.banReason = banReason;
    if (cheatWarnings !== undefined) updateData.cheatWarnings = cheatWarnings;

    const user = await User.findOneAndUpdate({ _id: req.params.id }, { $set: updateData }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
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
    const newCase = await Case.create(req.body);
    res.json(newCase);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/cases/:id", async (req, res) => {
  try {
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
    const { backgroundImage, spotlightImages, promoBanner, combatArmoryName, combatArmoryImage } = req.body;
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({ backgroundImage, spotlightImages, promoBanner, combatArmoryName, combatArmoryImage });
    } else {
      if (backgroundImage !== undefined) (settings as any).backgroundImage = backgroundImage;
      if (spotlightImages !== undefined) (settings as any).spotlightImages = spotlightImages;
      if (promoBanner !== undefined) (settings as any).promoBanner = promoBanner;
      if (combatArmoryName !== undefined) (settings as any).combatArmoryName = combatArmoryName;
      if (combatArmoryImage !== undefined) (settings as any).combatArmoryImage = combatArmoryImage;
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;