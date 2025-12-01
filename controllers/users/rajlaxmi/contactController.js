const asyncHandler = require("express-async-handler");
const contactModel = require("../../../model/users/rajlaxmi/contactModel");
const registerModel = require("../../../model/users/rajlaxmi/registerModel");

exports.userContact = asyncHandler(async (req, res) => {
  try {
    const { uid, user_name, user_email, user_number, message } = req.body;
    console.log("req.body: ", req.body);

    // Validation
    if (!uid && !user_name && !user_email && !user_number && !message) {
      return res.json({ message: "Please provide all fileds are required" });
    }

    // Check uid in database
    const user = await registerModel.findUserByUid(uid);
    if (!user) {
      return res.json({ message: "User not found" });
    }

    // New user
    const newContact = {
      uid,
      user_name,
      user_email,
      user_number,
      message,
    };
    await contactModel.userContact(newContact);
    return res.json({ success: true, message: "Contact successfully saved" });
  } catch (error) {
    console.error("Database Error", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// CREATE
exports.createContact = asyncHandler(async (req, res) => {
  try {
    const { user_name, user_email, user_number, message } = req.body;

    if (!user_name || !user_email || !rating) {
      return res
        .status(400)
        .json({ message: "Name, email, and rating are required" });
    }

    const id = await contactModel.addContact(
      user_name,
      user_email,
      user_number,
      message
    );
    res.status(201).json({ success: true, message: "Contact created", id });
  } catch (error) {
    console.error("Create Contact Error:", error);
    throw error;
  }
});

// READ - All
exports.getAllContacts = asyncHandler(async (req, res) => {
  try {
    const contact = await contactModel.getAllContacts();
    res.status(200).json({ success: true, contact });
  } catch (error) {
    console.error("Get All Contacts Error:", error);
    throw error;
  }
});

// READ - By ID
exports.getContactById = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const Contact = await contactModel.getContactById(id);
    if (!Contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.status(200).json(Contact);
  } catch (error) {
    console.error("Get Contact By ID Error:", error);
    throw error;
  }
});

// UPDATE
exports.updateContact = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await contactModel.updateContact(id, req.body);
    res
      .status(200)
      .json({ success: true, message: "Contact updated", result: updated });
  } catch (error) {
    console.error("Update Contact Error:", error);
    throw error;
  }
});

// DELETE
exports.deleteContact = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    await contactModel.deleteContact(id);
    res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (error) {
    console.error("Delete Contact Error:", error);
    throw error;
  }
});
