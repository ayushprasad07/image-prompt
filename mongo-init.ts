import { MongoClient } from "mongodb";

async function initDatabase() {
  // Connect to MongoDB using root credentials
  const uri = `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@localhost:27017/?authSource=admin`;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("🔗 Connected to MongoDB");

    // Select your database
    const db = client.db(process.env.MONGO_DATABASE || "image-prompt");

    // Create application user
    await db.command({
      createUser: "app_user",
      pwd: "app_password",
      roles: [{ role: "readWrite", db: process.env.MONGO_DATABASE || "image-prompt" }],
    });
    console.log("✅ App user created");

    // Create collections if they don't exist
    const collections = ["admins", "works", "categories", "keys"];
    for (const col of collections) {
      const exists = await db.listCollections({ name: col }).hasNext();
      if (!exists) {
        await db.createCollection(col);
        console.log(`✅ Collection created: ${col}`);
      } else {
        console.log(`ℹ️ Collection already exists: ${col}`);
      }
    }

    console.log("✅ MongoDB initialized successfully");
  } catch (error) {
    console.error("❌ MongoDB initialization failed:", error);
  } finally {
    await client.close();
  }
}

// Run the initialization
initDatabase();
