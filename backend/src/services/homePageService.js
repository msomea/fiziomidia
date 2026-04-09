import { CacheService, CacheKeys, CacheTTL } from "../utils/redis.js";
import redisClient from "../utils/redis.js";
import PTPromotion from "../models/PTPromotion.js";
import ClinicPromotion from "../models/ClinicPromotion.js";
import SponsoredProduct from "../models/SponsoredProduct.js";

/**
 * Get PT promotions for home page (without caching - for controller-level caching)
 */
export const fetchPromotionsWithoutCache = async () => {
  try {
    // Fetch from database directly
    const promotions = await PTPromotion.find({ status: "active" })
      .populate("pt", "fullName profileImageUrl ptProfile")
      .sort({ createdAt: -1 });
    
    return promotions;
  } catch (error) {
    console.error("Error fetching PT promotions:", error);
    return [];
  }
};

/**
 * Get clinic promotions for home page (without caching - for controller-level caching)
 */
export const fetchClinicPromotionsWithoutCache = async () => {
  try {
    // Fetch from database directly
    const promotions = await ClinicPromotion.find({ status: "active" })
      .populate("clinic", "name location contactPhone")
      .sort({ createdAt: -1 });
    
    return promotions;
  } catch (error) {
    console.error("Error fetching clinic promotions:", error);
    return [];
  }
};

/**
 * Get sponsored products for home page (without caching - for controller-level caching)
 */
export const fetchSponsoredProductsWithoutCache = async () => {
  try {
    // Fetch from database directly
    const products = await SponsoredProduct.find({ isActive: true })
      .select("name description price image link")
      .sort({ createdAt: -1 });
    
    return products;
  } catch (error) {
    console.error("Error fetching sponsored products:", error);
    return [];
  }
};
export const fetchPromotions = async () => {
  try {
    // Check cache first
    const cacheKey = CacheKeys.PT_PROMOTIONS;
    const cachedData = await CacheService.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    // Fetch from database if not cached
    const promotions = await PTPromotion.find({ active: true })
      .populate("pt", "fullName profileImageUrl ptProfile")
      .sort({ createdAt: -1 });

    // Cache the result
    await redisClient.setEx(cacheKey, 15 * 60, JSON.stringify(promotions));
    
    return promotions;
  } catch (error) {
    console.error("Error fetching PT promotions:", error);
    return [];
  }
};

/**
 * Get clinic promotions for home page
 */
export const fetchClinicPromotions = async () => {
  try {
    // Check cache first
    const cacheKey = CacheKeys.CLINIC_PROMOTIONS;
    const cachedData = await CacheService.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    // Fetch from database if not cached
    const promotions = await ClinicPromotion.find({ active: true })
      .populate("clinic", "name location contactPhone")
      .sort({ createdAt: -1 });

    // Cache the result
    await redisClient.setEx(cacheKey, 15 * 60, JSON.stringify(promotions));
    
    return promotions;
  } catch (error) {
    console.error("Error fetching clinic promotions:", error);
    return [];
  }
};

/**
 * Get sponsored products for home page
 */
export const fetchSponsoredProducts = async () => {
  try {
    // Check cache first
    const cacheKey = CacheKeys.SPONSORED_PRODUCTS;
    const cachedData = await CacheService.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    // Fetch from database if not cached
    const products = await SponsoredProduct.find({ active: true })
      .populate("product", "name price description images")
      .sort({ createdAt: -1 });

    // Cache the result
    await redisClient.setEx(cacheKey, 20 * 60, JSON.stringify(products));
    
    return products;
  } catch (error) {
    console.error("Error fetching sponsored products:", error);
    return [];
  }
};
