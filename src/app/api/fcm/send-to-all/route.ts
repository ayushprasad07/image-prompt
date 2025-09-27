// /app/api/fcm/send-to-all/route.ts
import { getServerSession, User } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import admin from "firebase-admin";

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(req: Request) {
  // ✅ Superadmin check
  const session = await getServerSession(authOptions);
  const superAdmin: User = session?.user as User;

  if (!superAdmin || superAdmin.role !== "superadmin") {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { title, message, click_action } = body;

    if (!title || !message) {
      return Response.json(
        { success: false, message: "Title and message are required" },
        { status: 400 }
      );
    }

    // Prepare the FCM payload
    const payload = {
      notification: {
        title,
        body: message,
      },
      data: {
        click_action: click_action || "MAIN_ACTIVITY",
      },
      topic: "all_users", // 🔥 broadcast to all devices subscribed to this topic
    };

    const response = await admin.messaging().send(payload);

    return Response.json(
      { success: true, message: "Notification sent successfully", messageId: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending FCM notification:", error);
    return Response.json(
      { success: false, message: "Failed to send notification" },
      { status: 500 }
    );
  }
}
