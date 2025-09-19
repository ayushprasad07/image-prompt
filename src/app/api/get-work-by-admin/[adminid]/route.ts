import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Work from "@/model/Work";
import mongoose from "mongoose";

// /api/get-work-by-admin/[adminid]?page=2

interface Context {
  params: Promise<{
    adminid: string;
  }>;
}

export async function GET(req: Request, context: Context) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const superAdmin: User = session?.user as User;

  if (!superAdmin || superAdmin.role !== "superadmin") {
    return Response.json(
      {
        success: false,
        message: "Not authenticated",
      },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1"); // default = page 1
    const limit = 100; // fetch 100 works per call
    const skip = (page - 1) * limit;

    // ✅ Await params before accessing
    const { adminid } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(adminid)) {
      return Response.json(
        {
          success: false,
          message: "Invalid admin ID",
        },
        { status: 400 }
      );
    }

    const adminId = new mongoose.Types.ObjectId(adminid);

    const [works, total] = await Promise.all([
      Work.find({ adminId })
        .sort({ createdAt: -1 }) // latest first
        .skip(skip)
        .limit(limit)
        .populate("categoryId", "name"), // ✅ populate category
      Work.countDocuments({ adminId }),
    ]);

    return Response.json(
      {
        success: true,
        data: works,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get work error:", error);
    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}
