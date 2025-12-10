// // src/app/api/update-work/[workid]/route.ts

// import dbConnect from "@/lib/dbConnect";
// import { getServerSession, User } from "next-auth";
// import { authOptions } from "../../auth/[...nextauth]/options";
// import mongoose from "mongoose";
// import { v2 as cloudinary } from "cloudinary";
// import redis from "@/lib/redis";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// });

// interface CloudinaryUploadResponse {
//   secure_url: string;
// }

// export async function PUT(
//   req: Request,
//   { params }: { params: Promise<{ workid: string }> } // params as Promise
// ) {
//   await dbConnect();

//   const session = await getServerSession(authOptions);
//   const user = session?.user as User;

//   if (!user) {
//     return Response.json(
//       { success: false, message: "Not authenticated" },
//       { status: 401 }
//     );
//   }

//   try {
//     const { workid } = await params; // ✅ await params like in Next.js 15

//     if (!mongoose.Types.ObjectId.isValid(workid)) {
//       return Response.json(
//         { success: false, message: "Invalid work ID" },
//         { status: 400 }
//       );
//     }

//     const formData = await req.formData();
//     const image = formData.get("image") as File | null;
//     const prompt = formData.get("prompt") as string | null;
//     const categoryId = formData.get("categoryId") as string | null;

//     const updates: Record<string, any> = {};
//     if (prompt) updates.prompt = prompt;
//     if (categoryId) updates.categoryId = new mongoose.Types.ObjectId(categoryId);

//     if (image) {
//       const bytes = await image.arrayBuffer();
//       const buffer = Buffer.from(bytes);

//       const uploadResult = await new Promise<CloudinaryUploadResponse>(
//         (resolve, reject) => {
//           const uploadStream = cloudinary.uploader.upload_stream(
//             { folder: "Image-prompt works", resource_type: "raw" },
//             (error, result) => {
//               if (error) reject(error);
//               else resolve(result as CloudinaryUploadResponse);
//             }
//           );
//           uploadStream.end(buffer);
//         }
//       );

//       updates.imageUrl = uploadResult.secure_url;
//     }

//     // 🔹 Step 1: Invalidate Redis caches
//     await Promise.all([
//       redis.del(`work:${workid}`),
//       redis.del(`admin:works:${user._id}`),
//     ]);

//     // 🔹 Step 2: Queue async update job
//     await redis.lpush(
//       "work:update:queue",
//       JSON.stringify({
//         workId: workid,
//         userId: user._id,
//         role: user.role, // superadmin | admin
//         updates,
//       })
//     );

//     fetch('https://image-prompt-update-worker.onrender.com/');

//     return Response.json(
//       { success: true, message: "Work update queued successfully" },
//       { status: 202 }
//     );
//   } catch (error) {
//     console.error("Update work error:", error);
//     return Response.json(
//       { success: false, message: "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/update-work/[workid]/route.ts

// import dbConnect from "@/lib/dbConnect";
// import { getServerSession, User } from "next-auth";
// import { authOptions } from "../../auth/[...nextauth]/options";
// import mongoose from "mongoose";
// import fs from "fs";
// import path from "path";
// import Work from "@/model/Work";

// export async function PUT(
//   req: Request,
//   { params }: { params: Promise<{ workid: string }> } // params as Promise
// ) {
//   await dbConnect();

//   const session = await getServerSession(authOptions);
//   const user = session?.user as User;

//   if (!user) {
//     return Response.json(
//       { success: false, message: "Not authenticated" },
//       { status: 401 }
//     );
//   }

//   try {
//     const { workid } = await params; // ✅ await params like in Next.js 15

//     if (!mongoose.Types.ObjectId.isValid(workid)) {
//       return Response.json(
//         { success: false, message: "Invalid work ID" },
//         { status: 400 }
//       );
//     }

