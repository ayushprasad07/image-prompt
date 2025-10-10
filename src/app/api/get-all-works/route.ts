import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";
import redis from "@/lib/redis";
import "@/model/Category";

const RATE_LIMIT = 250;
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

// src/app/api/get-all-works/route.ts
// import dbConnect from "@/lib/dbConnect";
// import Work from "@/model/Work";
// import redis from "@/lib/redis";
// import "@/model/Category";

// const RATE_LIMIT = 250;
// const WINDOW_SECONDS = 60;

// async function rateLimit(ip: string): Promise<boolean> {
//   const key = `ratelimit:${ip}`;
//   const current = await redis.incr(key);
//   if (current === 1) await redis.expire(key, WINDOW_SECONDS);
//   return current <= RATE_LIMIT;
// }

// export async function GET(req: Request) {
//   await dbConnect();

//   const ip =
//     req.headers.get("x-forwarded-for") ||
//     req.headers.get("x-real-ip") ||
//     "unknown";

//   const allowed = await rateLimit(ip);
//   if (!allowed) {
//     return Response.json(
//       { success: false, message: "Too many requests, slow down." },
//       { status: 429 }
//     );
//   }

//   const cacheKey = `public:works:all:v1`;

//   try {
//     // ✅ Check Redis Cache first
//     const cached = await redis.get(cacheKey);
//     if (cached) {
//       return new Response(cached, {
//         status: 200,
//         headers: {
//           "Content-Type": "application/json",
//           "X-Cache": "HIT",
//         },
//       });
//     }

//     // ✅ Query all works without pagination
//     const startTime = Date.now();
//     const works = await Work.find({})
//       .sort({ createdAt: -1 })
//       .lean()
//       .select("_id prompt imageUrl categoryId tags createdAt")
//       .populate("categoryId", "name")
//       .maxTimeMS(10000); // 10 seconds timeout for large collections

//     const queryTime = Date.now() - startTime;
//     console.log(`🚀 Query performance: ${queryTime}ms for all works`);

//     const responseData = JSON.stringify({
//       success: true,
//       count: works.length,
//       works,
//       performance: {
//         queryTime: `${queryTime}ms`,
//         cached: false,
//       },
//     });

//     // ✅ Cache for 30 seconds (adjust as needed)
//     await redis.set(cacheKey, responseData, "EX", 30, "NX");

//     return new Response(responseData, {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//         "X-Cache": "MISS",
//         "X-Query-Time": `${queryTime}ms`,
//       },
//     });
//   } catch (error) {
//     console.error("Public works fetch error:", error);
//     return Response.json(
//       { success: false, message: "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }
