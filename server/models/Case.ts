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
  items: [itemSchema]
});

export const Case = mongoose.models.Case || mongoose.model("Case", caseSchema);
