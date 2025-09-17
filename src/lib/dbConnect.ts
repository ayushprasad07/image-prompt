import mongoose from "mongoose";

type ConnectionObject = {
    isConnected ?: number
}

const connection : ConnectionObject = {};

async function dbConnect() : Promise<void>{
    if(connection.isConnected){
        console.log("Already Connected to the database");
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGO_URI!,{});

        connection.isConnected = db.connections[0].readyState;

        console.log("Connected to the database");
    } catch (error) {
        console.log("Database connection error",error);
        process.exit(1);
    }
}

export default dbConnect;