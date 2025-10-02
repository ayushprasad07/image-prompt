export const dynamic = "force-dynamic";

import { getServerSession, User } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

let firebaseAdmin: any = null;

async function getAdmin() {
  if (!firebaseAdmin) {
    const adminModule = await import("firebase-admin");
    if (!adminModule.apps.length) {
      adminModule.initializeApp({
        credential: adminModule.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    firebaseAdmin = adminModule;
  }
  return firebaseAdmin;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "50mb",
  },
};

interface CloudinaryUploadResponse {
  secure_url: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if (!user || user.role !== "superadmin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const click_action = formData.get("click_action") as string | null;
    const imageFile = formData.get("image") as File | null;

    if (!title || !message) {
      return Response.json({ success: false, message: "Title and message are required" }, { status: 400 });
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const stream = Readable.from(buffer);

      const uploadResult = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "Notification-images", resource_type: "image" },
          (error, result) => error ? reject(error) : resolve(result as CloudinaryUploadResponse)
        );
        stream.pipe(uploadStream);
      });

      imageUrl = uploadResult.secure_url;
    }

    const admin = await getAdmin();

    const payload = {
      notification: { title, body: message, image: imageUrl },
      data: { click_action: click_action || "MAIN_ACTIVITY" },
      topic: "all_users",
    };

    const response = await admin.messaging().send(payload);

    return Response.json({
      success: true,
      message: "Notification sent successfully",
      messageId: response,
      imageUrl,
    }, { status: 200 });

  } catch (error) {
    console.error("Error sending FCM notification:", error);
    return Response.json({ success: false, message: "Failed to send notification" }, { status: 500 });
  }
}
