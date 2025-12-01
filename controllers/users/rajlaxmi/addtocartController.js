// const asyncHandler = require("express-async-handler");
// const addtocartModel = require("../../../model/users/rajlaxmi/addtocartModel");
// const registerModel = require("../../../model/users/rajlaxmi/registerModel");

// // Add to Cart Endpoint
// exports.addToCart = asyncHandler(async (req, res) => {
//   try {
//     const {
//       uid,
//       product_id,
//       product_name,
//       product_price,
//       product_weight,
//       product_quantity,
//     } = req.body;

//     if (
//       !uid ||
//       !product_id ||
//       !product_name ||
//       !product_price ||
//       !product_weight ||
//       !product_quantity
//     ) {
//       return res
//
//         .json({ message: "Missing required fields in cart item" });
//     }

//     // Check uid in database
//     const user = await registerModel.findUserByUid(uid);
//     if (!user) {
//       return res.json({ message: "User not found" });
//     }

//     // Check if the product already exists in the cart
//     const cartItems = await addtocartModel.findCartItem(product_id, uid);

//     if (cartItems?.length > 0) {
//       // If product exists, update quantity and total amount
//       const cartItem = cartItems[0];
//       const newQuantity = cartItem.product_quantity + product_quantity;
//       const newTotalAmount =
//         cartItem.product_total_amount + product_price * product_quantity;

//       await addtocartModel.updateCartItem(
//         uid,
//         product_id,
//         newQuantity,
//         newTotalAmount
//       );
//     } else {
//       // If product does not exist, insert a new row
//       await addtocartModel.addCartItem({
//         uid,
//         product_id,
//         product_name,
//         product_price,
//         product_weight,
//         product_quantity,
//         product_total_amount: product_price * product_quantity,
//       });
//     }

//     res.json({ message: "Add to cart successfully" });
//   } catch (error) {
//     
//     res
//       .status(500)
//       .json({ message: "Server error, failed to add to cart", error });
//   }
// });

// // Update add to cart
// exports.updateCartItem = asyncHandler(async (req, res) => {
//   try {
//     const {
//       uid,
//       product_id,
//       product_name,
//       product_quantity,
//       product_weight,
//       product_price,
//     } = req.body;
//     if (
//       !uid ||
//       !product_id ||
//       !product_name ||
//       !product_quantity ||
//       !product_weight ||
//       !product_price

//     ) {
//       return res
//
//         .json({ message: "Please provide all required fields " });
//     }

//     // Check uid in database
//     const user = await registerModel.findUserByUid(uid);
//     if (!user) {
//       return res.json({ message: "User not found" });
//     }

//     const cartItem = await addtocartModel.findCartItem(product_id, uid);

//     if (!cartItem) {
//       return res.json({ message: "Cart item not found" });
//     }

//     const affectedRows = await addtocartModel.updateCartItem(
//       uid,
//       product_id,
//       product_name,
//       product_quantity,
//       product_weight,
//       product_price,
//       product_total_amount
//     );

//     if (affectedRows > 0) {
//       return res.json({ message: "Product updated in cart" });
//     } else {
//       return res.json({ message: "Failed to update cart item" });
//     }
//   } catch (error) {
//     
//     return res
//       .status(500)
//       .json({ message: "Server error, failed to update cart" });
//   }
// });

// // Delete add to cart
// exports.deleteCartItem = asyncHandler(async (req, res, next) => {
//   try {
//     const { uid, product_id } = req.body;

//     if (!uid || !product_id) {
//       return res
//
//         .json({ message: "Please provide all required fields" });
//     }
//     // Check uid in database
//     const user = await registerModel.findUserByUid(uid);
//     if (!user) {
//       return res.json({ message: "User not found" });
//     }

//     const response = await addtocartModel.removeFromCart(product_id, uid);
//     //  return res.json(response);

//     if (response && response.message) {
//       return res.json({ message: response.message });
//     } else {
//       return res.json({ message: "Item not found in the cart" });
//     }

//   } catch (error) {
//     
//     return res.json({ message: "Server error, failed to add to cart", error });
//   }
// });

// // Get All Products
// exports.getAllCarts = async (req, res) => {
//   try {
//     const addtocart = await addtocartModel.getAllCarts();

//     res.json({ addtocart });
//   } catch (error) {
//     
//     res.json({ error: "Failed to fetch cart" });
//   }
// };

