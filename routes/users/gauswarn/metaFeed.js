const express = require("express");
const router = express.Router();
const productModel = require("../../../model/users/gauswarn/productModal"); // path adjust karo

router.get("/meta-feed", async (req, res) => {
  try {
    const products = await productModel.getAllProducts();

    const feed = products.map((p) => {
      let images = [];

      try {
        images = JSON.parse(p.product_images);
      } catch (e) {
        images = [];
      }

      return {
        id: String(p.product_id),
        title: `${p.product_name} ${p.product_weight}`,
        description: `${p.product_name} - ${p.product_weight}`,
        availability: "in stock",
        condition: "new",
        price: `${p.product_price} INR`,
        link: `https://gauswarn.com/product/${p.product_id}`,
        image_link: images[0] || "",
        brand: "Gauswarn",
      };
    });

    res.json(feed);
  } catch (err) {
    console.error("Meta feed error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
