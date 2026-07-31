import express from "express";
import mongoose from "mongoose";
import { Case } from "../models/Case.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const cases = await Case.find();
    res.json(cases || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: "Invalid id" });

    const caseData = await Case.findById(id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });

    res.json({
      ...caseData.toObject(),
      items: Array.isArray(caseData.items) ? caseData.items : []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;