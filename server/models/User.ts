import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: false },
  username: { type: String, required: true },
  avatar: { type: String, required: false },
  spins: { type: Number, default: 0 },
  upgradePoints: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  role: { type: String, default: "user" },
  allowedCases: [{ type: mongoose.Schema.Types.ObjectId, ref: "Case" }],
  // Anti-Cheat Fields
  spinLockedUntil: { type: Date, default: null },
  upgradeLockedUntil: { type: Date, default: null },
  cheatWarnings: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: "" }
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
