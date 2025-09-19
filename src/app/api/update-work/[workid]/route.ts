// src/app/api/update-work/[workid]/route.ts

import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import redis from "@/lib/redis";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface CloudinaryUploadResponse {
  secure_url: string;
}

export async function PUT(
  req: Request,
  { params }: { params: { workid: string } }
) {
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
    const { workid } = params; // ✅ no await needed

    if (!mongoose.Types.ObjectId.isValid(workid)) {
      return Response.json(
        { success: false, message: "Invalid work ID" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const prompt = formData.get("prompt") as string | null;
    const categoryId = formData.get("categoryId") as string | null;

    const updates: Record<string, any> = {};
    if (prompt) updates.prompt = prompt;
    if (categoryId) updates.categoryId = new mongoose.Types.ObjectId(categoryId);

    if (image) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise<CloudinaryUploadResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "Image-prompt works", resource_type: "raw" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as CloudinaryUploadResponse);
            }
          );
          uploadStream.end(buffer);
        }
      );

      updates.imageUrl = uploadResult.secure_url;
    }

    // 🔹 Step 1: Invalidate Redis caches
    await Promise.all([
      redis.del(`work:${workid}`),
      redis.del(`admin:works:${user._id}`),
    ]);

    // 🔹 Step 2: Queue async update job
    await redis.lpush(
      "work:update:queue",
      JSON.stringify({
        workId: workid,
        userId: user._id,
        role: user.role, // superadmin | admin
        updates,
      })
    );

    return Response.json(
      { success: true, message: "Work update queued successfully" },
      { status: 202 }
    );
  } catch (error) {
    console.error("Update work error:", error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
