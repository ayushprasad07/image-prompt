import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Admin from "@/model/Admin";
import redis from "@/lib/redis";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

// /api/admins/[adminid]
export async function DELETE(
  req: Request,
  { params }: { params: { adminid: string } } // ✅ inline type
) {
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
    if (!mongoose.Types.ObjectId.isValid(params.adminid)) {
      return NextResponse.json(
        { success: false, message: "Invalid admin ID" },
        { status: 400 }
      );
    }

    const adminId = new mongoose.Types.ObjectId(params.adminid);
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    await Admin.findByIdAndDelete(adminId);

    // Invalidate Redis cache for admin lists
    const keys = await redis.keys("admins:*");
    if (keys.length > 0) {
      await redis.del(keys);
    }

    return NextResponse.json(
      { success: true, message: "Admin deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
