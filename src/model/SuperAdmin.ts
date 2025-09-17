import mongoose ,{Schema} from "mongoose";
import { AdminDocument } from "./Admin";

export interface SuperAdminDocument extends mongoose.Document {
  username: string;
  password: string;
  admins: mongoose.Types.ObjectId[] | AdminDocument[];
}

const superAdminSchema = new Schema<SuperAdminDocument>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }]
}, { timestamps: true });

const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model("SuperAdmin", superAdminSchema);

export default SuperAdmin;
