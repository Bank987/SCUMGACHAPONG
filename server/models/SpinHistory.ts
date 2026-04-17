import mongoose from "mongoose";

const spinHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: false },
  caseName: { type: String, required: true },
  itemName: { type: String, required: true },
  itemImage: { type: String, default: "https://via.placeholder.com/150" },
  itemRarity: { type: String, required: false },
  itemColor: { type: String, required: false },
  upgradeLevel: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const SpinHistory = mongoose.models.SpinHistory || mongoose.model("SpinHistory", spinHistorySchema);
