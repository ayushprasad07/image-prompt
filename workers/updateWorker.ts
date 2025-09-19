// // workers/updateWorker.ts
// import "dotenv/config"; 
// // dotenv.config({ path: ".env.local" }); // ensure env variables are loaded

// import mongoose from "mongoose";
// import redis from "@/lib/redis";
// import dbConnect from "@/lib/dbConnect";
// import Work from "@/model/Work";

// async function processUpdates() {
//   await dbConnect();

//   console.log("🚀 Update Worker started and waiting for jobs...");

//   while (true) {
//     try {
//       // Wait until there’s an update job in Redis
//       const job = await redis.brpop("work:update:queue", 0);
//       if (!job) continue;

//       const { workId, userId, role, updates } = JSON.parse(job[1]);

//       if (role === "superadmin") {
//         await Work.findByIdAndUpdate(
//           new mongoose.Types.ObjectId(workId),
//           { $set: updates },
//           { new: true }
//         );
//       } else if (role === "admin") {
//         await Work.findOneAndUpdate(
//           { _id: new mongoose.Types.ObjectId(workId), adminId: userId },
//           { $set: updates },
//           { new: true }
//         );
//       }

//       console.log(`✅ Updated work ${workId} in MongoDB`);
//     } catch (err) {
//       console.error("❌ DB update failed:", err);

//       // retry logic → push job back into queue
//       if (err instanceof Error) {
//         console.error("Reason:", err.message);
//       }
//       // Push job back into queue safely
//       // (only if job was pulled)
//       // Avoid infinite crash loop if parsing fails
//       try {
//         const job = await redis.brpop("work:update:queue", 0);
//         if (job) {
//           await redis.lpush("work:update:queue", job[1]);
//         }
//       } catch (retryErr) {
//         console.error("⚠️ Failed to requeue job:", retryErr);
//       }
//     }
//   }
// }

// processUpdates();


import "dotenv/config";
import mongoose from "mongoose";
import redis from "@/lib/redis";
import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";

async function processUpdates() {
  try {
    await dbConnect();
    console.log("🚀 Update Worker started and waiting for jobs...");

    while (true) {
      let job;
      try {
        // Wait until there's an update job in Redis
        job = await redis.brpop("work:update:queue", 0);
        if (!job) continue;

        const { workId, userId, role, updates } = JSON.parse(job[1]);
        console.log(`🔄 Processing update for work: ${workId}`);

        let result;
        if (role === "superadmin") {
          result = await Work.findByIdAndUpdate(
            new mongoose.Types.ObjectId(workId),
            { $set: updates },
            { new: true, runValidators: true }
          );
        } else if (role === "admin") {
          result = await Work.findOneAndUpdate(
            { 
              _id: new mongoose.Types.ObjectId(workId), 
              adminId: userId 
            },
            { $set: updates },
            { new: true, runValidators: true }
          );
        }

        if (result) {
          console.log(`✅ Updated work ${workId} in MongoDB`);
        } else {
          console.log(`❌ Work ${workId} not found or not authorized`);
          // Push job back to queue for retry
          await redis.lpush("work:update:queue", job[1]);
        }
      } catch (err) {
        console.error("❌ DB update failed:", err);
        
        // Push the CURRENT job back to queue for retry
        if (job) {
          await redis.lpush("work:update:queue", job[1]);
          console.log("↩️ Job pushed back to queue for retry");
        }
        
        // Add a small delay before retrying to prevent tight loop
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error("❌ Failed to start update worker:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down update worker...");
  await mongoose.connection.close();
  await redis.quit();
  process.exit(0);
});

processUpdates();