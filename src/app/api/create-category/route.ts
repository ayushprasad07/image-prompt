import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import Category from "@/model/Category";

export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const superAdmin: User = session?.user as User;

  if (!superAdmin || superAdmin.role !== "superadmin") {
    return Response.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === "") {
      return Response.json(
        {
          success: false,
          message: "Category name is required",
        },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existing = await Category.findOne({ name });
    if (existing) {
      return Response.json(
        {
          success: false,
          message: "Category already exists",
        },
        { status: 400 }
      );
    }

    const newCategory = await Category.create({ name });

    return Response.json(
      {
        success: true,
        message: "Category created successfully",
        data: newCategory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return Response.json(
      {
        success: false,
        message: "Something went wrong while creating category",
      },
      { status: 500 }
    );
  }
}
