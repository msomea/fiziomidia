import cron from "node-cron";
import SponsoredProduct from "../models/SponsoredProduct.js";

export const expireSponsoredProductsJob = () => {
  // Runs every day at 00:05 AM
  cron.schedule("5 0 * * *", async () => {
    try {
      const now = new Date();

      const result = await SponsoredProduct.updateMany(
        {
          isActive: true,
          endDate: { $lt: now },
        },
        {
          $set: { isActive: false },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `⏱ Sponsored products expired: ${result.modifiedCount}`
        );
      }
    } catch (err) {
      console.error("❌ Error expiring sponsored products:", err);
    }
  });
};
