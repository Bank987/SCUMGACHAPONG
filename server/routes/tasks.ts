import crypto from "crypto";
import express from "express";
import jwt from "jsonwebtoken";
import { Settings } from "../models/Settings.js";
import { TaskHistory } from "../models/TaskHistory.js";
import { User } from "../models/User.js";
import { createTaskWebhookPayload, sendWebhook } from "../utils/webhook.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const taskRates = [75, 50, 25];

function getUserId(req: any) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) token = req.headers.authorization.split(" ")[1];
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded?.userId;
  } catch {
    return null;
  }
}

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [user, settings, history] = await Promise.all([
      User.findById(userId),
      Settings.findOne({}),
      TaskHistory.find({ userId }).sort({ createdAt: -1 }).limit(20)
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });
    const displaySettings = settings || new Settings();
    res.json({
      points: Number(user.taskPoints || 0),
      functionName: displaySettings.taskFunctionName,
      functionImage: displaySettings.taskFunctionImage,
      tasks: taskRates.map((rate, index) => ({
        index,
        name: displaySettings.taskNames?.[index] || `ภารกิจ ${index + 1}`,
        image: displaySettings.taskImages?.[index] || "",
        rate
      })),
      history
    });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/roll", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const taskIndex = Number(req.body?.taskIndex);
    if (!Number.isInteger(taskIndex) || taskIndex < 0 || taskIndex >= taskRates.length) {
      return res.status(400).json({ error: "Invalid task" });
    }

    const now = new Date();
    const rate = taskRates[taskIndex];
    const success = crypto.randomInt(100) < rate;
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        isBanned: { $ne: true },
        taskPoints: { $gte: 1 },
        $or: [{ taskLockedUntil: { $lte: now } }, { taskLockedUntil: null }]
      },
      {
        $inc: { taskPoints: -1 },
        $set: { taskLockedUntil: new Date(now.getTime() + 1200) }
      },
      { new: true }
    );

    if (!user) {
      const checkUser = await User.findById(userId);
      if (!checkUser) return res.status(404).json({ error: "User not found" });
      if (checkUser.isBanned) return res.status(403).json({ error: `บัญชีถูกระงับ: ${checkUser.banReason}` });
      if (checkUser.taskLockedUntil && checkUser.taskLockedUntil > now) return res.status(429).json({ error: "กรุณารอสักครู่ก่อนสุ่มอีกครั้ง" });
      if (Number(checkUser.taskPoints || 0) < 1) return res.status(400).json({ error: "TASKS POINT ไม่พอ" });
      return res.status(409).json({ error: "ข้อมูลมีการเปลี่ยนแปลง กรุณาลองใหม่" });
    }

    const settings = await Settings.findOne({}) || new Settings();
    const playerName = user.gameName || user.username;
    const functionName = settings.taskFunctionName || "สุ่มความสำเร็จภารกิจ";
    const taskName = settings.taskNames?.[taskIndex] || `ภารกิจ ${taskIndex + 1}`;
    const taskImage = settings.taskImages?.[taskIndex] || settings.taskFunctionImage || "";
    const history = await TaskHistory.create({
      userId: user._id,
      playerName,
      functionName,
      taskIndex,
      taskName,
      successRate: rate,
      success
    });

    void sendWebhook("task", createTaskWebhookPayload({
      player: playerName,
      functionName,
      taskName,
      successRate: rate,
      success,
      image: taskImage
    }));

    res.json({ success, rate, taskName, remainingPoints: user.taskPoints, history });
  } catch (error) {
    console.error("Task roll error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
