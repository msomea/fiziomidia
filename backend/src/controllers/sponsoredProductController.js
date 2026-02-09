import SponsoredProduct from "../models/SponsoredProduct.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/uploadService.js";

// GET all sponsored products (public)
export const getSponsoredProducts = async (req, res) => {
  try {
    const products = await SponsoredProduct.find({
      isActive: true,
      status: "approved",
    }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    console.error("Failed to load sponsored products:", err);
    res.status(500).json({ message: "Server error loading products" });
  }
};

// CREATE product
export const createSponsoredProduct = async (req, res) => {
  try {
    let imageUrl = "";
    let imagePublicId = "";

    // If user uploaded an image
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const productData = {
      owner: req.user._id,
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      duration: req.body.duration,
      link: req.body.link || "",
      image: imageUrl,
      imagePublicId,
    };

    const product = await SponsoredProduct.create(productData);

    res.status(201).json({
      success: true,
      message: "Sponsored product created successfully",
      product,
    });
  } catch (err) {
    console.error("Create Sponsored Product Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create sponsored product",
    });
  }
};

// Admin — UPDATE product
export const updateSponsoredProduct = async (req, res) => {
  try {
    const product = await SponsoredProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });

    let updateData = { ...req.body };

    // If new image uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (product.imagePublicId) {
        await deleteFromCloudinary(product.imagePublicId);
      }

      // Upload new image
      const result = await uploadToCloudinary(req.file);
      updateData.image = result.secure_url;
      updateData.imagePublicId = result.public_id;
    }

    const updated = await SponsoredProduct.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: "Sponsored product updated",
      product: updated,
    });
  } catch (err) {
    console.error("Update Sponsored Product Error:", err);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// Admin — DELETE product
export const deleteSponsoredProduct = async (req, res) => {
  try {
    const product = await SponsoredProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });

    // only owner or admin can delete
    if (
      product.owner &&
      product.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete image from Cloudinary
    if (product.imagePublicId) {
      await deleteFromCloudinary(product.imagePublicId);
    }

    await SponsoredProduct.findByIdAndDelete(req.params.id);

    res.json({ message: "Sponsored product deleted" });
  } catch (err) {
    console.error("Delete Sponsored Product Error:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

