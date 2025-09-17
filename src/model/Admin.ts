import mongoose from "mongoose";

export interface AdminDocument extends mongoose.Document {
    _id: string;
    username: string;
    password: string;
}

const adminSchema = new mongoose.Schema<AdminDocument>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin
