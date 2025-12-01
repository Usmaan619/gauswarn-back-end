const asyncHandler = require("express-async-handler");
const reviewModel = require("../../../model/users/rajlaxmi/feedbackModel");
const registerModel = require("../../../model/users/rajlaxmi/registerModel");

// CREATE
exports.createReview = asyncHandler(async (req, res) => {
  try {
    const { user_name, user_email, rating, product_id, feedback } = req.body;

    if (!user_name || !user_email || !rating) {
      return res
        .status(400)
        .json({ message: "Name, email, and rating are required" });
    }

    const id = await reviewModel.addReview(
      user_name,
      user_email,
      rating,
      product_id,
      feedback
    );
    res.status(201).json({ success: true, message: "Review created", id });
  } catch (error) {
    console.error("Create Review Error:", error);
    throw error;
  }
});

// READ - All
exports.getAllReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await reviewModel.getAllReviews();
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Get All Reviews Error:", error);
    throw error;
  }
});

// READ - By ID
exports.getReviewById = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const review = await reviewModel.getReviewById(id);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }
    res.status(200).json({ success: true, review });
  } catch (error) {
    console.error("Get Review By ID Error:", error);
    throw error;
  }
});

// UPDATE
exports.updateReview = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await reviewModel.updateReview(id, req.body);
    res
      .status(200)
      .json({ success: true, message: "Review updated", result: updated });
  } catch (error) {
    console.error("Update Review Error:", error);
    throw error;
  }
});

// DELETE
exports.deleteReview = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    await reviewModel.deleteReview(id);
    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("Delete Review Error:", error);
    throw error;
  }
});

// GET REVIEWS BY PRODUCT + STATS
exports.getReviews = asyncHandler(async (req, res) => {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({ message: "product_id is required." });
    }

    const reviews = await reviewModel.getReviewsByProduct(product_id);
    console.log("reviews: ", reviews);

    if (!reviews?.length) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingsBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: [],
      });
    }

    const totalReviews = reviews.length;

    // Initialize ratings breakdown
    const ratingsBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      const rating = Number(review.rating);
      if (ratingsBreakdown[rating] !== undefined) {
        ratingsBreakdown[rating]++;
      }
    });

    // Calculate average rating
    const averageRating =
      reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
      totalReviews;

    const getPercentage = (count) =>
      totalReviews > 0
        ? parseFloat(((count / totalReviews) * 100).toFixed(2))
        : 0;

    res.json({
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews,
      ratingsBreakdown: {
        5: getPercentage(ratingsBreakdown[5]),
        4: getPercentage(ratingsBreakdown[4]),
        3: getPercentage(ratingsBreakdown[3]),
        2: getPercentage(ratingsBreakdown[2]),
        1: getPercentage(ratingsBreakdown[1]),
      },
      reviews,
    });
  } catch (error) {
    console.error("Fetch Product Reviews Error:", error);
    throw error;
  }
});
