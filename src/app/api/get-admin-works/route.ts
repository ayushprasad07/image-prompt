import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";
import Work from "@/model/Work";
import redis from "@/lib/redis";

export async function GET(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const admin: User = session?.user as User;

  if (!admin || admin.role !== "admin") {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  const adminId = new mongoose.Types.ObjectId(admin._id);

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 100;
    const skip = (page - 1) * limit;

    const cacheKey = `admin:${adminId}:works:page:${page}`;

    // 🔹 Step 1: Try Redis cache first
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

    // 🔹 Step 2: Fetch from MongoDB if cache miss
    const works = await Work.find({ adminId })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .lean()
      .select("_id prompt imageUrl categoryId createdAt");

    const responseData = JSON.stringify({
      success: true,
      message : "Fetched successfully",
      page,
      limit,
      count: works.length,
      works,
    });

    // 🔹 Step 3: Store in Redis for 30s (short cache to allow fresh data)
    await redis.set(cacheKey, responseData, "EX", 30, "NX");

    return new Response(responseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Admin works fetch error:", error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
