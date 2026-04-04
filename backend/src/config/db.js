import mongoose from "mongoose";
import config from "./index.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      dbName: "fiziomidia",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("🗃️  MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit process with failure
  }

  // Optional: listen for disconnects
  mongoose.connection.on("disconnected", () => {
    console.warn("⛔ MongoDB disconnected!");
  });
};
