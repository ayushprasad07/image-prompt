// workers/updateWorker.ts

import "dotenv/config";
import mongoose from "mongoose";
import redis from "@/lib/redis";
import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";

const SOURCE_QUEUE = "work:update:queue";
const PROCESSING_QUEUE = "work:update:processing";
const DEAD_LETTER_QUEUE = "work:update:dead";

async function processUpdates() {
  try {
    await dbConnect();
    console.log("🚀 Update Worker started and waiting for jobs...");

    // Handle Mongo reconnects
    mongoose.connection.on("disconnected", async () => {
      console.log("⚠️ MongoDB disconnected, reconnecting...");
      await dbConnect();
    });

    while (true) {
      let job: string | null = null;

      try {
        // Move job safely to processing queue
        job = await redis.brpoplpush(SOURCE_QUEUE, PROCESSING_QUEUE, 0);
        if (!job) continue;

        const { workId, userId, role, updates } = JSON.parse(job);
        console.log("📦 Job received:", { workId, userId, role, updates });

        let result;
        if (role === "superadmin") {
          result = await Work.findByIdAndUpdate(
            new mongoose.Types.ObjectId(workId),
            { $set: updates },
            { new: true, runValidators: true }
          );
        } else if (role === "admin") {
          result = await Work.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(workId), adminId: userId },
            { $set: updates },
            { new: true, runValidators: true }
          );
        }

        if (result) {
          console.log(`✅ Updated work ${workId} in MongoDB`);
          // Remove from processing queue
          await redis.lrem(PROCESSING_QUEUE, 1, job);
        } else {
          console.log(`❌ Work ${workId} not found or unauthorized`);
          // Move job to dead-letter queue
          await redis.lrem(PROCESSING_QUEUE, 1, job);
          await redis.lpush(DEAD_LETTER_QUEUE, job);
        }
      } catch (err) {
        console.error("❌ DB update failed:", err);

        if (job) {
          // Move back to source queue for retry
          await redis.lrem(PROCESSING_QUEUE, 1, job);
          await redis.lpush(SOURCE_QUEUE, job);
          console.log("↩️ Job returned to queue for retry");
        }

        // Small delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error("❌ Failed to start update worker:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down update worker...");
  await mongoose.connection.close();
  await redis.quit();
  process.exit(0);
});

processUpdates();
