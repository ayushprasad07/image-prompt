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

// // src/app/api/get-all-works/route.ts
// import dbConnect from "@/lib/dbConnect";
// import Work from "@/model/Work";
// import redis from "@/lib/redis";
// import "@/model/Category";

// const CACHE_KEY = "public:works:all:v2";
// const CACHE_TTL = 60; // 1 minute cache
// const RATE_LIMIT = 200;
// const WINDOW_SECONDS = 60;

// /**
//  * Simple rate limiter using Redis
//  */
// async function rateLimit(ip: string): Promise<boolean> {
//   const key = `ratelimit:${ip}`;
//   const current = await redis.incr(key);
//   if (current === 1) await redis.expire(key, WINDOW_SECONDS);
//   return current <= RATE_LIMIT;
// }

// /**
//  * Rebuild cache in background (non-blocking)
//  */
// async function refreshCache() {
//   try {
//     await dbConnect();
//     const works = await Work.find({})
//       .sort({ createdAt: -1 })
//       .lean()
//       .select("_id prompt imageUrl categoryId tags createdAt")
//       .populate("categoryId", "name")
//       .maxTimeMS(10000); // prevent DB overload

//     const data = JSON.stringify({
//       success: true,
//       count: works.length,
//       works,
//       performance: { cached: true },
//     });

//     await redis.set(CACHE_KEY, data, "EX", CACHE_TTL);
//     console.log("♻️ Works cache refreshed successfully.");
//   } catch (err) {
//     console.error("❌ Cache refresh failed:", err);
//   }
// }

// export async function GET(req: Request) {
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

//   // ✅ Try to get data instantly from Redis cache
//   const cached = await redis.get(CACHE_KEY);
//   if (cached) {
//     // Refresh cache in background (non-blocking)
//     refreshCache(); 
//     return new Response(cached, {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//         "X-Cache": "HIT",
//       },
//     });
//   }

//   // 🧠 If cache miss (first run), fetch from DB and store it
//   await dbConnect();
//   const startTime = Date.now();

//   const works = await Work.find({})
//     .sort({ createdAt: -1 })
//     .lean()
//     .select("_id prompt imageUrl categoryId tags createdAt")
//     .populate("categoryId", "name")
//     .maxTimeMS(10000);

//   const queryTime = Date.now() - startTime;
//   console.log(`🚀 Cache miss — fetched all works in ${queryTime}ms`);

//   const data = JSON.stringify({
//     success: true,
//     count: works.length,
//     works,
//     performance: { cached: false, queryTime: `${queryTime}ms` },
//   });

//   await redis.set(CACHE_KEY, data, "EX", CACHE_TTL);

//   return new Response(data, {
//     status: 200,
//     headers: {
//       "Content-Type": "application/json",
//       "X-Cache": "MISS",
//     },
//   });
// }

// // src/app/api/get-all-works/route.ts
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
  
//   // ✅ COMPATIBLE: Always return 100 items to match Android's expectation
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

//     const startTime = Date.now();
    
//     const works = await Work.find({})
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean()
//       .select("_id prompt imageUrl categoryId tags createdAt")
//       .populate("categoryId", "name")
//       .maxTimeMS(10000); // 10 second timeout for reliability

//     const queryTime = Date.now() - startTime;

//     // ✅ COMPATIBLE: Return the exact structure Android expects
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
    
//     // ✅ RELIABLE: Graceful fallback - return empty array instead of crashing
//     const fallbackData = JSON.stringify({
//       success: true,
//       page: 1,
//       limit: 100,
//       count: 0,
//       works: [],
//     });

//     return new Response(fallbackData, {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//         "X-Cache": "ERROR_FALLBACK",
//       },
//     });
//   }
// }