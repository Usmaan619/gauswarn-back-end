const dashboardModal = require("../../model/admin/dashboardModal");
const asyncHandler = require("express-async-handler");

exports.getDashboardCounts = asyncHandler(async (req, res) => {
  try {
    const counts = await dashboardModal.getDashboardCounts();
    res.json({
      success: true,
      counts
    });
  } catch (error) {
    console.error("Dashboard counts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
});
