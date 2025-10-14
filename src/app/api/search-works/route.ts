import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";
import redis from "@/lib/redis"; // your Redis instance (Upstash or ioredis)

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag"); // single tag
    const tags = searchParams.getAll("tags"); // multiple tags
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // 🧩 Build the MongoDB filter
    let filter = {};
    if (tag) {
      // single tag search
      filter = { tags: { $regex: tag, $options: "i" } };
    } else if (tags.length > 0) {
      // multiple tags search
      filter = { tags: { $in: tags.map(t => new RegExp(t, "i")) } };
    } else {
      // if no tag provided, return empty or all (you can change this behavior)
      return NextResponse.json({
        success: false,
        message: "Please provide at least one tag to search.",
      });
    }

    // 🔑 Create a unique cache key
    const cacheKey = `works:search:${tag || tags.sort().join(",")}:page=${page}:limit=${limit}`;

    // 🧠 Try fetching from Redis cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("✅ Cache hit:", cacheKey);
      return NextResponse.json(JSON.parse(cachedData));
    }

    console.log("🧭 Cache miss:", cacheKey);

    // 🔍 Query MongoDB if not cached
    const works = await Work.find(filter)
      .populate("adminId", "name email")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Work.countDocuments(filter);

    const responseData = {
      success: true,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      works,
    };

    // 🕒 Cache the result for 1 minute
    await redis.set(cacheKey, JSON.stringify(responseData), "EX", 60);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Error searching works by tags:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
