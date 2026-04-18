import express from "express";
import { User } from "../models/User.js";
import { Case } from "../models/Case.js";
import { SpinHistory } from "../models/SpinHistory.js";
import { Settings } from "../models/Settings.js";
import { CheatLog } from "../models/CheatLog.js";
import jwt from "jsonwebtoken";
import { sendWebhook } from "../utils/webhook.js";
import crypto from "crypto";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// In-memory store for rate limiting (Anti-cheat)
const upgradeRateLimits = new Map<string, number>();
const spinRateLimits = new Map<string, number>();

function getUser(req: any) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded?.userId;
  } catch {
    return null;
  }
}

const getItemValue = (rarity: string) => {
  const r = rarity?.toLowerCase() || "";
  if (r.includes("consumer") || r === "common") return 1;
  if (r.includes("industrial")) return 5;
  if (r.includes("mil-spec") || r === "rare") return 10;
  if (r.includes("restricted")) return 25;
  if (r.includes("classified") || r === "epic") return 100;
  if (r.includes("covert")) return 400;
  if (r.includes("rare special") || r === "legendary") return 1000;
  return 10;
};

router.post("/", async (req, res) => {
  let winningItem: any = null;
  const { caseId } = req.body || {};

  try {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!caseId) {
      return res.status(400).json({ error: "Missing caseId" });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ error: "Case not found" });
    }

    if (!Array.isArray(caseData.items) || caseData.items.length === 0) {
      return res.status(400).json({ error: "Case has no items" });
    }

    const now = new Date();
    const lockTime = new Date(now.getTime() + 7800); // 7.8 seconds lock

    // 🎯 ANTI-CHEAT: Atomic Coin Deduction & DB-Level Locking
    // This prevents double-spend and refresh exploits across multiple instances
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        isBanned: { $ne: true },
        $or: [
          { spinLockedUntil: { $lte: now } },
          { spinLockedUntil: null }
        ],
        $or: [
          { spins: { $gte: caseData.price } },
          ...(caseData.price === 0 ? [{ spins: { $exists: false } }] : [])
        ]
      },
      { 
        $inc: { spins: -caseData.price },
        $set: { spinLockedUntil: lockTime }
      },
      { new: true }
    );

    if (!user) {
      // Determine WHY it failed to provide accurate anti-cheat response
      const checkUser = await User.findById(userId);
      if (!checkUser) return res.status(400).json({ error: "User not found" });
      if (checkUser.isBanned) return res.status(403).json({ error: `บัญชีถูกระงับ: ${checkUser.banReason}` });
      
      if (checkUser.spinLockedUntil && checkUser.spinLockedUntil > now) {
        // User is trying to bypass the lock (refresh exploit or speedhack)
        checkUser.cheatWarnings = (checkUser.cheatWarnings || 0) + 1;
        if (checkUser.cheatWarnings >= 5) {
          checkUser.isBanned = true;
          checkUser.banReason = "Auto-ban: พยายามข้ามอนิเมชั่นหรือใช้โปรแกรมช่วยเล่น (Speedhack/Refresh Abuse)";
          await checkUser.save();
          return res.status(403).json({ error: "บัญชีของคุณถูกระงับเนื่องจากตรวจพบการโกง" });
        }
        await checkUser.save();
        
        await CheatLog.create({
          userId: user?._id || checkUser._id,
          action: "Spin Rate Limit Exceeded",
          cheatType: "Animation Skip / Speedhack",
          description: `พยายามสุ่มกล่องซ้ำขณะที่อนิเมชั่นเก่ายังไม่จบ (เหลือเวลาล็อค ${Math.ceil((checkUser.spinLockedUntil.getTime() - now.getTime())/1000)} วินาที)`
        });

        console.warn(`[ANTI-CHEAT] User ${userId} attempted to spin too quickly. Warning: ${checkUser.cheatWarnings}/5`);
        return res.status(429).json({ error: "กรุณารอให้อนิเมชั่นจบก่อนทำการสุ่มครั้งต่อไป (Anti-Spam/Anti-Skip)" });
      }

      return res.status(400).json({ error: "Gacha Point ไม่พอ!" });
    }

    // 🎯 สุ่มแบบเทพ (Cryptographically Secure Pseudo-Random Number Generator)
    // 1. หาผลรวมของเรททั้งหมด (Total Weight) เพื่อรองรับกรณีที่แอดมินตั้งเรทรวมไม่เท่ากับ 100 พอดี
    const totalWeight = caseData.items.reduce((sum, item) => sum + (item.dropRate || 0), 0);

    // 2. ใช้ Crypto เพื่อความแม่นยำระดับเซิร์ฟเวอร์เกม (True Random) ป้องกันการคาดเดาจาก Math.random()
    const randomBuffer = crypto.randomBytes(4);
    const randomNumber = randomBuffer.readUInt32LE(0);
    const maxUint32 = 0xFFFFFFFF;

    // คำนวณค่าสุ่มให้อยู่ในช่วง 0 ถึง totalWeight
    const rand = (randomNumber / maxUint32) * totalWeight;

    let cumulative = 0;
    for (const item of caseData.items) {
      cumulative += item?.dropRate || 0;
      if (rand <= cumulative) {
        winningItem = item;
        break;
      }
    }

    if (!winningItem) {
      winningItem = caseData.items[caseData.items.length - 1];
    }

    if (!winningItem) {
      return res.status(500).json({ error: "Spin failed" });
    }

    const itemName = winningItem?.name ?? "Unknown";
    const itemImage = (winningItem?.image && winningItem.image.trim() !== "")
      ? winningItem.image
      : "https://via.placeholder.com/150";

    if (!itemImage) {
      throw new Error("Validation failed: itemImage is required");
    }

    try {
      await SpinHistory.create({
        userId: user._id,
        caseId: caseData._id,
        caseName: caseData?.name ?? "Unknown",
        itemName,
        itemImage,
        itemRarity: winningItem?.rarity ?? "common",
        itemColor: winningItem?.color ?? "#fff"
      });

      // Send webhook (Public Gacha)
      await sendWebhook('gacha', {
        username: "รายงานผลสุ่มกาชาปอง",
        embeds: [{
          description: `**${user.username}** สุ่มกล่อง **${caseData.name}**\nได้รับ **${itemName}** !`,
          color: parseInt(winningItem?.color?.replace("#", "") || "00ff00", 16),
          thumbnail: { url: itemImage },
          fields: [{ name: "Rarity", value: winningItem?.rarity ?? "common", inline: true }],
          timestamp: new Date().toISOString()
        }]
      });
    } catch (saveError) {
      console.error("Spin debug:", { winningItem, caseId });
      console.error("SpinHistory save error:", saveError);
      // We don't throw here so the user still gets their item even if history/webhook fails
    }

    // Convert Mongoose document to plain object to avoid serialization issues
    const itemObj = winningItem.toObject ? winningItem.toObject() : winningItem;

    res.json({
      item: { ...itemObj, name: itemName, image: itemImage },
      remainingSpins: user.spins
    });
  } catch (err) {
    console.error("Spin debug:", { winningItem, caseId });
    console.error("Spin error:", err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Server error" });
  }
});

