import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

import authRoutes from "./server/routes/auth.js";
import casesRoutes from "./server/routes/cases.js";
import spinRoutes from "./server/routes/spin.js";
import adminRoutes from "./server/routes/admin.js";
import settingsRoutes from "./server/routes/settings.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy is required if running behind a reverse proxy (like Render, Vercel, or AI Studio)
  // to get the correct client IP address for rate limiting.
  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({
    origin: true,
    credentials: true,
  }));

  // --- Security Middleware ---
  // Helmet helps secure Express apps by setting various HTTP headers.
  // We disable CSP and Frameguard to ensure it works within the AI Studio iframe and allows external images.
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false, // Fixes window.opener for Discord OAuth popup
    frameguard: false,
  }));

  // Data Sanitization against NoSQL Injection Attacks
  app.use(mongoSanitize());

  // --- Basic Anti-DDoS / Rate Limiting ---
  const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 300, // Limit each IP to 300 requests per 5 minutes
    message: { error: "ส่งคำขอมากเกินไป กรุณารอสักครู่ (Rate Limit Exceeded)" },
    standardHeaders: true, 
    legacyHeaders: false, 
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per 15 minutes for auth routes
    message: { error: "พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที (Auth Rate Limit)" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiter to all API routes
  app.use("/api", apiLimiter);
  app.use("/api/auth", authLimiter);

  // Connect to MongoDB if URI is provided
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  } else {
    console.warn("MONGODB_URI not set. Running without database.");
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });



  app.use("/api/auth", authRoutes);
  app.use("/api/cases", casesRoutes);
  app.use("/api/spin", spinRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/settings", settingsRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          res.status(404).send("API is running! (Frontend is hosted separately)");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
