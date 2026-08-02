import mongoose from "mongoose";

const taskHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  playerName: { type: String, required: true },
  functionName: { type: String, required: true },
  taskIndex: { type: Number, required: true, min: 0, max: 2 },
  taskName: { type: String, required: true },
  successRate: { type: Number, required: true },
  success: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const TaskHistory: mongoose.Model<any> = mongoose.models.TaskHistory || mongoose.model("TaskHistory", taskHistorySchema);
