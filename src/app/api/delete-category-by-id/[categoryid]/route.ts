import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import redis from "@/lib/redis";
import Category from "@/model/Category";
import Work from "@/model/Work"; // Make sure this exists
import { NextRequest, NextResponse } from "next/server";

// src/app/api/delete-category-by-id/[categoryid]/route.ts
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ categoryid: string }> }
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

    // Delete category from DB
    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Delete all works related to this category
    await Work.deleteMany({ categoryId });

    // Remove Redis caches
    await redis.del("categories:all");
    await redis.del(`works:category:${categoryid}`); // optional cache key for works of this category

    return NextResponse.json(
      {
        success: true,
        message: "Category and related works deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
