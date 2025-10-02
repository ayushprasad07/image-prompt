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

  // ✅ Check if user is superadmin
  if (!superAdmin || superAdmin.role !== "superadmin") {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { url, termsAdnConditions } = await req.json();

    // ✅ Validate fields (optional)
    if (!url && !termsAdnConditions) {
      return Response.json(
        { success: false, message: "At least one field is required" },
        { status: 400 }
      );
    }

    // ✅ Update existing or create new document
    const privacy = await Privacy.findOneAndUpdate(
      {},
      { url, termsAdnConditions },
      { new: true, upsert: true }
    );

    // ✅ Clear Redis cache
    await redis.del("privacy_policy");

    return Response.json({
      success: true,
      message: "Privacy Policy updated successfully",
      data: privacy,
    });
  } catch (error) {
    console.error("Privacy policy update error:", error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
