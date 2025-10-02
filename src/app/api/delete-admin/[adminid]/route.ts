// src/app/api/delete-admin/[adminid]/route.ts
import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import redis from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import Admin from "@/model/Admin";
import Work from "@/model/Work";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ adminid: string }> }
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user = session?.user as User;

  // ✅ Only superadmin can delete admins
  if (!user || user.role !== "superadmin") {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // ✅ Await params Promise
    const { adminid } = await params;

    if (!adminid || !mongoose.Types.ObjectId.isValid(adminid)) {
      return NextResponse.json(
        { success: false, message: "Invalid Admin ID" },
        { status: 400 }
      );
    }

    const adminId = new mongoose.Types.ObjectId(adminid);

    // ✅ Delete admin from DB
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);
    if (!deletedAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    // ✅ Delete all works created by this admin
    await Work.deleteMany({ adminId });

    // ✅ Remove Redis caches
    await redis.del("admins:all");
    await redis.del(`admin:${adminid}`);
    await redis.del(`works:admin:${adminid}`);

    return NextResponse.json(
      {
        success: true,
        message: "Admin and related works deleted successfully",
      },
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
