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

//   const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

//   const allowed = await rateLimit(ip);
//   if (!allowed) {
//     return Response.json(
//       { success: false, message: "Too many requests, slow down." },
//       { status: 429 }
//     );
//   }

//   const { searchParams } = new URL(req.url);
//   const page = parseInt(searchParams.get("page") || "1");
//   const limit = 100;
//   const skip = (page - 1) * limit;

//   const cacheKey = `public:works:page:${page}`;

//   try {
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

//     const works = await Work.find({})
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean()
//       .select("_id prompt imageUrl categoryId tags createdAt") // ✅ include tags
//       .populate("categoryId", "name");

//     const responseData = JSON.stringify({
//       success: true,
//       page,
//       limit,
//       count: works.length,
//       works,
//     });

//     await redis.set(cacheKey, responseData, "EX", 30, "NX");

//     return new Response(responseData, {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//         "X-Cache": "MISS",
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

// src/app/api/get-all-works/route.ts
import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";
import redis from "@/lib/redis";
import "@/model/Category";

const RATE_LIMIT = 200;
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
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  // ✅ OPTIMIZATION: Better cache key with performance version
  const cacheKey = `public:works:perf:v1:page:${page}:limit:${limit}`;

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

    // ✅ OPTIMIZATION: Add query timeout and performance monitoring
    const startTime = Date.now();
    
    const works = await Work.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .select("_id prompt imageUrl categoryId tags createdAt")
      .populate("categoryId", "name")
      .maxTimeMS(5000); // ✅ OPTIMIZATION: 5 second timeout

    const queryTime = Date.now() - startTime;
    console.log(`🚀 Query performance: ${queryTime}ms for page ${page}`);

    const responseData = JSON.stringify({
      success: true,
      page,
      limit,
      count: works.length,
      works,
      // ✅ OPTIMIZATION: Add performance info for debugging
      performance: {
        queryTime: `${queryTime}ms`,
        cached: false
      }
    });

    // ✅ OPTIMIZATION: Shorter cache for better data freshness
    await redis.set(cacheKey, responseData, "EX", 15, "NX"); // 15 seconds instead of 30

    return new Response(responseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json", 
        "X-Cache": "MISS",
        "X-Query-Time": `${queryTime}ms` // ✅ OPTIMIZATION: Response header for monitoring
      },
    });
  } catch (error) {
    console.error("Public works fetch error:", error);
    
    // ✅ OPTIMIZATION: Fallback to page 1 cache if current page fails
    try {
      if (page > 1) {
        const fallbackKey = `public:works:perf:v1:page:1:limit:${limit}`;
        const fallbackData = await redis.get(fallbackKey);
        if (fallbackData) {
          console.log("🔄 Using fallback cache for page:", page);
          return new Response(fallbackData, {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Cache": "FALLBACK",
            },
          });
        }
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
    }
    
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}