const asyncHandler = require("express-async-handler");
const wishlistModel = require("../../../model/users/rajlaxmi/wishlistModel");

// Add to Cart Endpoint
exports.addWishlist = asyncHandler(async (req, res) => {
  try {
    const {
      uid,
      product_id,
      product_name,
      product_price,
      product_quantity,
      product_image,
    } = req.body;
    console.log("req.body: ", req.body);

    // Validate required fields
    if (
      !uid ||
      !product_id ||
      !product_name ||
      !product_price ||
      !product_quantity ||
      !product_image
    ) {
      return res.json({
        success: true,
        message: "Please provide all required fields",
      });
    }

    // New wishlist item
    const newWishlist = {
      uid,
      product_id,
      product_name,
      product_price,
      product_quantity,
      product_image,
    };

    await wishlistModel.addWishlist(newWishlist);
    res
      .status(201)
      .json({ success: true, message: "Added to Wishlist successfully!" });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

// Get All Wishlist
exports.getAllWishlist = async (req, res) => {
  try {
    console.log('req?.query?.uid: ', req?.query?.uid);
    const wishlist = await wishlistModel.getAllWishlist(req?.query?.uid);

    res.json({ wishlist });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.json({ error: "Failed to fetch wishlist" });
  }
};

// Remove wishlist
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  try {
    const { uid, product_id } = req.body;

    console.log(req.body);

    // Validate required fields
    if (!uid || !product_id) {
      return res.json({ message: "Please provide both uid and product_id" });
    }

    // Call the model function to remove the specific product from the wishlist
    const result = await wishlistModel.removeFromWishlist(uid, product_id);

    if (!result) {
      return res.json({ message: "Wishlist item not found" });
    }

    return res.json({
      message: "Wishlist item removed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error removing wishlist item:", error);
    return res.status(500).json({
      message: "Server error, failed to remove wishlist item",
      error: error.message,
    });
  }
});
