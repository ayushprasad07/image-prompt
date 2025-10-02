import mongoose ,{Schema} from "mongoose";
import { AdminDocument } from "./Admin";

export interface SuperAdminDocument extends mongoose.Document {
  username: string;
  password: string;
  role : string;
}

const SUPERADMIN_USERNAME = "superadmin";
// bcrypt hashed password for default superadmin
const SUPERADMIN_PASSWORD = "$2b$10$wWZlv6Q70mk118q17Ve.4OrQ8UC8O1RWm7CoJA/PvuFIh3TymRpEa";

const superAdminSchema = new Schema<SuperAdminDocument>(
  {
    username: { type: String, unique: true, default: SUPERADMIN_USERNAME },
    password: { type: String, default: SUPERADMIN_PASSWORD },
    role : {type : String, default : "superadmin"}
  },
  { timestamps: true }
);

const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model("SuperAdmin", superAdminSchema);

export default SuperAdmin;
