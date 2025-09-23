import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import redis from "@/lib/redis";
import Category from "@/model/Category";
import { NextRequest, NextResponse } from "next/server";

// src/app/api/delete-category-by-id/[categoryid]/route.ts

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ categoryid: string }> } // params as Promise
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user = session?.user as User;

  if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { categoryid } = await params;
    const categoryId = new mongoose.Types.ObjectId(categoryid);

    // Remove Redis cache for categories
    await redis.del("categories:all");

    // Queue async delete (if you have a worker processing this queue)
    await redis.lpush(
      "category:delete:queue",
      JSON.stringify({ categoryId, userId: user._id, role: user.role })
    );

    return NextResponse.json(
      { success: true, message: "Category delete queued successfully" },
      { status: 202 }
    );
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
