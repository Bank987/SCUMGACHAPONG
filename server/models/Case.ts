import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  rarity: { type: String, required: true },
  dropRate: { type: Number, required: true },
  color: { type: String, required: true }
});

const caseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: "1" },
  guaranteeEnabled: { type: Boolean, default: false },
  guaranteeEvery: { type: Number, default: 0, min: 0 },
  guaranteeItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
  items: [itemSchema]
});

export const Case: mongoose.Model<any> = mongoose.models.Case || mongoose.model("Case", caseSchema);
