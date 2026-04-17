import mongoose from "mongoose";

const cheatLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    cheatType: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const CheatLog = mongoose.models.CheatLog || mongoose.model("CheatLog", cheatLogSchema);
