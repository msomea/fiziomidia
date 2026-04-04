import cron from "node-cron";
import ClinicPromotion from "../models/ClinicPromotion.js";

export const expireClinicPromotionsJob = () => {
  // Runs every day at 00:10 AM (5 minutes after sponsored products)
  cron.schedule("10 0 * * *", async () => {
    try {
      const now = new Date();

      const result = await ClinicPromotion.updateMany(
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
          `⏱ Clinic promotions expired: ${result.modifiedCount}`
        );
      }
    } catch (err) {
      console.error("❌ Error expiring clinic promotions:", err);
    }
  });
};
