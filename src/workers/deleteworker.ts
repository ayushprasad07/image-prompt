import mongoose from "mongoose";
import redis from "@/lib/redis";
import Work from "@/model/Work";
import dbConnect from "@/lib/dbConnect";

async function processDeletes() {
  await dbConnect();

  while (true) {
    // Wait until there’s a delete job in Redis
    const job = await redis.brpop("work:delete:queue", 0); 
    if (!job) continue;

    const { workId, userId, role } = JSON.parse(job[1]);

    try {
      if (role === "superadmin") {
        await Work.findByIdAndDelete(new mongoose.Types.ObjectId(workId));
      } else if (role === "admin") {
        await Work.findOneAndDelete({
          _id: new mongoose.Types.ObjectId(workId),
          adminId: userId,
        });
      }

      console.log(`✅ Deleted work ${workId} from MongoDB`);
    } catch (err) {
      console.error("❌ DB delete failed:", err);
      // Optional: retry logic → push job back into queue
      await redis.lpush("work:delete:queue", job[1]);
    }
  }
}

processDeletes();
