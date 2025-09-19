import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Work from "@/model/Work";
import mongoose from "mongoose";
import redis from "@/lib/redis";

export async function GET(
  req: Request,
  context: { params: Promise<{ workid: string }> } // 👈 params is Promise
) {
  await dbConnect();

  // 1. Get session and user
  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!user) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // ✅ Await params
    const { workid } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(workid)) {
      return Response.json(
        { success: false, message: "Invalid work ID" },
        { status: 400 }
      );
    }

    // 🔹 Step 1: Check Redis cache first
    const cacheKey = `work:${workid}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT",
        },
      });
    }

    // 🔹 Step 2: Fetch from MongoDB
    let workDoc = null;
    if (user.role === "superadmin") {
      workDoc = await Work.findById(workid).lean();
    } else if (user.role === "admin") {
      workDoc = await Work.findOne({ _id: workid, adminId: user._id }).lean();
    } else {
      return Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    if (!workDoc) {
      return Response.json(
        { success: false, message: "Work not found" },
        { status: 404 }
      );
    }

    const responseData = JSON.stringify({
      success: true,
      message: "Fetched successfully",
      work: workDoc,
    });

    // 🔹 Step 3: Store in Redis for 30s
    await redis.set(cacheKey, responseData, "EX", 30, "NX");

    return new Response(responseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("❌ Error fetching work:", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
