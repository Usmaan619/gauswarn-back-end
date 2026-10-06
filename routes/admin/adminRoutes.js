const express = require("express");
const router = express.Router();

// Middleware
const { errorHandler } = require("../../middlewares/errorHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");

// Controllers
// Admin
const registerController = require("../../controllers/admin/registerController");
const loginController = require("../../controllers/admin/loginController");
const forgotPasswordController = require("../../controllers/admin/forgotPasswordController");
const userInfoController = require("../../controllers/admin/userInfoController");
const monthlyReportController = require("../../controllers/admin/monthlyReportController");
const dashboardController = require("../../controllers/admin/dashboardController");

// Rajlaxmi
const productControllerRajlaxmi = require("../../controllers/users/rajlaxmi/productController");
const feedbackRajlaxmiController = require("../../controllers/users/rajlaxmi/feedbackController");
const contactControllerRajlaxmi = require("../../controllers/users/rajlaxmi/contactController");
const orderControllerRajlaxmi = require("../../controllers/users/rajlaxmi/orderController");

// Gauswarn
const productControllerGauswarn = require("../../controllers/users/gauswarn/productController");
const feedbackGauswarnController = require("../../controllers/users/gauswarn/feedbackController");
const contactControllerGauswarn = require("../../controllers/users/gauswarn/contactController");
const imageUploadControllerGauswarn = require("../../controllers/users/gauswarn/uploadController");

const homeBannerControllerGauswarn = require("../../controllers/users/gauswarn/homeBannerController");

const reelControllerGauswarn = require("../../controllers/users/gauswarn/reelController");

const blogsControllerGauswarn = require("../../controllers/users/gauswarn/blogController");

const upload = require("../../middlewares/multer");
const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
} = require("../../controllers/users/gauswarn/b2bInquiryController");

const newsletterController = require("../../controllers/users/gauswarn/newsletterController");

const topBannerOfferController = require("../../controllers/users/gauswarn/topBannerOfferController");

const youtubeController = require("../../controllers/users/gauswarn/youtubeController");
const visitorController = require("../../controllers/users/gauswarn/visitorController");
const couponAdminController = require("../../controllers/admin/couponAdminController");

// ============================
// PUBLIC Routes (no auth needed)
// ============================
router.post("/login", loginController.adminUserLogin);
router.post("/forgetPassword", forgotPasswordController.forgetPassword);
router.post("/reset", forgotPasswordController.passwordReset);
router.post("/verifyOtp", forgotPasswordController.verifyOtp);

// ============================
// PUBLIC Frontend Routes (no auth needed)
// ============================
router.get("/home-banners", homeBannerControllerGauswarn.getHomeBanners);
router.get("/shorts/all", youtubeController.listYoutubeShorts);
router.get("/getAllOffer", topBannerOfferController.getOffersController);
router.get("/blogs", blogsControllerGauswarn.getAllBlogsController);
router.get("/blogs/single/:slug", blogsControllerGauswarn.getSingleBlogBySlug);
router.get("/blogs/:id", blogsControllerGauswarn.getBlogByIdController);
router.post("/createNewsletter", newsletterController.createNewsletter);
router.post("/createb2bInquiry", createInquiry);

// ============================
// 🔒 ALL ROUTES BELOW REQUIRE AUTH
// ============================
router.use(authMiddleware); // Apply to all routes below this line

// ----------------------------
// Admin User Management
// ----------------------------
router.post("/register", registerController.adminUserRegister);
router.get("/getAllGauswarnUsers", registerController.getAllGauswarnUsers);
router.post("/updateUser/:id", registerController.updateUser);
router.delete("/deleteUser/:id", registerController.deleteUser);

router.get("/getAllCustomer", userInfoController.getAllUserInfo);
router.get("/getAllOrderDetails", userInfoController.getAllOrderDetails);
router.post("/updateOrderStatus/:id", userInfoController.updateOrderStatus);
router.get("/getInvoiceHtml/:id", userInfoController.getInvoiceHtml);

