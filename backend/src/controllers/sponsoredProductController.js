import SponsoredProduct from "../models/SponsoredProduct.js";


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
    let imageUrl = req.body.imageUrl; // default image path
    // If user uploaded a file
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const productData = {
      owner: req.user._id, // logged-in user creating product
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      duration: req.body.duration,
      link: req.body.link || "",
      image: imageUrl,
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
    let updateData = { ...req.body };

    if (req.file) {
      // store local uploads path (cloud upload helper not present here)
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    const updated = await SponsoredProduct.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ message: "Sponsored product updated", product: updated });
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

    await SponsoredProduct.findByIdAndDelete(req.params.id);
    res.json({ message: "Sponsored product deleted" });
  } catch (err) {
    console.error("Delete Sponsored Product Error:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};
