import express from "express";
import mongoose from "mongoose";
import { Settings } from "../models/Settings.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                backgroundImage: "https://storage.googleapis.com/aistudio-user-uploads/b2c8a1e8-d1a2-4b3c-9d4e-5f6a7b8c9d0e.png",
                promoBanner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070",
                spotlightImages: []
            });
        }
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

export default router;
