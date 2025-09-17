import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Admin from "@/model/Admin";
import redis from "@/lib/redis";
import { NextResponse } from "next/server";

// /api/admins?limit=50&page=1

export async function GET(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const superAdmin: User = session?.user as User;

  if (!superAdmin || superAdmin.role !== "superadmin") {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100"); // default 100
    const page = parseInt(searchParams.get("page") || "1"); // default page 1
    const skip = (page - 1) * limit;

    const cacheKey = `admins:page:${page}:limit:${limit}`;

    // ✅ Check Redis cache first
    const cachedAdmins = await redis.get(cacheKey);
    if (cachedAdmins) {
      return NextResponse.json(
        JSON.parse(cachedAdmins),
        { status: 200 }
      );
    }

    // Fetch from MongoDB if not cached
    const admins = await Admin.find({})
      .skip(skip)
      .limit(limit)
      .select("-password"); // exclude password

    const totalAdmins = await Admin.countDocuments();

    const responseData = {
      success: true,
      message: "Admins fetched successfully",
      data: admins,
      pagination: {
        total: totalAdmins,
        page,
        limit,
        totalPages: Math.ceil(totalAdmins / limit),
      },
    };

    // ✅ Cache the result in Redis for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(responseData));

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
