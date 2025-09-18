import mongoose from "mongoose";

export interface WorkDocument extends mongoose.Document {
  adminId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  prompt: string;
  imageUrl: string;
}

const workSchema = new mongoose.Schema<WorkDocument>({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  prompt: { type: String, required: true },
  imageUrl: { type: String, required: true }
}, { timestamps: true });

const Work = mongoose.models.Work || mongoose.model("Work", workSchema);

export default Work;