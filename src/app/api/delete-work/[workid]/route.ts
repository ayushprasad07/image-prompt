import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import redis from "@/lib/redis";

interface Params {
  params: {
    workid: string;
  };
}

export async function DELETE(req: Request, { params }: Params) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user = session?.user as User;

  if (!user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const workId = params.workid;

    // 🔹 Step 1: Remove from Redis immediately (fast)
    await Promise.all([
      redis.del(`work:${workId}`),
      redis.del(`admin:works:${user._id}`), // invalidate admin’s work list
    ]);

    // 🔹 Step 2: Push delete request to a Redis queue (async DB delete)
    await redis.lpush(
      "work:delete:queue",
      JSON.stringify({ workId, userId: user._id, role: user.role })
    );

    // Respond quickly without waiting for MongoDB
    return Response.json(
      { success: true, message: "Work delete queued successfully" },
      { status: 202 }
    );
  } catch (error) {
    console.error("Delete work error:", error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
