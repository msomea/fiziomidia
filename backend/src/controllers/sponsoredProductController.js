import SponsoredProduct from "../models/SponsoredProduct.js";


// GET all sponsored products (public)
export const getSponsoredProducts = async (req, res) => {
  try {
    const products = await SponsoredProduct.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    console.error("Failed to load sponsored products:", err);
    res.status(500).json({ message: "Server error loading products" });
  }
};

// Admin — CREATE product
export const createSponsoredProduct = async (req, res) => {
  try {
    let imageUrl = req.body.image;

    // optional: if image file uploaded
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.path, "sponsored-products");
    }

    const product = await SponsoredProduct.create({
      name: req.body.name,
      price: req.body.price,
      image: imageUrl,
      link: req.body.link
    });

    res.status(201).json({ message: "Sponsored product created", product });
  } catch (err) {
    console.error("Create Sponsored Product Error:", err);
    res.status(500).json({ message: "Failed to create sponsored product" });
  }
};

// Admin — UPDATE product
export const updateSponsoredProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.file) {
      updateData.image = await uploadToCloudinary(req.file.path, "sponsored-products");
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
    await SponsoredProduct.findByIdAndDelete(req.params.id);
    res.json({ message: "Sponsored product deleted" });
  } catch (err) {
    console.error("Delete Sponsored Product Error:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};
