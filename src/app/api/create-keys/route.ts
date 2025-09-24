import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Keys from "@/model/Keys";
import redis from "@/lib/redis";

// POST route: update advertisement keys dynamically
// /api/create-keys
export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const superAdmin: User = session?.user as User;

  if (!superAdmin || superAdmin.role !== "superadmin") {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await req.json();

    // Ensure at least one field is sent
    if (!updates || Object.keys(updates).length === 0) {
      return Response.json({ success: false, message: "No fields provided for update" }, { status: 400 });
    }

    // Update if exists, else create
    const keys = await Keys.findOneAndUpdate({}, updates, { new: true, upsert: true });

    // Invalidate Redis cache
    await redis.del("ad_keys");

    return Response.json({ success: true, message: "Advertisement keys updated", data: keys });

  } catch (error) {
    console.error("Update keys error:", error);
    return Response.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
