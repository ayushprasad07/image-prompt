import dbConnect from "@/lib/dbConnect";
import Privacy from "@/model/Privacy";
import redis from "@/lib/redis";

// GET /api/get-privacy-policy
export async function GET() {
  await dbConnect();

  try {
    // ✅ Try to get from Redis cache first
    const cached = await redis.get("privacy_policy");
    if (cached) {
      return Response.json({
        success: true,
        message: "Privacy Policy fetched from cache",
        data: JSON.parse(cached),
      });
    }

    // 🧠 If not cached, get from MongoDB
    const privacy = await Privacy.findOne();

    if (!privacy) {
      return Response.json({
        success: false,
        message: "Privacy Policy not found",
      }, { status: 404 });
    }

    // ✅ Cache it in Redis for faster next fetch
    await redis.set("privacy_policy", JSON.stringify(privacy));

    return Response.json({
      success: true,
      message: "Privacy Policy fetched successfully",
      data: privacy,
    });
  } catch (error) {
    console.error("Get privacy policy error:", error);
    return Response.json({
      success: false,
      message: "Something went wrong",
    }, { status: 500 });
  }
}
