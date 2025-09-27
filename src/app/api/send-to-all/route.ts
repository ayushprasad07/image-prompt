export const dynamic = "force-dynamic";

import { getServerSession, User } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

let admin: any = null;

// ✅ Lazy initialize firebase-admin at runtime only
async function getAdmin() {
  if (!admin) {
    const firebaseAdmin = await import("firebase-admin");

    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    admin = firebaseAdmin;
  }
  return admin;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const superAdmin: User = session?.user as User;

    // ✅ Role check
    if (!superAdmin || superAdmin.role !== "superadmin") {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, message, click_action } = body;

    if (!title || !message) {
      return Response.json(
        { success: false, message: "Title and message are required" },
        { status: 400 }
      );
    }

    const admin = await getAdmin();

    const payload = {
      notification: {
        title,
        body: message,
      },
      data: {
        click_action: click_action || "MAIN_ACTIVITY",
      },
      topic: "all_users",
    };

    const response = await admin.messaging().send(payload);

    return Response.json(
      {
        success: true,
        message: "Notification sent successfully",
        messageId: response,
      },
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
