import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Privacy from "@/model/Privacy";
import redis from "@/lib/redis";

// POST /api/create-privacy-policy
export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const superAdmin: User = session?.user as User;

  if (!superAdmin || superAdmin.role !== "superadmin") {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();

    // if (!url) {
    //   return Response.json({ success: false, message: "URL is required" }, { status: 400 });
    // }

    // Update if exists, else create new
    const privacy = await Privacy.findOneAndUpdate({}, { url }, { new: true, upsert: true });

    // Clear Redis cache if you use it
    await redis.del("privacy_policy");

    return Response.json({
      success: true,
      message: "Privacy Policy updated successfully",
      data: privacy,
    });
  } catch (error) {
    console.error("Privacy policy update error:", error);
    return Response.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
