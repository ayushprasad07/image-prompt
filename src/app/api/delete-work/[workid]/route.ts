import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import Work from "@/model/Work";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workid: string }> } // params as Promise
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user = session?.user as User;

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { workid } = await params; // await params
    if (!workid) {
      return NextResponse.json(
        { success: false, message: "workid is required" },
        { status: 400 }
      );
    }

    const workObjectId = new mongoose.Types.ObjectId(workid);

    // Delete the work directly from the database
    const deleted = await Work.findByIdAndDelete(workObjectId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Work not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Work deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete work error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
