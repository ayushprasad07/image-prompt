// src/app/api/get-all-categories/route.ts
import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Category from "@/model/Category";
import redis from "@/lib/redis";

export async function GET(req: Request) {
  await dbConnect();
  // const session = await getServerSession(authOptions);
  // const user: User = session?.user as User;

  // // ✅ Fix role check
  // if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
  //   return Response.json(
  //     { success: false, message: "Unauthorized" },
  //     { status: 401 }
  //   );
  // }

  try {
    // ✅ Try Redis cache first
    const cachedCategories = await redis.get("categories:all");
    if (cachedCategories) {
      return Response.json({
        success: true,
        data: JSON.parse(cachedCategories),
        cached: true,
      });
    }

    // ✅ Fetch from MongoDB
    const categories = await Category.find().sort({ createdAt: -1 });

    // ✅ Save to Redis with TTL (10 min)
    await redis.setex("categories:all", 600, JSON.stringify(categories));

    return Response.json({
      success: true,
      data: categories,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
