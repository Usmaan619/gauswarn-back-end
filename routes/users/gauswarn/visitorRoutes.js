const express = require("express");
const router = express.Router();
const {
  trackVisitor,
  listVisitors,
  deleteVisitor,
  clearAllVisitors,
} = require("../../../controllers/users/gauswarn/visitorController");

router.post("/track-visitor", trackVisitor);
router.get("/list-visitors", listVisitors);
router.delete("/delete-visitor/:id", deleteVisitor);
router.delete("/clear-visitors", clearAllVisitors);

module.exports = router;
