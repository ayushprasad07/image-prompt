// /api/get-work-by-id/[workid]
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";
import redis from "@/lib/redis";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import "@/model/Category";
import "@/model/Admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workid: string }> }
) {
    await dbConnect();

  const session = await getServerSession(authOptions);
  const user = session?.user as User;

  if (!user || user.role !== "superadmin") {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { workid } = await params;

    if (!workid) {
      return NextResponse.json(
        { success: false, message: "Work ID is required" },
        { status: 400 }
      );
    }

    

    const cacheKey = `work:${workid}`;

    // ✅ Try Redis Cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("📦 Returning from Redis Cache");
      return NextResponse.json(JSON.parse(cachedData));
    }

    // ✅ Fetch from MongoDB
    const work = await Work.findById(workid)
      .populate("adminId", "username email")
      .populate("categoryId", "name")
      .lean();

    if (!work) {
      return NextResponse.json(
        { success: false, message: "Work not found" },
        { status: 404 }
      );
    }

    // ✅ Store in Redis for next time
    await redis.set(cacheKey, JSON.stringify(work), "EX", 3600); // expires in 1 hour

    return NextResponse.json({ success: true, data: work });
  } catch (error: any) {
    console.error("❌ Error fetching work by id:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
