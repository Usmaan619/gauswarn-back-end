const {
  getAllBanners,
  getBannerSlot,
  updateBannerSlot,
} = require("../../../model/users/gauswarn/homeBannerModel");

const {
  uploadBufferToS3,
  deleteFromS3,
} = require("../../../service/uploadFile");

// GET all banners
exports.getHomeBanners = async (req, res) => {
  try {
    const banners = await getAllBanners();
    return res.json(banners);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateHomeBanner = async (req, res) => {
  try {
    const { slots } = req.body; // slot = "1,2,4"
    const files = req.files || []; // multiple files

    if (!slots) {
      return res.status(400).json({ message: "Slots are required" });
    }

    const slotArray = slots.split(",").map((s) => Number(s.trim()));

    // Validate slots (1–4)
    if (slotArray.some((s) => ![1, 2, 3, 4].includes(s))) {
      return res
        .status(400)
        .json({ message: "Invalid slot number (1-4 allowed)" });
    }

    // If no images → return but not error
    if (files.length === 0) {
      return res.json({
        message: "No images uploaded. No banners updated.",
        updated: [],
      });
    }

    let updated = [];

    // Loop images and update their slots
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const slot = slotArray[i];

      if (!slot) continue; // slot kam hai → extra file ignore

      const oldBanner = await getBannerSlot(slot);

      // Upload new
      const newUrl = await uploadBufferToS3(file.buffer, file.mimetype);

      // Delete old from S3
      if (oldBanner) {
        await deleteFromS3(oldBanner);
      }

      // Update DB
      await updateBannerSlot(slot, newUrl);

      updated.push({ slot, newUrl });
    }

    return res.json({
      message: "Banners updated successfully",
      updated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// exports.updateHomeBannerNew = async (req, res) => {
//   try {
//     const { slots } = req.body; // "1,2,3"
//     const files = req.files || []; // may be empty []

//     if (!slots) {
//       return res.status(400).json({ message: "Slots required" });
//     }

//     const slotArray = slots.split(",").map((s) => Number(s.trim()));

//     if (slotArray.some((s) => ![1, 2, 3, 4].includes(s))) {
//       return res
//         .status(400)
//         .json({ message: "Invalid slot number (1-4 allowed)" });
//     }

//     // If no images → Do nothing but respond safely
//     if (files.length === 0) {
//       return res.json({
//         message: "No images received. No banners updated.",
//         updated: [],
//       });
//     }

//     let updated = [];

//     // Process only slots that have files
//     for (let i = 0; i < files.length; i++) {
//       const file = files[i];
//       const slot = slotArray[i];

//       if (!slot) continue; // more files than slots? ignore

//       const oldBanner = await getBannerSlot(slot);

//       // upload new
//       const newUrl = await uploadBufferToS3(file.buffer, file.mimetype);

//       // delete old
//       if (oldBanner) {
//         await deleteFromS3(oldBanner);
//       }

//       // update db
//       await updateBannerSlot(slot, newUrl);

//       updated.push({ slot, newUrl });
//     }

//     return res.json({
//       message: "Banners updated successfully",
//       updated,
//     });
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };
