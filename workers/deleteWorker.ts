import "dotenv/config"; 
import mongoose from "mongoose";
import redis from "@/lib/redis";
import dbConnect from "@/lib/dbConnect";
import Work from "@/model/Work";
import Category from "@/model/Category";

async function processDeletes() {
  await dbConnect();

  while (true) {
    // Wait for either work or category deletion jobs
    const job = await redis.brpop(["work:delete:queue", "category:delete:queue"], 0);
    if (!job) continue;

    const queueName = job[0]; // either "work:delete:queue" or "category:delete:queue"
    const payload = JSON.parse(job[1]);

    try {
      if (queueName === "work:delete:queue") {
        const { workId, userId, role } = payload;
        if (role === "superadmin") {
          await Work.findByIdAndDelete(workId);
        } else if (role === "admin") {
          await Work.findOneAndDelete({ _id: workId, adminId: userId });
        }
        console.log(`✅ Deleted work ${workId} from MongoDB`);
      } else if (queueName === "category:delete:queue") {
        const { categoryId } = payload;
        await Category.findByIdAndDelete(categoryId);
        console.log(`✅ Deleted category ${categoryId} from MongoDB`);
      }
    } catch (err) {
      console.error(`❌ DB delete failed for ${queueName}:`, err);
      // Retry
      await redis.lpush(queueName, job[1]);
    }
  }
}

processDeletes();
