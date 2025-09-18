import mongoose from "mongoose";
import redis from "@/lib/redis";
import Work from "@/model/Work";
import dbConnect from "@/lib/dbConnect";

async function processUpdates() {
  await dbConnect();

  while (true) {
    const job = await redis.brpop("work:update:queue", 0); // blocking pop
    if (!job) continue;

    const { workId, userId, role, updates } = JSON.parse(job[1]);

    try {
      if (role === "superadmin") {
        await Work.findByIdAndUpdate(
          new mongoose.Types.ObjectId(workId),
          { $set: updates },
          { new: true }
        );
      } else if (role === "admin") {
        await Work.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(workId), adminId: userId },
          { $set: updates },
          { new: true }
        );
      }

      console.log(`✅ Updated work ${workId} in MongoDB`);
    } catch (err) {
      console.error("❌ DB update failed:", err);
      await redis.lpush("work:update:queue", job[1]); // retry
    }
  }
}

processUpdates();