router.post("/getAllSales", monthlyReportController.getAllSales);
router.get("/dashboardCounts", dashboardController.getDashboardCounts);
router.post("/getAllSalesRajlaxmi", monthlyReportController.getAllSalesRajlaxmi);

// ----------------------------
// Rajlaxmi Routes (ALL PROTECTED)
// ----------------------------
// Customers
router.get("/getAllCutomerRajlaxmi", registerController.getAllUsers);

// Products
router.post("/createProductRajlaxmi", productControllerRajlaxmi.addProduct);
router.post("/updateProductById", productControllerRajlaxmi.updateProduct);
router.post(
  "/deleteProductRajlaxmiById/:product_id",
  productControllerRajlaxmi.deleteProduct,
);
router.get(
  "/getAllProductsWithFeedback",
  productControllerRajlaxmi.getAllProductsWithFeedback,
);
router.get("/getAllProductsRajlaxmi", productControllerRajlaxmi.getAllProducts);
router.delete(
  "/deleteProductsRajlaxmiById/:product_id",
  productControllerRajlaxmi.deleteProduct,
);

// Orders
router.post("/createOrderRajlaxmi", orderControllerRajlaxmi.createOrder);
router.post("/updateRajlaxmiOrderById", orderControllerRajlaxmi.updateOrder);
router.post("/deleteRajlaxmiOrderById", orderControllerRajlaxmi.deleteOrder);
router.get("/rajlaxmiGetAllOrder", orderControllerRajlaxmi.getAllOrders);

// Feedback
router.post("/createFeedbackRajlaxmi", feedbackRajlaxmiController.createReview);
router.get("/getAllFeedbackRajlaxmi", feedbackRajlaxmiController.getAllReviews);
router.get(
  "/getSingleFeedbackRajlaxmiById/:id",
  feedbackRajlaxmiController.getReviewById,
);
router.put(
  "/updateFeedbackRajlaxmiById/:id",
  feedbackRajlaxmiController.updateReview,
);
router.delete(
  "/deleteFeedbackRajlaxmiById/:id",
  feedbackRajlaxmiController.deleteReview,
);

// Contact
router.post("/createContactRajlaxmi", contactControllerRajlaxmi.createContact);
router.get("/getAllContactRajlaxmi", contactControllerRajlaxmi.getAllContacts);
router.get(
  "/getSingleContactRajlaxmiById/:id",
  contactControllerRajlaxmi.getContactById,
);
router.put(
  "/updateContactRajlaxmiById/:id",
  contactControllerRajlaxmi.updateContact,
);
router.delete(
  "/deleteContactRajlaxmiById/:id",
  contactControllerRajlaxmi.deleteContact,
);

// ----------------------------
// Gauswarn Routes (ALL PROTECTED)
// ----------------------------
// Products
router.post("/createProductGauswarn", productControllerGauswarn.addProduct);
router.post(
  "/updateGauswarnProductById",
  productControllerGauswarn.updateProductPrices,
);
router.post(
  "/deleteGauswarnProductById",
  productControllerGauswarn.deleteProduct,
);
router.get("/gauswarnGetAllProduct", productControllerGauswarn.getAllProducts);

// Feedback
router.get("/allfeedback", feedbackGauswarnController.getReviews);
router.post("/createFeedback", feedbackGauswarnController.feedback);
router.post(
  "/getSingleFeedbackById/:id",
  feedbackGauswarnController.getReviewById,
);
router.put(
  "/updateFeedbackById/:id",
  feedbackGauswarnController.updateReviewById,
);
router.delete(
  "/deleteFeedbackById/:id",
  feedbackGauswarnController.deleteReviewById,
);

