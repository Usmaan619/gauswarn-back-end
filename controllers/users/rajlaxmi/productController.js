// rajlaxmi // Controller // Product
const productModel = require("../../../model/users/rajlaxmi/productModel");
const { extractIntegers } = require("../../../utils/helper");

// Add Product
exports.addProduct = async (req, res) => {
  try {
    const {
      product_name,
      product_description,
      product_price,
      product_weight, // Array of weights like ["5KG", "10KG"]
      product_stock,
      product_category,
      product_image,
      product_tax,
      purchase_price,
    } = req.body;

    if (
      !product_name ||
      !product_description ||
      !product_price ||
      !product_weight ||
      !product_stock ||
      !product_category
    ) {
      return res.json({ message: "All fields are required" });
    }
    // const cleanKgArray = kgArray.map(item => item.split('KG')[0]);
    // const cleanLtrArray = ltrArray.map(item => item.split('LTR')[0]);
    const converted_product_weight = await extractIntegers(product_weight);
    console.log(
      "converted_product_weight:----------- ",
      converted_product_weight
    );

    const productWeightVariants = converted_product_weight.map((weight) => {
      const calculate_price = Number(product_price) * Number(weight);

      const taxAmount = (Number(calculate_price) * Number(product_tax)) / 100;

      const finalPrice = calculate_price + taxAmount;

      return {
        weight,
        base_price: product_price,
        bulk_price: calculate_price,
        tax: taxAmount,
        final_price: finalPrice,
      };
    });

    const productData = {
      product_name,
      product_description,
      product_price,
      product_weight,
      product_stock,
      product_category,
      product_image: JSON.stringify(product_image),
      product_tax,
      product_final_price: JSON.stringify(productWeightVariants),
      purchase_price,
    };
    const product = await productModel.addProduct(productData);

    res.json({
      success: true,
      product,
      message: "Product created successfully!",
    });
  } catch (error) {
    res.json({ success: false, error: "Failed to create product" });
  }
};

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.json({ success: true, products });
  } catch (error) {
    res.json({ success: false, error: "Failed to fetch products" });
  }
};

exports.getAllProductsWithFeedback = async (req, res) => {
  try {
    const products = await productModel.getAllProductsWithFeedback();
    res.json({ success: true, products });
  } catch (error) {
    res.json({ success: false, error: "Failed to fetch products" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      product_description,
      product_price,
      product_weight, // Array of weights like ["5KG", "10KG"]
      product_stock,
      product_category,
      product_image,
      product_tax,
      purchase_price,
    } = req.body;
    const converted_product_weight = await extractIntegers(product_weight);

    const productWeightVariants = converted_product_weight.map((weight) => {
      const calculate_price = Number(product_price) * Number(weight);

      const taxAmount = (Number(calculate_price) * Number(product_tax)) / 100;

      const finalPrice = calculate_price + taxAmount;

      return {
        weight,
        base_price: product_price,
        bulk_price: calculate_price,
        tax: taxAmount,
        final_price: finalPrice,
      };
    });

    const productData = {
      product_id,
      product_name,
      product_description,
      product_price,
      product_weight: JSON.stringify(product_weight),
      product_stock,
      product_category,
      product_image: JSON.stringify(product_image),
      product_tax,
      product_final_price: JSON.stringify(productWeightVariants),
      purchase_price,
    };

    const isUpdated = await productModel.updateProduct(productData);
    if (!isUpdated)
      return res.json({ success: true, message: "Product not found" });
    res.json({ success: true, message: "Product updated successfully!" });
  } catch (error) {
    res.json({ success: false, error: "Failed to update product" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const isDeleted = await productModel.deleteProduct(product_id);
    if (!isDeleted)
      return res.json({ success: true, message: "Product not found" });

    res.json({ success: true, message: "Product deleted successfully!" });
  } catch (error) {
    res.json({ success: false, error: "Failed to delete product" });
  }
};
