// controllers/userAddress.controller.js
const asyncHandler = require("express-async-handler");
const userAddressModel = require("../../../model/users/rajlaxmi/userAddressModel");

exports.createAddress = asyncHandler(async (req, res) => {
  try {
    const id = await userAddressModel.createAddress(req.body);
    res.status(201).json({ success: true, message: "Address created", id });
  } catch (error) {
    console.error("Create Address Error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

exports.getAllAddresses = asyncHandler(async (req, res) => {
  try {
    const addresses = await userAddressModel.getAllAddresses();
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error("Get All Addresses Error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

exports.getAddressById = asyncHandler(async (req, res) => {
  try {
    const address = await userAddressModel.getAddressById(req.params.id);
    if (!address)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    res.status(200).json({ success: true, address });
  } catch (error) {
    console.error("Get Address By ID Error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

exports.updateAddress = asyncHandler(async (req, res) => {
  try {
    const affected = await userAddressModel.updateAddress(
      req.params.id,
      req.body
    );
    if (affected === 0)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    res.status(200).json({ success: true, message: "Address updated" });
  } catch (error) {
    console.error("Update Address Error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  try {
    const affected = await userAddressModel.deleteAddress(req.params.id);
    if (affected === 0)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    res.status(200).json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error("Delete Address Error:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
