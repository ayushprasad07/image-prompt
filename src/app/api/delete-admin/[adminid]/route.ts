import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Admin from "@/model/Admin";
import redis from "@/lib/redis";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// /api/delete-admin/[adminid]
export async function DELETE(
  request: NextRequest,
  context: { params: { adminid: string } }
): Promise<NextResponse> {
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
    const { adminid } = context.params;

    if (!mongoose.Types.ObjectId.isValid(adminid)) {
      return NextResponse.json(
        { success: false, message: "Invalid admin ID" },
        { status: 400 }
      );
    }

    const admin = await Admin.findById(adminid);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    await Admin.findByIdAndDelete(adminid);

    // Invalidate Redis cache
    const keys = await redis.keys("admins:*");
    if (keys.length > 0) {
      await redis.del(keys);
    }

    return NextResponse.json(
      { success: true, message: "Admin deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Delete admin error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
