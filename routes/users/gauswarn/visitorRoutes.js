const express = require("express");
const router = express.Router();
const { trackVisitor } = require("../../../controllers/users/gauswarn/visitorController");

router.post("/track-visitor", trackVisitor);

module.exports = router;
