import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";
import redis from "@/lib/redis";
import "@/model/Category";

const RATE_LIMIT = 150;
const WINDOW_SECONDS = 60;

async function rateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, WINDOW_SECONDS);
  return current <= RATE_LIMIT;
}

export async function GET(req: Request) {
  await dbConnect();

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  const allowed = await rateLimit(ip);
  if (!allowed) {
    return Response.json(
      { success: false, message: "Too many requests, slow down." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 100;
  const skip = (page - 1) * limit;

  const cacheKey = `public:works:page:${page}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT",
        },
      });
    }

    const works = await Work.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .select("_id prompt imageUrl categoryId tags createdAt") // ✅ include tags
      .populate("categoryId", "name");

    const responseData = JSON.stringify({
      success: true,
      page,
      limit,
      count: works.length,
      works,
    });

    await redis.set(cacheKey, responseData, "EX", 30, "NX");

    return new Response(responseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Public works fetch error:", error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
