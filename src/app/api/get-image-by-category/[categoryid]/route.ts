// src/app/api/get-works-by-category/[categoryid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";
import redis from "@/lib/redis";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ categoryid: string }> } // params as Promise
) {
  try {
    await dbConnect();

    // Await the params before using
    const { categoryid } = await context.params;

    if (!categoryid) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Convert to ObjectId safely
    const parsedCategoryId = mongoose.Types.ObjectId.isValid(categoryid)
      ? new mongoose.Types.ObjectId(categoryid)
      : categoryid;

    const cacheKey = `works:category:${categoryid}`;

    // Check Redis cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData && cachedData !== "[]") {
      console.log("Works fetched from Redis:", cachedData);
      return NextResponse.json(
        { works: JSON.parse(cachedData), source: "cache" },
        { status: 200 }
      );
    }

    // Fetch from MongoDB if not cached
    const works = await Work.find({ categoryId: parsedCategoryId }).select(
      "imageUrl prompt tags"
    );

    // Store in Redis (1 hour)
    await redis.set(cacheKey, JSON.stringify(works), "EX", 60 * 60);

    return NextResponse.json({ works, source: "db" }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching works:", error);
    return NextResponse.json(
      { error: "Failed to fetch works" },
      { status: 500 }
    );
  }
}
