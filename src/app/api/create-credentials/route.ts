import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Admin from "@/model/Admin";
import bcrypt from "bcryptjs";
import redis from "@/lib/redis"; // ✅ import redis

export async function POST(req: Request) {
  await dbConnect();
  
  const session = await getServerSession(authOptions);
  const superAdmin: User = session?.user as User;

  if (!superAdmin || superAdmin.role !== "superadmin") {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return Response.json(
        { success: false, message: "Please provide username and password" },
        { status: 400 }
      );
    }

    const existing = await Admin.findOne({ username });
    if (existing) {
      return Response.json(
        { success: false, message: "Username already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      username,
      password: hashedPassword,
    });

    // ✅ Invalidate all admin page caches
    const keys = await redis.keys('admins:page:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }

    return Response.json(
      {
        success: true,
        message: "Credentials created successfully",
        admin: {
          _id: admin._id,
          username: admin.username,
          role: admin.role,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Create admin error:", error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
