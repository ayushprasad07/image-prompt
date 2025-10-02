// src/app/api/get-superadmin/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SuperAdmin from "@/model/SuperAdmin";

export async function GET() {
  try {
    await dbConnect();

    // Get the first/default superadmin
    const superAdmin = await SuperAdmin.findOne().select("username password"); // only username & password

    if (!superAdmin) {
      return NextResponse.json(
        { success: false, message: "SuperAdmin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, superAdmin },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching SuperAdmin credentials:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
