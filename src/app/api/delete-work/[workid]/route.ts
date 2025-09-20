import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import redis from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { workid: string } }  // destructure params
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
    const workId = new mongoose.Types.ObjectId(params.workid); // use destructured params

    // Remove from Redis immediately
    await Promise.all([
      redis.del(`work:${workId}`),
      redis.del(`admin:works:${user._id}`),
    ]);

    // Queue async delete
    await redis.lpush(
      "work:delete:queue",
      JSON.stringify({ workId, userId: user._id, role: user.role })
    );

    return NextResponse.json(
      { success: true, message: "Work delete queued successfully" },
      { status: 202 }
    );
  } catch (error) {
    console.error("Delete work error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
