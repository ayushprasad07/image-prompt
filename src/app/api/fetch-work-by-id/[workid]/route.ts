// src/app/api/fetch-work-by-id/[workid]/route.ts
import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Work from "@/model/Work";
import mongoose from "mongoose";
import redis from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workid: string }> } // params as Promise
) {
  await dbConnect();

  // 1. Get session and user
  const session = await getServerSession(authOptions);
  const user = session?.user as User;

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { workid } = await params; // await params like in Next.js 15

    if (!mongoose.Types.ObjectId.isValid(workid)) {
      return NextResponse.json(
        { success: false, message: "Invalid work ID" },
        { status: 400 }
      );
    }

    // 🔹 Step 1: Check Redis cache first
    const cacheKey = `work:${workid}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        status: 200,
        headers: { "X-Cache": "HIT" },
      });
    }

    // 🔹 Step 2: Fetch from MongoDB
    let workDoc = null;
    if (user.role === "superadmin") {
      workDoc = await Work.findById(workid).lean();
    } else if (user.role === "admin") {
      workDoc = await Work.findOne({ _id: workid, adminId: user._id }).lean();
    } else {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    if (!workDoc) {
      return NextResponse.json(
        { success: false, message: "Work not found" },
        { status: 404 }
      );
    }

    const responseData = {
      success: true,
      message: "Fetched successfully",
      work: workDoc,
    };

    // 🔹 Step 3: Store in Redis for 30s
    await redis.set(cacheKey, JSON.stringify(responseData), "EX", 30, "NX");

    return NextResponse.json(responseData, {
      status: 200,
      headers: { "X-Cache": "MISS" },
    });
  } catch (err) {
    console.error("❌ Error fetching work:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
