// src/app/api/fetch-category-by-id/[categoryid]/route.ts
import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Category from "@/model/Category";
import redis from "@/lib/redis";

export async function GET(
  req: Request,
  { params }: { params: { categoryid: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { categoryid } = params; // ✅ no need for await

    if (!categoryid) {
      return Response.json(
        { success: false, message: "Category ID is required" },
        { status: 400 }
      );
    }

    const cacheKey = `category:id:${categoryid}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return Response.json(
        { success: true, data: JSON.parse(cached), cached: true },
        { status: 200 }
      );
    }

    const category = await Category.findById(categoryid);

    if (!category) {
      return Response.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    await redis.setex(cacheKey, 600, JSON.stringify(category));

    return Response.json(
      { success: true, data: category, cached: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
