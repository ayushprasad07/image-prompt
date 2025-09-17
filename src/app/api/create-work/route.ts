// import dbConnect from "@/lib/dbConnect";
// import { getServerSession, User } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]/options";
// import Work from "@/model/Work";
// import mongoose from "mongoose";
// import { v2 as cloudinary } from "cloudinary";

// // Store active uploads (in-memory)
// const activeUploads = new Map<string, boolean>();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// });

// function uploadToCloudinary(file: File): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const uploadStream = cloudinary.uploader.upload_stream(
//       { folder: "Image-prompt-works", resource_type: "image" },
//       (error, result) => {
//         if (error) return reject(error);
//         resolve(result?.secure_url || "");
//       }
//     );

//     const reader = file.stream().getReader();
//     function pump() {
//       reader.read().then(({ done, value }) => {
//         if (done) return uploadStream.end();
//         uploadStream.write(Buffer.from(value));
//         pump();
//       });
//     }
//     pump();
//   });
// }

// export async function POST(req: Request) {
//   await dbConnect();

//   const session = await getServerSession(authOptions);
//   const admin: User = session?.user as User;

//   if (!admin || admin.role !== "admin") {
//     return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
//   }

//   const userId = admin._id as string;

//   // Check if user already has an active upload
//   if (activeUploads.get(userId)) {
//     return Response.json(
//       { success: false, message: "You already have an upload in progress. Please wait." },
//       { status: 429 }
//     );
//   }

//   try {
//     activeUploads.set(userId, true); // Lock user

//     const formData = await req.formData();
//     const image = formData.get("image") as File | null;
//     const prompt = formData.get("prompt") as string;
//     const categoryId = formData.get("categoryId") as string;

//     if (!image || !prompt) {
//       return Response.json(
//         { success: false, message: "Please provide Image and prompt" },
//         { status: 400 }
//       );
//     }

//     if (!categoryId) {
//       return Response.json(
//         { success: false, message: "Please provide category" },
//         { status: 400 }
//       );
//     }

//     const url = await uploadToCloudinary(image);

//     const work = new Work({
//       admin: new mongoose.Types.ObjectId(userId),
//       prompt,
//       image: url,
//       categoryId: new mongoose.Types.ObjectId(categoryId),
//     });

//     await work.save();

//     return Response.json({ success: true, message: "Work created successfully" });
//   } catch (error) {
//     console.error("Upload error:", error);
//     return Response.json({ success: false, message: "Something went wrong" }, { status: 500 });
//   } finally {
//     activeUploads.delete(userId); // Unlock user after upload completes/fails
//   }
// }


import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Work from "@/model/Work";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import redlock from "@/lib/redlock";

interface Params {
  params: { adminid: string };
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

export async function POST(req: Request, { params }: Params) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const admin: User = session?.user as User;

  if (!admin || admin.role !== "admin") {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const adminid = new mongoose.Types.ObjectId(session?.user._id);

  // Redis lock key for this admin
  const lockKey = `upload-lock:${adminid}`;

  try {
    // Try to acquire lock for 30s
    const lock = await redlock.acquire([lockKey], 30_000);

    try {
      const formData = await req.formData();
      const image = formData.get("image") as File | null;
      const prompt = formData.get("prompt") as string;
      const categoryId = formData.get("categoryId") as string;

      if (!image || !prompt) {
        return Response.json(
          { success: false, message: "Please provide Image and prompt" },
          { status: 400 }
        );
      }

      if (!categoryId) {
        return Response.json(
          { success: false, message: "Please provide category" },
          { status: 400 }
        );
      }

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

      const url = uploadResult.secure_url || "";

      const work = new Work({
        admin: adminid,
        prompt,
        image: url,
        categoryId: new mongoose.Types.ObjectId(categoryId),
      });

      await work.save();

      return Response.json({
        success: true,
        message: "Work created successfully",
      });
    } finally {
      // Always release the lock
      await lock.unlock().catch(() => {});
    }
  } catch (err) {
    // If lock is already held by another request
    return Response.json(
      { success: false, message: "Another upload is in progress. Try again later." },
      { status: 429 }
    );
  }
}
