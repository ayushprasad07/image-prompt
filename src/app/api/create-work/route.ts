


// import dbConnect from "@/lib/dbConnect";
// import { getServerSession, User } from "next-auth";
// import Work from "@/model/Work";
// import mongoose from "mongoose";
// import fs from "fs";
// import path from "path";
// import redlock from "@/lib/redlock";
// import { authOptions } from "../auth/[...nextauth]/options";

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

//   const adminId = new mongoose.Types.ObjectId(admin._id);
//   const lockKey = `upload-lock:${adminId}`;
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

//     const uploadDir = path.join(process.cwd(), "public", "uploads", adminId.toString());
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
//     const filepath = path.join(uploadDir, filename);
//     fs.writeFileSync(filepath, buffer);

//     // URL should be relative to public directory
//     const publicUrl = `/uploads/${adminId}/${filename}`;



//     // Save DB entry
//     await new Work({
//       adminId,
//       prompt,
//       imageUrl: publicUrl,
//       categoryId: new mongoose.Types.ObjectId(categoryId),
//     }).save();

//     return Response.json({
//       success: true,
//       message: "Work created",
//       imageUrl: publicUrl,
//     });
//   } catch (err) {
//     console.error("Upload error:", err);
//     return Response.json(
//       { success: false, message: "Upload failed or locked" },
//       { status: 429 }
//     );
//   } finally {
//     if (lock) await redlock.release(lock).catch(() => {});
//   }
// }
// src/app/api/create-work/route.ts
// ... existing imports ...

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

//   const adminId = new mongoose.Types.ObjectId(admin._id);
//   const lockKey = `upload-lock:${adminId}`;
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

//     // Use consistent upload path that matches nginx serving
//     const uploadDir = path.join(process.cwd(), "public", "uploads", adminId.toString());
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
//     const filepath = path.join(uploadDir, filename);
//     fs.writeFileSync(filepath, buffer);

//     // URL should be relative to public directory
//     const publicUrl = `/uploads/${adminId}/${filename}`;

//     // Save DB entry
//     await new Work({
//       adminId,
//       prompt,
//       imageUrl: publicUrl,
//       categoryId: new mongoose.Types.ObjectId(categoryId),
//     }).save();

//     return Response.json({
//       success: true,
//       message: "Work created",
//       imageUrl: publicUrl,
//     });
//   } catch (err) {
//     console.error("Upload error:", err);
//     return Response.json(
//       { success: false, message: "Upload failed or locked" },
//       { status: 429 }
//     );
//   } finally {
//     if (lock) await redlock.release(lock).catch(() => {});
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
    const tagsRaw = formData.get("tags") as string | null; // ✅ Get tags field

    if (!image || !prompt || !categoryId) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Parse tags (comma separated or JSON)
    let tags: string[] = [];
    if (tagsRaw) {
      try {
        if (tagsRaw.startsWith("[")) {
          // JSON array string like ["tag1","tag2"]
          tags = JSON.parse(tagsRaw);
        } else {
          // Comma separated string like "tag1,tag2"
          tags = tagsRaw.split(",").map((t) => t.trim()).filter(t => t.length > 0);
        }
      } catch (e) {
        console.warn("Invalid tags format, skipping...");
      }
    }

    const buffer = Buffer.from(await image.arrayBuffer());

    // Use consistent upload path that matches nginx serving
    const uploadDir = path.join(process.cwd(), "public", "uploads", adminId.toString());
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    // ✅ Use absolute URL instead of relative
    const publicUrl = `https://admin.novaprompt.in/uploads/${adminId}/${filename}`;

    // Save DB entry with tags
    await new Work({
      adminId,
      prompt,
      imageUrl: publicUrl,
      categoryId: new mongoose.Types.ObjectId(categoryId),
      tags, // ✅ Save tags array
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