import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import redis from "@/lib/redis";

interface Params {
  params: { workid: string };
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface CloudinaryUploadResponse {
  secure_url: string;
}

export async function PUT(req: Request, { params }: Params) {
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

    // Invalidate cache before queuing
    await Promise.all([
      redis.del(`work:${params.workid}`),
      redis.del(`admin:works:${user._id}`),
    ]);

    // Queue update job
    await redis.lpush(
      "work:update:queue",
      JSON.stringify({
        workId: params.workid,
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
