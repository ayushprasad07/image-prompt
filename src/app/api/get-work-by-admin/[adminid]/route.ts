// src/app/api/get-work-by-admin/[adminid]/route.ts
import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Work from "@/model/Work";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// /api/get-work-by-admin/[adminid]?page=2
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adminid: string }> } // params as Promise
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const superAdmin: User = session?.user as User;

  if (!superAdmin || superAdmin.role !== "superadmin") {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { adminid } = await params; // await params like in Next.js 15

    if (!mongoose.Types.ObjectId.isValid(adminid)) {
      return NextResponse.json(
        { success: false, message: "Invalid admin ID" },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1"); // default page 1
    const limit = 100;
    const skip = (page - 1) * limit;
    const adminId = new mongoose.Types.ObjectId(adminid);

    const [works, total] = await Promise.all([
      Work.find({ adminId })
        .sort({ createdAt: -1 }) // latest first
        .skip(skip)
        .limit(limit)
        .populate("categoryId", "name"),
      Work.countDocuments({ adminId }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: works,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get work error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
