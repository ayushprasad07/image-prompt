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


// import dbConnect from "@/lib/dbConnect";
// import { getServerSession, User } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]/options";
// import Work from "@/model/Work";
// import mongoose from "mongoose";
// import { v2 as cloudinary } from "cloudinary";
// import redlock from "@/lib/redlock";

// // interface Params {
// //   params: { adminid: string };
// // }

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// });

// interface CloudinaryUploadResponse {
//   secure_url: string;
// }

// export async function POST(req: Request) {
//   await dbConnect();
//   const session = await getServerSession(authOptions);
//   const admin: User = session?.user as User;

//   if (!admin || admin.role !== "admin") {
//     return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
//   }

//   const adminid = new mongoose.Types.ObjectId(session?.user._id);
//   const lockKey = `upload-lock:${adminid}`;

//   let lock;
//   try {
//     lock = await redlock.acquire([lockKey], 30_000);

//     const formData = await req.formData();
//     const image = formData.get("image") as File | null;
//     const prompt = formData.get("prompt") as string;
//     const categoryId = formData.get("categoryId") as string;

//     if (!image || !prompt || !categoryId) {
//       return Response.json(
//         { success: false, message: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const buffer = Buffer.from(await image.arrayBuffer());

//     const uploadResult = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         { folder: "Image-prompt works", resource_type: "image" },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result as CloudinaryUploadResponse);
//         }
//       );
//       uploadStream.end(buffer);
//     });

//     await new Work({
//       adminId: adminid,
//       prompt,
//       imageUrl: uploadResult.secure_url,
//       categoryId: new mongoose.Types.ObjectId(categoryId),
//     }).save();

//     return Response.json({ success: true, message: "Work created successfully" });
//   } catch (err) {
//     console.error("Redlock error:", err);
//     return Response.json(
//       { success: false, message: "Another upload is in progress. Try again later." },
//       { status: 429 }
//     );
//   } finally {
//     if (lock) {
//       try {
//         await redlock.release(lock);
//       } catch (releaseErr) {
//         console.error("Failed to release lock:", releaseErr);
//       }
//     }
//   }
// }


// import dbConnect from "@/lib/dbConnect";
// import { getServerSession, User } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]/options";
// import Work from "@/model/Work";
// import mongoose from "mongoose";
// import { v2 as cloudinary } from "cloudinary";
// import redlock from "@/lib/redlock";
// import { Readable } from "stream";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// });

// interface CloudinaryUploadResponse {
//   secure_url: string;
// }

// export const config = {
//   api: {
//     bodyParser: false,
//     sizeLimit: "50mb",
//   },
// };

// export async function POST(req: Request) {
//   await dbConnect();
//   const session = await getServerSession(authOptions);
//   const admin: User = session?.user as User;

//   if (!admin || admin.role !== "admin") {
//     return Response.json(
//       { success: false, message: "Unauthorized" },
//       { status: 401 }
//     );
//   }

//   const adminid = new mongoose.Types.ObjectId(session?.user._id);
//   const lockKey = `upload-lock:${adminid}`;

//   let lock;
//   try {
//     lock = await redlock.acquire([lockKey], 30_000);

//     const formData = await req.formData();
//     const image = formData.get("image") as File | null;
//     const prompt = formData.get("prompt") as string;
//     const categoryId = formData.get("categoryId") as string;
//     const tagsRaw = formData.get("tags") as string | null; // ✅ new field

//     if (!image || !prompt || !categoryId) {
//       return Response.json(
//         { success: false, message: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // ✅ Parse tags (comma separated or JSON)
//     let tags: string[] = [];
//     if (tagsRaw) {
//       try {
//         if (tagsRaw.startsWith("[")) {
//           // JSON array string like ["tag1","tag2"]
//           tags = JSON.parse(tagsRaw);
//         } else {
//           // Comma separated string like "tag1,tag2"
//           tags = tagsRaw.split(",").map((t) => t.trim());
//         }
//       } catch (e) {
//         console.warn("Invalid tags format, skipping...");
//       }
//     }

//     // Convert File to a readable stream
//     const arrayBuffer = await image.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);
//     const stream = Readable.from(buffer);

//     // Upload stream directly to Cloudinary
//     const uploadResult = await new Promise<CloudinaryUploadResponse>(
//       (resolve, reject) => {
//         const uploadStream = cloudinary.uploader.upload_stream(
//           { folder: "Image-prompt works", resource_type: "image" },
//           (error, result) => {
//             if (error) reject(error);
//             else resolve(result as CloudinaryUploadResponse);
//           }
//         );
//         stream.pipe(uploadStream);
//       }
//     );

//     await new Work({
//       adminId: adminid,
//       prompt,
//       imageUrl: uploadResult.secure_url,
//       categoryId: new mongoose.Types.ObjectId(categoryId),
//       tags, // ✅ save tags
//     }).save();

//     return Response.json({
//       success: true,
//       message: "Work created successfully",
//     });
//   } catch (err) {
//     console.error("Redlock or upload error:", err);
//     return Response.json(
//       { success: false, message: "Another upload is in progress or upload failed." },
//       { status: 429 }
//     );
//   } finally {
//     if (lock) {
//       try {
//         await redlock.release(lock);
//       } catch (releaseErr) {
//         console.error("Failed to release lock:", releaseErr);
//       }
//     }
//   }
// }


import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import Work from "@/model/Work";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import redlock from "@/lib/redlock";
import { authOptions } from "../auth/[...nextauth]/options";

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "50mb",
  },
};

export async function POST(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  const admin: User = session?.user as User;

  if (!admin || admin.role !== "admin") {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const adminId = new mongoose.Types.ObjectId(admin._id);
  const lockKey = `upload-lock:${adminId}`;
  let lock;

  try {
    lock = await redlock.acquire([lockKey], 30_000);

    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const prompt = formData.get("prompt") as string;
    const categoryId = formData.get("categoryId") as string;

    if (!image || !prompt || !categoryId) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());

    // 📌 Use Docker volume path
    const uploadDir = path.join("/uploads", adminId.toString());
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    // URL stored in DB stays the same
    const publicUrl = `/uploads/${adminId}/${filename}`;



    // Save DB entry
    await new Work({
      adminId,
      prompt,
      imageUrl: publicUrl,
      categoryId: new mongoose.Types.ObjectId(categoryId),
    }).save();

    return Response.json({
      success: true,
      message: "Work created",
      imageUrl: publicUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json(
      { success: false, message: "Upload failed or locked" },
      { status: 429 }
    );
  } finally {
    if (lock) await redlock.release(lock).catch(() => {});
  }
}