// Get global recent history for Live Drops
router.get("/history/all", async (req, res) => {
  try {
    const recentSpins = await SpinHistory.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('userId', 'username avatar');

    // Format for client
    const formatted = recentSpins.map(spin => ({
      _id: spin._id,
      user: (spin as any).userId?.username || "Anonymous",
      avatar: (spin as any).userId?.avatar || null,
      itemName: spin.itemName,
      itemImage: spin.itemImage,
      itemColor: spin.itemColor,
      itemRarity: spin.itemRarity,
      createdAt: spin.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch all history error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user specific history
router.get("/history", async (req, res) => {
  try {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const recentSpins = await SpinHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('caseId', 'name image');

    res.json(recentSpins);
  } catch (err) {
    console.error("Fetch user history error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/test-create", async (req, res) => {
  try {
    const userId = "661e5b8e9b9b9b9b9b9b9b9b"; // Fake ID
    const newArmory = await SpinHistory.create({
      userId,
      caseName: "System",
      itemName: "Combat Armory Tier +0",
      itemImage: "https://cdn-icons-png.flaticon.com/512/3014/3014297.png",
      itemRarity: "Mythic",
      itemColor: "#ef4444",
      upgradeLevel: 0
    });
    res.json(newArmory);
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Get user inventory
router.get("/inventory", async (req, res) => {
  try {
    // Prevent browser caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    let inventory = await SpinHistory.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Ensure Combat Armory Tier exists
    const combatArmoryIndex = inventory.findIndex((item: any) => item.caseName === "System");

    const settings = await Settings.findOne({}) || new Settings();
    const armoryName = settings.combatArmoryName || "Combat Armory Tier";
    const armoryImage = settings.combatArmoryImage || "https://cdn.discordapp.com/attachments/1492459270564741273/1493677975315419236/4_1.png?ex=69dfd784&is=69de8604&hm=7e9d37824a788f8a2161fcb6786d07a985cd2415aac399080d2a14fdcd3513a0&";

    if (combatArmoryIndex === -1) {
      console.log("Creating new System item for user", userId);
      try {
        const newArmory = await SpinHistory.create({
          userId,
          caseName: "System",
          itemName: `${armoryName} +0`,
          itemImage: armoryImage,
          itemRarity: "Mythic",
          itemColor: "#ef4444",
          upgradeLevel: 0
        });
        inventory.unshift(newArmory.toObject());
        console.log("Created successfully");
      } catch (createErr) {
        console.error("Error creating System item:", createErr);
      }
    } else {
      // Override name and image for display to ensure it's always up-to-date with settings
      inventory[combatArmoryIndex].itemName = `${armoryName} +${inventory[combatArmoryIndex].upgradeLevel || 0}`;
      inventory[combatArmoryIndex].itemImage = armoryImage;

      // Move it to the first position
      const [combatArmory] = inventory.splice(combatArmoryIndex, 1);
      inventory.unshift(combatArmory);
    }

    res.json(inventory);
  } catch (err) {
    console.error("Fetch inventory error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Upgrade specific item
router.post("/upgrade-item", async (req, res) => {
  try {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ error: "Missing itemId" });
    }

    const item = await SpinHistory.findOne({ _id: itemId, userId });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (item.caseName !== "System") {
      return res.status(400).json({ error: "ไอเทมนี้ไม่สามารถตีบวกได้" });
    }

    const currentLevel = item.upgradeLevel || 0;
    if (currentLevel >= 10) {
      return res.status(400).json({ error: "ไอเทมนี้ตีบวกตันแล้ว (+10)" });
    }

    // Cost calculation (e.g., 10 points per level)
    const cost = 10 + (currentLevel * 5);

    const now = new Date();
    const lockTime = new Date(now.getTime() + 8300); // 8.3 seconds lock

    // 🎯 ANTI-CHEAT: Atomic Point Deduction & DB-Level Locking
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        isBanned: { $ne: true },
        $or: [
          { upgradeLockedUntil: { $lte: now } },
          { upgradeLockedUntil: null }
        ],
        $or: [
          { upgradePoints: { $gte: cost } },
          ...(cost === 0 ? [{ upgradePoints: { $exists: false } }] : [])
        ]
      },
      { 
        $inc: { upgradePoints: -cost },
        $set: { upgradeLockedUntil: lockTime }
      },
      { new: true }
    );

    if (!user) {
      // Determine WHY it failed to provide accurate anti-cheat response
      const checkUser = await User.findById(userId);
      if (!checkUser) return res.status(400).json({ error: "User not found" });
      if (checkUser.isBanned) return res.status(403).json({ error: `บัญชีถูกระงับ: ${checkUser.banReason}` });
      
      if (checkUser.upgradeLockedUntil && checkUser.upgradeLockedUntil > now) {
        // User is trying to bypass the lock (refresh exploit or speedhack)
        checkUser.cheatWarnings = (checkUser.cheatWarnings || 0) + 1;
        if (checkUser.cheatWarnings >= 5) {
          checkUser.isBanned = true;
          checkUser.banReason = "Auto-ban: พยายามข้ามอนิเมชั่นหรือใช้โปรแกรมช่วยเล่น (Speedhack/Refresh Abuse)";
          await checkUser.save();
          return res.status(403).json({ error: "บัญชีของคุณถูกระงับเนื่องจากตรวจพบการโกง" });
        }
        await checkUser.save();

        await CheatLog.create({
          userId: user?._id || checkUser._id,
          action: "Upgrade Rate Limit Exceeded",
          cheatType: "Animation Skip / Speedhack",
          description: `พยายามอัปเกรดไอเทมซ้ำขณะที่อนิเมชั่นเก่ายังไม่จบ (เหลือเวลาล็อค ${Math.ceil((checkUser.upgradeLockedUntil.getTime() - now.getTime())/1000)} วินาที)`
        });

        console.warn(`[ANTI-CHEAT] User ${userId} attempted to upgrade too quickly. Warning: ${checkUser.cheatWarnings}/5`);
        return res.status(429).json({ error: "กรุณารอให้อนิเมชั่นจบก่อนทำการอัปเกรดครั้งต่อไป (Anti-Spam)" });
      }

      return res.status(400).json({ error: `REFINE POINT ไม่พอ! (ใช้ ${cost} แต้ม)` });
    }

    // Rates based on the provided table
    // Format: [Success, Fail(Stay), Fail(Downgrade), DowngradeTo]
    const rates: Record<number, { success: number, stay: number, downgrade: number, downgradeTo: number }> = {
      0: { success: 0.60, stay: 0.40, downgrade: 0.00, downgradeTo: 0 },
      1: { success: 0.55, stay: 0.45, downgrade: 0.00, downgradeTo: 1 },
      2: { success: 0.50, stay: 0.50, downgrade: 0.00, downgradeTo: 2 },
      3: { success: 0.40, stay: 0.50, downgrade: 0.10, downgradeTo: 2 },
      4: { success: 0.40, stay: 0.50, downgrade: 0.10, downgradeTo: 3 },
      5: { success: 0.30, stay: 0.55, downgrade: 0.15, downgradeTo: 4 },
      6: { success: 0.30, stay: 0.55, downgrade: 0.15, downgradeTo: 5 },
      7: { success: 0.20, stay: 0.60, downgrade: 0.20, downgradeTo: 6 },
      8: { success: 0.20, stay: 0.60, downgrade: 0.20, downgradeTo: 7 },
      9: { success: 0.10, stay: 0.60, downgrade: 0.30, downgradeTo: 8 },
    };

    const rate = rates[currentLevel];
    if (!rate) {
      upgradeRateLimits.delete(userId);
      return res.status(400).json({ error: "Invalid upgrade level" });
    }

    // --- ANTI-CHEAT: True Randomness ---
    // Use crypto for cryptographically secure random numbers instead of Math.random()
    const randomBuffer = crypto.randomBytes(4);
    const randomNumber = randomBuffer.readUInt32LE(0);
    const maxUint32 = 0xFFFFFFFF;
    const roll = randomNumber / maxUint32;
    // -----------------------------------

    let resultStatus: 'SUCCESS' | 'FAILED' | 'DOWN' = 'FAILED';

    if (roll < rate.success) {
      resultStatus = 'SUCCESS';
      item.upgradeLevel = currentLevel + 1;
    } else if (roll < rate.success + rate.stay) {
      resultStatus = 'FAILED';
      // Level stays the same
    } else {
      resultStatus = 'DOWN';
      item.upgradeLevel = rate.downgradeTo;
    }

    const settings = await Settings.findOne({}) || new Settings();
    const armoryName = settings.combatArmoryName || "Combat Armory Tier";

    item.itemName = `${armoryName} +${item.upgradeLevel}`;
    item.itemImage = settings.combatArmoryImage || "https://cdn.discordapp.com/attachments/1492459270564741273/1493677975315419236/4_1.png?ex=69dfd784&is=69de8604&hm=7e9d37824a788f8a2161fcb6786d07a985cd2415aac399080d2a14fdcd3513a0&";

    await item.save();

    res.json({
      status: resultStatus,
      newLevel: item.upgradeLevel,
      remainingPoints: user.upgradePoints,
      rate: rate
    });

    try {
      await sendWebhook('upgrade', {
        username: "รายงานผลตีบวก",
        embeds: [{
          description: `**${user.username}** อัพเกรด **${item.itemName}**\nโอกาส ${Math.round(rate.success * 100)} % และ "**${resultStatus} !**"\nตอนนี้เลเวล **+${item.upgradeLevel}** !`,
          color: resultStatus === 'SUCCESS' ? 0x00ff00 : (resultStatus === 'DOWN' ? 0xff0000 : 0xffff00),
          thumbnail: { url: item.itemImage },
          timestamp: new Date().toISOString()
        }]
      });
    } catch (whErr) {
      console.error("Webhook upgrade err:", whErr);
    }
  } catch (err) {
    console.error("Upgrade item error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/upgrade", async (req, res) => {
  try {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const cost: number = 10;

    // 🎯 ANTI-CHEAT: Atomic Point Deduction
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        $or: [
          { upgradePoints: { $gte: cost } },
          ...(cost === 0 ? [{ upgradePoints: { $exists: false } }] : [])
        ]
      },
      { $inc: { upgradePoints: -cost } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ error: "REFINE POINT ไม่พอ! หรือไม่พบผู้ใช้" });
    }

    // 🎯 ตีบวกแบบเทพ (True Random)
    const randomBuffer = crypto.randomBytes(4);
    const randomNumber = randomBuffer.readUInt32LE(0);
    const maxUint32 = 0xFFFFFFFF;

    // โอกาสติด 30% แบบ True Random
    const isSuccess = (randomNumber / maxUint32) < 0.3;

    if (isSuccess) {
      await sendWebhook('upgrade', {
        embeds: [{
          title: "✨ อัปเกรดสำเร็จ!",
          description: `**${user.username}** ตีบวกอาวุธโชว์สำเร็จ! โคตรตึง!`,
          color: 0xffd700,
          timestamp: new Date().toISOString()
        }]
      });
    }

    res.json({
      success: isSuccess,
      remainingPoints: user.upgradePoints
    });
  } catch (err) {
    console.error("Upgrade error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/upgrade-trade", async (req, res) => {
  try {
    const userId = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { sourceItemIds, targetItem } = req.body;
    if (!sourceItemIds || !Array.isArray(sourceItemIds) || sourceItemIds.length === 0 || sourceItemIds.length > 50 || !targetItem || !targetItem.name) {
      return res.status(400).json({ error: "Missing parameters or too many items (Max 50 items per trade)" });
    }

    // 🎯 ANTI-CHEAT: Validate targetItem exists in the database to prevent spoofing
    const validCase = await Case.findOne({ "items.name": targetItem.name });
    if (!validCase) {
      console.warn(`[ANTI-CHEAT] User ${userId} attempted to trade for a non-existent item: ${targetItem.name}`);
      return res.status(400).json({ error: "เป้าหมายไอเทมไม่ถูกต้อง (Anti-Spoofing)" });
    }
    const realTargetItem = validCase.items.find((i: any) => i.name === targetItem.name);
    if (!realTargetItem) {
      return res.status(400).json({ error: "เป้าหมายไอเทมไม่ถูกต้อง" });
    }

    const now = new Date();
    const checkUser = await User.findById(userId);
    if (checkUser && checkUser.upgradeLockedUntil && checkUser.upgradeLockedUntil > now) {
      checkUser.cheatWarnings = (checkUser.cheatWarnings || 0) + 1;
      await checkUser.save();
      await CheatLog.create({
        userId: checkUser._id,
        action: "Upgrade Trade Rate Limit Exceeded",
        cheatType: "Animation Skip / Speedhack",
        description: `พยายาม Trade ไอเทมซ้ำขณะที่อนิเมชั่นเก่ายังไม่จบ (เหลือเวลาล็อค ${Math.ceil((checkUser.upgradeLockedUntil.getTime() - now.getTime())/1000)} วินาที)`
      });
      return res.status(429).json({ error: "กรุณารอให้อนิเมชั่นจบก่อนทำรายการถัดไป" });
    }

    const sourceItems = await SpinHistory.find({ _id: { $in: sourceItemIds }, userId });
    if (sourceItems.length !== sourceItemIds.length) {
      return res.status(400).json({ error: "Invalid source items" });
    }

    let sourceValue = 0;
    for (const item of sourceItems) {
      sourceValue += getItemValue(item.itemRarity);
    }

    const targetValue = getItemValue(realTargetItem.rarity);
    if (targetValue <= 0) return res.status(400).json({ error: "Invalid target item" });

    let chance = (sourceValue / targetValue);
    if (chance > 0.95) chance = 0.95;

    const randomBuffer = crypto.randomBytes(4);
    const randomNumber = randomBuffer.readUInt32LE(0);
    const maxUint32 = 0xFFFFFFFF;
    const roll = randomNumber / maxUint32;

    const isSuccess = roll < chance;

    // 🎯 ANTI-CHEAT: Atomic Delete (Prevents Item Duplication Race Conditions)
    const deleteResult = await SpinHistory.deleteMany({ _id: { $in: sourceItemIds }, userId });

    if (deleteResult.deletedCount !== sourceItemIds.length) {
      console.warn(`[ANTI-CHEAT] User ${userId} attempted to duplicate items in trade-up.`);
      return res.status(400).json({ error: "ไอเทมบางชิ้นถูกใช้ไปแล้ว (Anti-Duplication)" });
    }

    if (checkUser) {
        checkUser.upgradeLockedUntil = new Date(now.getTime() + 8300); // 8.3s animation lock
        await checkUser.save();
    }

    if (isSuccess) {
      await SpinHistory.create({
        userId,
        caseId: sourceItems[0].caseId,
        caseName: "Upgraded",
        itemName: realTargetItem.name,
        itemImage: realTargetItem.image,
        itemRarity: realTargetItem.rarity,
        itemColor: realTargetItem.color,
      });
    }

    res.json({
      success: isSuccess,
      roll: roll,
      chance: chance
    });

  } catch (err) {
    console.error("Upgrade trade error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
