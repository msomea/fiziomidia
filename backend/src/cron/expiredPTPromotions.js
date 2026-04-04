import cron from "node-cron";
import PTPromotion from "../models/PTPromotion.js";

export const expirePTPromotionsJob = () => {
  // Runs every day at 00:15 AM (5 minutes after clinic promotions)
  cron.schedule("15 0 * * *", async () => {
    try {
      const now = new Date();

      const result = await PTPromotion.updateMany(
        {
          status: { $in: ["active", "pending"] },
          endAt: { $lt: now },
        },
        {
          $set: { status: "expired" },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `⏱ PT promotions expired: ${result.modifiedCount}`
        );
      }
    } catch (err) {
      console.error("❌ Error expiring PT promotions:", err);
    }
  });
};
