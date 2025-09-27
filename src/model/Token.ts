// /model/Token.ts
import mongoose, { Schema } from "mongoose";

export interface TokenDocument extends mongoose.Document {
  device_id: string;
  token: string;
  app_version?: string;
  os_version?: string;
  createdAt: Date;
}

const tokenSchema = new Schema<TokenDocument>(
  {
    device_id: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    app_version: { type: String },
    os_version: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // Only createdAt timestamp
);

const Token = mongoose.models.Token || mongoose.model<TokenDocument>("Token", tokenSchema);

export default Token;
