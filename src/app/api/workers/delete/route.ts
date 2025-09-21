import "dotenv/config"; 
import mongoose from "mongoose";
import redis from "@/lib/redis";
import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";

async function processDeletes() {
  await dbConnect();

  while (true) {
    const job = await redis.brpop("work:delete:queue", 0);
    if (!job) continue;

    const { workId, userId, role } = JSON.parse(job[1]);

    try {
      if (role === "superadmin") {
        await Work.findByIdAndDelete(workId); // mongoose casts string automatically
      } else if (role === "admin") {
        await Work.findOneAndDelete({ _id: workId, adminId: userId });
      }

      console.log(`✅ Deleted work ${workId} from MongoDB`);
    } catch (err) {
      console.error("❌ DB delete failed:", err);
      await redis.lpush("work:delete:queue", job[1]); // retry
    }
  }
}

processDeletes();
