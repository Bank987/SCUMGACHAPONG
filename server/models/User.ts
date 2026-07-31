import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: false },
  username: { type: String, required: true },
  gameName: { type: String, trim: true, minlength: 2, maxlength: 32 },
  avatar: { type: String, required: false },
  spins: { type: Number, default: 0 },
  upgradePoints: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  role: { type: String, default: "user" },
  allowedCases: [{ type: mongoose.Schema.Types.ObjectId, ref: "Case" }],
  pityCounters: { type: Map, of: Number, default: {} },
  // Anti-Cheat Fields
  spinLockedUntil: { type: Date, default: null },
  upgradeLockedUntil: { type: Date, default: null },
  cheatWarnings: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: "" }
});

export const User: mongoose.Model<any> = mongoose.models.User || mongoose.model("User", userSchema);
