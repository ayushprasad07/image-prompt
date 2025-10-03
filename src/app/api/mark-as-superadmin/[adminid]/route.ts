import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import Admin from "@/model/Admin";
import redis from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

// ✅ /api/mark-as-superadmin/[adminid]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ adminid: string }> } // using params as Promise
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
    const { adminid } = await params;

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

    if (admin.role === "superadmin") {
      return NextResponse.json(
        { success: false, message: "Admin is already a superadmin" },
        { status: 400 }
      );
    }

    // ✅ Update role
    admin.role = "superadmin";
    await admin.save();

    // ✅ Invalidate Redis caches (since data changed)
    // We don’t know all cache keys, so remove all that match `admins:*`
    const keys = await redis.keys("admins:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return NextResponse.json(
      {
        success: true,
        message: `${admin.username} is now a superadmin`,
        data: admin,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error upgrading admin:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
