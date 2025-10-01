import mongoose, { Schema, Document } from "mongoose";

export interface IPrivacy extends Document {
  url: string;
  createdAt: Date;
}

const privacySchema = new Schema<IPrivacy>({
  url: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Privacy = mongoose.models.Privacy || mongoose.model<IPrivacy>("Privacy", privacySchema);

export default Privacy;
