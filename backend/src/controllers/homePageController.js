import asyncHandler from "express-async-handler";
import { 
  fetchPromotionsWithoutCache,
  fetchClinicPromotionsWithoutCache,
  fetchSponsoredProductsWithoutCache
} from "../services/homePageService.js";
import { CacheService, CacheKeys, CacheTTL } from "../utils/redis.js";

// ============================================
// CONSOLIDATED HOME PAGE API
// ============================================
export const getHomePageData = async (req, res) => {
  try {
    // Generate cache key for home page
    const cacheKey = CacheKeys.PT_PROMOTIONS() + ":home-page-data";

    // Try to get from cache first
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      console.log(`🎯 Home page cache hit`);
      return res.json(cachedData);
    }

    console.log(`💨 Home page cache miss`);

    // Build all queries in parallel for better performance
    const [
      ptPromotions,
      clinicPromotions,
      sponsoredProducts
    ] = await Promise.all([
      // PT Promotions (without individual caching)
      fetchPromotionsWithoutCache(),

      // Clinic Promotions (without individual caching)
      fetchClinicPromotionsWithoutCache(),

      // Sponsored Products (without individual caching)
      fetchSponsoredProductsWithoutCache()
    ]);

    const responseData = {
      success: true,
      ptPromotions,
      clinicPromotions,
      sponsoredProducts,
      lastFetched: new Date(),
    };

    // Cache the response for 15 minutes
    await CacheService.set(cacheKey, responseData, CacheTTL.MEDIUM);
    console.log(`💾 Home page data cached`);

    return res.json(responseData);

  } catch (err) {
    console.error("Home Page data fetch error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch home page data" 
    });
  }
};

// Clear home page cache endpoint
export const clearHomePageCache = async (req, res) => {
  try {
    const cacheKey = CacheKeys.PT_PROMOTIONS() + ":home-page-data";
    await CacheService.del(cacheKey);
    console.log(`🗑️ Home page cache cleared`);
    
    return res.json({ 
      success: true, 
      message: "Home page cache cleared successfully" 
    });
  } catch (err) {
    console.error("Error clearing home page cache:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to clear home page cache" 
    });
  }
};