//     const formData = await req.formData();
//     const image = formData.get("image") as File | null;
//     const prompt = formData.get("prompt") as string | null;
//     const categoryId = formData.get("categoryId") as string | null;
//     const tagsRaw = formData.get("tags") as string | null; // ✅ Get tags field

//     const updates: Record<string, any> = {};
//     if (prompt) updates.prompt = prompt;
//     if (categoryId) updates.categoryId = new mongoose.Types.ObjectId(categoryId);

//     // ✅ Parse tags (comma separated or JSON)
//     if (tagsRaw !== null) {
//       let tags: string[] = [];
//       try {
//         if (tagsRaw.startsWith("[")) {
//           // JSON array string like ["tag1","tag2"]
//           tags = JSON.parse(tagsRaw);
//         } else {
//           // Comma separated string like "tag1,tag2"
//           tags = tagsRaw.split(",").map((t) => t.trim()).filter(t => t.length > 0);
//         }
//         updates.tags = tags;
//       } catch (e) {
//         console.warn("Invalid tags format, skipping...");
//       }
//     }

//     if (image) {
//       const buffer = Buffer.from(await image.arrayBuffer());
//       const adminId = new mongoose.Types.ObjectId(user._id);

//       // Use consistent upload path that matches nginx serving
//       const uploadDir = path.join(process.cwd(), "public", "uploads", adminId.toString());
//       if (!fs.existsSync(uploadDir)) {
//         fs.mkdirSync(uploadDir, { recursive: true });
//       }

//       const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
//       const filepath = path.join(uploadDir, filename);
//       fs.writeFileSync(filepath, buffer);

//       // ✅ Use absolute URL instead of relative (matching your POST route)
//       updates.imageUrl = `https://admin.novaprompt.in/uploads/${adminId}/${filename}`;
//     }

//     // ✅ Direct database update (no Redis queue)
//     const updatedWork = await Work.findByIdAndUpdate(
//       workid,
//       { ...updates, updatedAt: new Date() },
//       { new: true, runValidators: true }
//     );

//     if (!updatedWork) {
//       return Response.json(
//         { success: false, message: "Work not found" },
//         { status: 404 }
//       );
//     }

//     return Response.json(
//       { 
//         success: true, 
//         message: "Work updated successfully",
//         data: updatedWork 
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Update work error:", error);
//     return Response.json(
//       { success: false, message: "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }

import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Work from "@/model/Work";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ workid: string }> }
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
    const { workid } = await params;

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
    const tagsRaw = formData.get("tags") as string | null;

    const updates: Record<string, any> = {};

    if (prompt) updates.prompt = prompt;
    if (categoryId) updates.categoryId = new mongoose.Types.ObjectId(categoryId);

    // ✅ Safe tag parsing
    if (tagsRaw !== null) {
      try {
        updates.tags = tagsRaw.startsWith("[")
          ? JSON.parse(tagsRaw)
          : tagsRaw
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
      } catch {
        console.warn("Invalid tags format, skipping...");
      }
    }

    // ✅ IMAGE UPDATE (PERMANENT STORAGE SAFE)
    if (image) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const adminId = new mongoose.Types.ObjectId(user._id);

      // ✅ FORCE VPS-SAFE ABSOLUTE PATH
      const BASE_UPLOAD_PATH = "/app/public/uploads";
      const uploadDir = path.join(BASE_UPLOAD_PATH, adminId.toString());

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${image.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;

      const filepath = path.join(uploadDir, filename);

      // ✅ WRITE TO VPS DISK (SAFE FOREVER)
      fs.writeFileSync(filepath, buffer);

      updates.imageUrl = `https://admin.novaprompt.in/uploads/${adminId}/${filename}`;
    }

    // ✅ Direct DB update
    const updatedWork = await Work.findByIdAndUpdate(
      workid,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedWork) {
      return Response.json(
        { success: false, message: "Work not found" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Work updated successfully",
        data: updatedWork,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update work error:", error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
