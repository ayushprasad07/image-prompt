// /app/api/fcm/register/route.ts
import dbConnect from "@/lib/dbConnect";
import Token from "@/model/Token";// create a Token model similar to Category

export async function POST(req: Request) {
  await dbConnect();

  try {
    const body = await req.json();
    const { token, device_id, app_version, os_version } = body;

    if (!token || !device_id) {
      return Response.json(
        { success: false, message: "Token and device_id are required" },
        { status: 400 }
      );
    }

    // Save or update token
    const savedToken = await Token.findOneAndUpdate(
      { device_id },
      { token, app_version, os_version },
      { upsert: true, new: true }
    );

    return Response.json(
      { success: true, message: "Token registered successfully", data: savedToken },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error registering token:", error);
    return Response.json(
      { success: false, message: "Failed to register token" },
      { status: 500 }
    );
  }
}
