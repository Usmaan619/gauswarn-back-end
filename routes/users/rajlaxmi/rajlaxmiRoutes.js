// routes/ussersRoutes.js

const express = require("express");
const router = express.Router();
const registerController = require("../../../controllers/users/rajlaxmi/registerController");
const loginController = require("../../../controllers/users/rajlaxmi/loginController");
const forgotPasswordController = require("../../../controllers/users/rajlaxmi/forgotPasswordController");
const addtocartController = require("../../../controllers/users/rajlaxmi/addtocartController");
const contactController = require("../../../controllers/users/rajlaxmi/contactController");
const feedbackController = require("../../../controllers/users/rajlaxmi/feedbackController");
const paymentController = require("../../../controllers/users/rajlaxmi/paymentController");
const prodcutController = require("../../../controllers/users/rajlaxmi/productController");
const wishlistController = require("../../../controllers/users/rajlaxmi/wishlistController");
const {
  createPaymentAndGenerateUrlRazor,
  getRazorpayStatusAndUpdatePayment,
} = require("../../../controllers/users/rajlaxmi/razerpayPaymentController");

const userAddressController = require("../../../controllers/users/rajlaxmi/userAddressController");

// Routes

// Register
router.post("/register", registerController.userRegister);

// Login
router.post("/login", loginController.userLogin);

//  Forget password
// router.post("/forgotPassword", forgotPasswordController.forgotPassword);

// Re-set Password
// router.post("/resetPassword", forgotPasswordController.passwordReset);

// Add To Cart
router.post("/addtocart", addtocartController.addToCart);

// // User Add to cart remove
router.post("/removecart", addtocartController.deleteCartItem);

// //  Update cart item
router.post("/updateCart", addtocartController.updateCartItem);

// Get cart
router.get("/getAllCartById", addtocartController.getAllCartById);

// Contact
router.post("/contact", contactController.userContact);

// Payment
// phonePe routes
// router.post("/create-order", paymentController.createPaymentAndGenerateUrl);
// router.post("/status", paymentController.getPhonePeUrlStatusAndUpdatePayment);

// Add wishlist
router.post("/wishlist", wishlistController.addWishlist);

router.get("/getAllWishlist", wishlistController.getAllWishlist);

router.delete("/removeFromWishlist", wishlistController.removeFromWishlist);

router.post("/createFeedbackRajlaxmi", feedbackController.createReview); // Create
router.get("/getAllFeedbackRajlaxmi", feedbackController.getAllReviews); // Read All
router.get(
  "/getSingleFeedbackRajlaxmiById/:id",
  feedbackController.getReviewById
); // Read Single
router.put("/updateFeedbackRajlaxmiById/:id", feedbackController.updateReview); // Update
router.delete(
  "/deleteFeedbackRajlaxmiById/:id",
  feedbackController.deleteReview
); // Delete

router.post("/createAddressRajlaxmi", userAddressController.createAddress);
router.get("/getAllAddressRajlaxmi", userAddressController.getAllAddresses);
router.get("/getAddressByIdRajlaxmi/:id", userAddressController.getAddressById);
router.post(
  "/updateAddressByIdRajlaxmi/:id",
  userAddressController.updateAddress
);
router.delete(
  "/deleteAddressByIdRajlaxmi/:id",
  userAddressController.deleteAddress
);

router.get("/getAllProduct", prodcutController.getAllProducts);

// razorpay
router.post("/create-order", createPaymentAndGenerateUrlRazor);
router.post("/status", getRazorpayStatusAndUpdatePayment);

module.exports = router;
