// src/app/api/superadmin/update-username/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SuperAdmin from "@/model/SuperAdmin";
import Admin from "@/model/Admin";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user?.username) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    // 🔍 Check if user is a SuperAdmin (in either collection)
    const [admin, superAdminUser] = await Promise.all([
      Admin.findOne({ username: user.username }),
      SuperAdmin.findOne({ username: user.username }),
    ]);

    const isAuthorized =
      (admin && admin.role === "superadmin") || superAdminUser;

    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { newUsername } = await req.json();
    if (!newUsername?.trim()) {
      return NextResponse.json({ message: "New username required" }, { status: 400 });
    }

    const trimmedUsername = newUsername.trim();

    // 🧠 Ensure SuperAdmin record exists
    let superAdmin = await SuperAdmin.findOne();
    if (!superAdmin) {
      superAdmin = await SuperAdmin.create({});
    }

    // 📝 Update SuperAdmin username
    superAdmin.username = trimmedUsername;
    await superAdmin.save();

    // 📝 If admin record exists for superadmin, update that too
    if (admin) {
      admin.username = trimmedUsername;
      await admin.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "SuperAdmin username updated successfully",
        username: trimmedUsername,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating SuperAdmin username:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
