import SponsoredProduct from "../../models/SponsoredProduct.js";
import { CacheService } from "../../utils/redis.js";
import escapeRegExp from "../../utils/escapeRegExp.js";
import {
  logAdminActivity,
  getProductTargetInfo,
} from "../../middlewares/adminActivityLogger.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../services/uploadService.js";

// -----------------------------------------
// PROMOTED PRODUCTS
// -----------------------------------------

// Create a new Sponsored Product
export const createSponsoredProduct = [
  logAdminActivity("PRODUCT_CREATED", getProductTargetInfo),
  async (req, res) => {
    try {
      // Convert isActive / isSponsored safely
      const isActive =
        req.body.isActive === "true" || req.body.isActive === true;

      const productData = {
        name: req.body.name,
        description: req.body.description || "",
        price: req.body.price,
        sponsorName: req.body.sponsorName || "",
        sponsorWebsite: req.body.sponsorWebsite || "",
        sponsorMessage: req.body.sponsorMessage || "",
        isActive,
      };

      // Handle image / logo upload
      if (req.file) {
        try {
          const uploadResult = await uploadToCloudinary(req.file);
          productData.image = uploadResult.secure_url;
          productData.imagePublicId = uploadResult.public_id;
        } catch (uploadError) {
          console.error("Error uploading product image:", uploadError);
          return res.status(500).json({
            success: false,
            error: "Failed to upload product image",
          });
        }
      }

      // Optional dates
      if (req.body.startDate) {
        productData.startDate = new Date(req.body.startDate);
      }

      if (req.body.endDate) {
        productData.endDate = new Date(req.body.endDate);
      }

      const product = new SponsoredProduct(productData);
      await product.save();

      // Invalidate admin dashboard cache due to sponsored product creation
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to sponsored product creation`,
      );

      return res.status(201).json({
        success: true,
        message: "Sponsored product created successfully",
        product,
      });
    } catch (err) {
      console.error("❌ Create sponsored product error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to create sponsored product",
      });
    }
  },
];

// List all Sponsored Products with pagination
export const getAllSponsoredProducts = async (req, res) => {
  try {
    const { search = "", status = "", page = 1 } = req.query;

    const filter = {};

    // Search by product name
    if (search) {
      const esc = escapeRegExp(search);
      filter.name = { $regex: esc, $options: "i" };
    }

    // Filter by active / inactive
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status === "approved") {
      filter.status = "approved"
    } else if (status === "pending") {
      filter.status = "pending"
    } else if (status === "rejected") {
      filter.status = "rejected"
    }

    const limit = 10;
    const skip = (page - 1) * limit;

    const products = await SponsoredProduct.find(filter)
      .populate("owner", "fullName")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await SponsoredProduct.countDocuments(filter);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch sponsored products" });
  }
};

// Get single product
export const getSponsoredProductById = async (req, res) => {
  try {
    const product = await SponsoredProduct.findById(req.params.id)
    .populate("owner", "fullName");
    if (!product) return res.status(404).json({ error: "Not found" });

    res.json(product);
  } catch (err) {
    console.error("Fetch one error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

// Update Sponsored Product (ADMIN)
export const updateSponsoredProduct = [
  logAdminActivity("PRODUCT_UPDATED", getProductTargetInfo),
  async (req, res) => {
    const { id } = req.params;

    try {
      const product = await SponsoredProduct.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Sponsored product not found",
        });
      }

      /* =========================
       BASIC FIELDS
    ========================== */
      if (req.body.name !== undefined) product.name = req.body.name;
      if (req.body.category !== undefined) product.category = req.body.category;
      if (req.body.description !== undefined)
        product.description = req.body.description;

      if (req.body.price !== undefined) {
        const price = Number(req.body.price);
        if (Number.isNaN(price)) {
          return res.status(400).json({
            success: false,
            error: "Invalid price value",
          });
        }
        product.price = price;
      }

      if (req.body.duration !== undefined) {
        const duration = Number(req.body.duration);
        if (Number.isNaN(duration)) {
          return res.status(400).json({
            success: false,
            error: "Invalid duration value",
          });
        }
        product.duration = duration;
      }

      if (req.body.link !== undefined) product.link = req.body.link;

      /* =========================
       STATUS CHANGE (ADMIN ONLY)
       pending | approved | rejected
       Dates & activation handled by schema hook
    ========================== */
      if (req.body.status !== undefined) {
        const validStatus = ["pending", "approved", "rejected"];
        if (!validStatus.includes(req.body.status)) {
          return res.status(400).json({
            success: false,
            error: "Invalid status value",
          });
        }

        product.status = req.body.status;
      }

      /* =========================
       MANUAL ACTIVE TOGGLE
       (Only allowed if approved)
    ========================== */
      if (req.body.isActive !== undefined) {
        const isActive =
          req.body.isActive === true || req.body.isActive === "true";

        if (isActive && product.status !== "approved") {
          return res.status(400).json({
            success: false,
            error: "Only approved products can be activated",
          });
        }

        product.isActive = isActive;
      }

      /* =========================
       IMAGE HANDLING
    ========================== */
      if (req.file) {
        try {
          // Delete old image if exists
          if (product.imagePublicId) {
            await deleteFromCloudinary(product.imagePublicId);
          }

          // Upload new image
          const uploadResult = await uploadToCloudinary(req.file);
          product.image = uploadResult.secure_url;
          product.imagePublicId = uploadResult.public_id;
        } catch (uploadError) {
          console.error("Error updating product image:", uploadError);
          return res.status(500).json({
            success: false,
            error: "Failed to update product image",
          });
        }
      } else if (req.body.image !== undefined) {
        product.image = req.body.image;
      }

      await product.save(); // triggers schema hooks

      // Invalidate admin dashboard cache due to sponsored product update
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to sponsored product update`,
      );

      return res.json({
        success: true,
        message: "Sponsored product updated successfully",
        product,
      });
    } catch (err) {
      console.error("❌ Error updating sponsored product:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to update sponsored product",
      });
    }
  },
];

// Delete Sponsored Product (ADMIN)
export const deleteSponsoredProduct = [
  logAdminActivity("PRODUCT_DELETED", getProductTargetInfo),
  async (req, res) => {
    try {
      const product = await SponsoredProduct.findByIdAndDelete(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Sponsored product not found",
        });
      }

      return res.json({
        success: true,
        message: "Sponsored product deleted successfully",
      });
    } catch (err) {
      console.error("❌ Delete sponsored product error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to delete sponsored product",
      });
    }
  },
];
