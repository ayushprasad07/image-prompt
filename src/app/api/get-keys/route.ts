import dbConnect from "@/lib/dbConnect";
import Keys from "@/model/Keys";
import redis from "@/lib/redis";

// GET route: fetch advertisement keys
// /api/get-keys

export async function GET(req: Request) {
  await dbConnect();

  try {
    // Check Redis cache first
    const cached = await redis.get("ad_keys");
    if (cached) {
      return Response.json({ success: true, data: JSON.parse(cached) });
    }

    // Fetch from DB
    const keys = await Keys.findOne({});
    if (!keys) {
      return Response.json({ success: false, message: "No advertisement keys found" }, { status: 404 });
    }

    // Cache the result in Redis for 60 seconds
    await redis.set("ad_keys", JSON.stringify(keys), "EX", 60);

    return Response.json({ success: true, data: keys });

  } catch (error) {
    console.error("Fetch keys error:", error);
    return Response.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}