// Image and Video upload
router.post("/base64", imageUploadControllerGauswarn.uploadMedia);
router.post(
  "/imageUpload",
  upload.single("file"),
  imageUploadControllerGauswarn.uploadMedia,
);
router.post(
  "/files",
  upload.array("files"),
  imageUploadControllerGauswarn.uploadMedia,
);
router.post(
  "/add-images",
  upload.array("images", 10),
  productControllerGauswarn.addProductImages,
);
router.post(
  "/replace-image",
  upload.single("image"),
  productControllerGauswarn.replaceProductImage,
);
// Base64 product image routes — no multer needed
router.post(
  "/add-images-base64",
  productControllerGauswarn.addProductImagesBase64,
);
router.post(
  "/replace-image-base64",
  productControllerGauswarn.replaceProductImageBase64,
);

// Home Banners
router.post("/banner-signature", homeBannerControllerGauswarn.getSignature);
// router.get("/home-banners", homeBannerControllerGauswarn.getHomeBanners); // Moved to public
router.post(
  "/home-banners-url",
  homeBannerControllerGauswarn.updateHomeBannerByUrl,
);
router.post(
  "/home-banners-images",
  upload.single("banner"),
  homeBannerControllerGauswarn.updateHomeBanner,
);
// Base64 banner upload — no multer needed
router.post(
  "/home-banners-base64",
  homeBannerControllerGauswarn.updateHomeBannerBase64,
);

// Reels
router.post("/reels", reelControllerGauswarn.createReel);
router.get("/reels/all", reelControllerGauswarn.listReels);
router.delete("/reels-delete/:id", reelControllerGauswarn.deleteReelById);

// Blogs
router.post(
  "/blogs/create",
  upload.single("image"),
  blogsControllerGauswarn.createBlogController,
);
router.post(
  "/blogs/update/:id",
  upload.single("image"),
  blogsControllerGauswarn.updateBlogController,
);
// router.get("/blogs", blogsControllerGauswarn.getAllBlogsController);
// router.get("/blogs/single/:slug", blogsControllerGauswarn.getSingleBlogBySlug);
// router.get("/blogs/:id", blogsControllerGauswarn.getBlogByIdController);
router.delete("/blogs/:id", blogsControllerGauswarn.deleteBlogController);

// B2B Inquiry
// router.post("/createb2bInquiry", createInquiry);
router.get("/getb2bInquiries", getInquiries);
router.get("/getb2bInquiryById/:id", getInquiryById);
router.post("/updateb2bInquiry/:id", updateInquiry);
router.delete("/deleteb2bInquiry/:id", deleteInquiry);

// Newsletter
router.get("/getNewsletter", newsletterController.getNewsletter);
// router.post("/createNewsletter", newsletterController.createNewsletter);
router.post(
  "/updateNewsletterStatus/:id",
  newsletterController.updateNewsletterStatus,
);
router.delete("/deleteNewsletter/:id", newsletterController.deleteNewsletter);

// Offers
// router.get("/getAllOffer", topBannerOfferController.getOffersController);
router.post("/updateOffer", topBannerOfferController.updateOffersController);

// YouTube Shorts
router.post("/shorts", youtubeController.createYoutubeShort);
// router.get("/shorts/all", youtubeController.listYoutubeShorts);
router.delete("/shorts-delete/:id", youtubeController.deleteYoutubeShortById);

// Visitor Tracking
router.get("/list-visitors", visitorController.listVisitors);
router.delete("/delete-visitor/:id", visitorController.deleteVisitor);
router.delete("/clear-visitors", visitorController.clearAllVisitors);

// Contact
router.get("/getAllContact", contactControllerGauswarn.getAllContact);

// Coupons
router.get("/coupons", couponAdminController.listAllCoupons);
router.post("/coupons", couponAdminController.createCoupon);
router.put("/coupons/:id", couponAdminController.updateCoupon);
router.delete("/coupons/:id", couponAdminController.deleteCoupon);

// ----------------------------
// Global Error Handler
// ----------------------------
router.use(errorHandler);

module.exports = router;
