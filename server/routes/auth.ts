import express from "express";
import { User } from "../models/User.js";
import { CheatLog } from "../models/CheatLog.js";
import jwt from "jsonwebtoken";
import axios from "axios";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

function getUserId(req: any) {
  const token = req.cookies?.token;
  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

router.post("/make-admin", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findByIdAndUpdate(userId, { role: "admin" }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 🎯 ANTI-CHEAT: Check if they reloaded the page during a locked animation
    // But allow a tiny buffer (e.g., 2 seconds before the lock ends) 
    // to avoid false positives for fast loaders or network latency.
    const now = new Date();
    
    let isCheatRefresh = false;
    let cheatRefreshDesc = "";
    
    if (user.spinLockedUntil && user.spinLockedUntil > new Date(now.getTime() + 2000)) {
      isCheatRefresh = true;
      cheatRefreshDesc = `ผู้ใช้รีเฟรชหน้าเว็บข้ามอนิเมชั่น (เหลือเวลาล็อคสุ่ม ${Math.ceil((user.spinLockedUntil.getTime() - now.getTime())/1000)} วินาที)`;
    } else if (user.upgradeLockedUntil && user.upgradeLockedUntil > new Date(now.getTime() + 2000)) {
      isCheatRefresh = true;
      cheatRefreshDesc = `ผู้ใช้รีเฟรชหน้าเว็บข้ามอนิเมชั่น (เหลือเวลาล็อคอัปเกรด ${Math.ceil((user.upgradeLockedUntil.getTime() - now.getTime())/1000)} วินาที)`;
    }

    if (isCheatRefresh) {
      user.cheatWarnings = (user.cheatWarnings || 0) + 1;
      
      await CheatLog.create({
        userId: user._id,
        action: "Page Refresh during Animation",
        cheatType: "Animation Skip",
        description: cheatRefreshDesc
      });

      if (user.cheatWarnings >= 5) {
        user.isBanned = true;
        user.banReason = "Auto-ban: จงใจรีเฟรชหน้าเว็บเพื่อข้ามอนิเมชั่นบ่อยครั้งเกินกำหนด";
      }
      await user.save();
    }

    if (user.isBanned) {
      res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
      return res.status(403).json({ error: `บัญชีถูกระงับ: ${user.banReason}` });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/url", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "DISCORD_CLIENT_ID not configured in .env" });
  }

  // Force exact Vercel URL for redirect
  const appUrl = "https://scumgachapong.vercel.app";
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/callback`);
  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;
  res.json({ url });
});

router.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("No code provided");

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).send("DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is missing on the server.");
    }

    // Force exact Vercel URL for redirect
    const appUrl = "https://scumgachapong.vercel.app";
    const redirectUri = `${appUrl}/api/auth/callback`;

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code as string);
    params.append('redirect_uri', redirectUri);

    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const discordUser = userResponse.data;

    let user = await User.findOne({ discordId: discordUser.id });

    if (user && user.isBanned) {
      return res.status(403).send(`บัญชีถูกระงับ: ${user.banReason}`);
    }

    if (!user) {
      user = new User({
        username: discordUser.username,
        discordId: discordUser.id,
        avatar: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${discordUser.username}`
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: "none" 
    });

    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
          window.close();
        } else {
          window.location.href = '/';
        }
      </script>
    `);
  } catch (err: any) {
    console.error("Discord Auth Error:", err?.response?.data || err);
    
    // Explicitly send the precise error out to the screen for troubleshooting
    const errorDetails = err?.response?.data 
      ? JSON.stringify(err.response.data) 
      : (err.message || "Unknown error");
      
    res.status(500).send(`
      <div style="font-family: sans-serif; padding: 20px; color: #ff4444; background: #222; border-radius: 8px; max-width: 600px; margin: 40px auto;">
        <h2>Authentication failed</h2>
        <p>There was an error communicating with Discord. Here are the details from the server:</p>
        <pre style="background: #111; padding: 15px; border-radius: 4px; overflow: auto; color: #ddd;">${errorDetails}</pre>
        <br/><p>Please share this error or check DISCORD_CLIENT_SECRET on your Render dashboard.</p>
        <button onclick="window.close()">Close Window</button>
      </div>
    `);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username || typeof username !== "string") return res.status(400).json({ error: "Username required" });

    // Validate username length (Anti-Cheat / Anti-Spam)
    if (username.length > 32 || username.length < 3) {
      return res.status(400).json({ error: "ชื่อต้องมีความยาว 3-32 ตัวอักษร" });
    }

    let user = await User.findOne({ username });

    if (user && user.isBanned) {
      return res.status(403).json({ error: `บัญชีถูกระงับ: ${user.banReason}` });
    }

    // 🎯 ANTI-CHEAT: Prevent account takeover of Discord users
    if (user && user.discordId) {
      return res.status(403).json({ error: "บัญชีนี้ผูกกับ Discord แล้ว กรุณาล็อกอินผ่านระบบ Discord แทนเพื่อความปลอดภัย" });
    }

    if (!user) {
      user = new User({
        username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: "none" 
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
  res.json({ success: true });
});

export default router;