const asyncHandler = require("express-async-handler");
const addtocartModel = require("../../../model/users/rajlaxmi/addtocartModel");
const registerModel = require("../../../model/users/rajlaxmi/registerModel");
const { withConnection } = require("../../../utils/helper");

// Add to Cart
exports.addToCart = asyncHandler(async (req, res) => {
  try {
    const {
      uid,
      product_id,
      product_name,
      product_price,
      product_weight,
      product_quantity,
    } = req.body;

    if (
      !uid ||
      !product_id ||
      !product_name ||
      !product_price ||
      !product_weight ||
      !product_quantity
    ) {
      return res.json({ message: "Missing required fields in cart item" });
    }

    // Validate user
    const user = await registerModel.findUserByUid(uid);
    if (!user) return res.json({ message: "User not found" });

    // Check if the product already exists in the cart
    // const cartItem = await addtocartModel.findCartItem(product_id, uid);

    const cartItem = await addtocartModel.findCartItemPlusWait(
      product_id,
      uid,
      product_weight
    );

    if (cartItem) {
      const newQuantity = cartItem.product_quantity + product_quantity;
      const newTotalAmount = cartItem.product_price * newQuantity;

      await addtocartModel.updateCartItem(
        uid,
        product_id,
        newQuantity,
        newTotalAmount,
        product_weight
      );
    } else {
      await addtocartModel.addCartItem({
        uid,
        product_id,
        product_name,
        product_price,
        product_weight,
        product_quantity,
        product_total_amount: product_price * product_quantity,
      });
    }

    res.json({ message: "Added to cart successfully" });
  } catch (error) {
    
    res
      .status(500)
      .json({ message: "Server error, failed to add to cart", error });
  }
});

// Update Cart Item
exports.updateCartItem = asyncHandler(async (req, res) => {
  try {
    const { uid, product_id, product_quantity, product_price, product_weight } =
      req.body;

    if (
      !uid ||
      !product_id ||
      !product_quantity ||
      !product_price ||
      !product_weight
    ) {
      return res.json({ message: "Please provide all required fields" });
    }

    // Validate user
    const user = await registerModel.findUserByUid(uid);
    if (!user) return res.json({ message: "User not found" });

    const cartItem = await addtocartModel.findCartItemPlusWait(
      product_id,
      uid,
      product_weight
    );
    if (!cartItem) return res.json({ message: "Cart item not found" });

    const product_total_amount = product_price * product_quantity;
    const updated = await addtocartModel.updateCartItem(
      uid,
      product_id,
      product_quantity,
      product_total_amount,
      product_weight
    );

    if (updated) {
      res.json({ message: "Cart item updated successfully" });
    } else {
      res.json({ message: "Failed to update cart item" });
    }
  } catch (error) {
    
    res
      .status(500)
      .json({ message: "Server error, failed to update cart item" });
  }
});

// Delete Cart Item
exports.deleteCartItem = asyncHandler(async (req, res) => {
  try {
    const { uid, product_id } = req.body;

    if (!uid || !product_id) {
      return res.json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Validate user
    const user = await registerModel.findUserByUid(uid);
    if (!user) return res.json({ success: false, message: "User not found" });

    const deleted = await addtocartModel.deleteCartItem(uid, product_id);
    if (deleted) {
      res.json({ success: true, message: "Product removed from cart" });
    } else {
      res.json({ success: false, message: "Item not found in the cart" });
    }
  } catch (error) {
    
    res
      .status(500)
      .json({
        success: false,
        message: "Server error, failed to remove cart item",
      });
  }
});

// Get All Cart Items
exports.getAllCarts = asyncHandler(async (req, res) => {
  try {
    const cartItems = await addtocartModel.getAllCarts();
    res.json({ cartItems });
  } catch (error) {
    
    res.status(500).json({ message: "Failed to fetch cart items" });
  }
});

// Get Cart Items by User ID
exports.getCartItemsByUser = asyncHandler(async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.json({ message: "User ID is required" });

    const cartItems = await addtocartModel.getCartItemsByUserId(uid);
    res.json({ cartItems });
  } catch (error) {
    
    res.status(500).json({ message: "Failed to fetch user cart items" });
  }
});

exports.getAllCartById = asyncHandler(async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.json({ message: "User ID is required" });

    const cartItems = await addtocartModel.getAllCartById(uid);
    
    res.json({ cartItems });
  } catch (error) {
    
    res.status(500).json({ message: "Failed to fetch user cart items" });
  }
});
