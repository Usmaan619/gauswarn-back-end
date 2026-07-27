const {
  addReel,
  getAllReels,
  getReelById,
  deleteReel,
} = require("../../../model/users/gauswarn/reelModel");

exports.createReel = async (req, res) => {
  try {
    const { reel_id } = req.body;

    if (!reel_id) {
      return res.json({ success: false, message: "Reel ID required" });
    }

    const id = await addReel(reel_id);

    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listReels = async (req, res) => {
  const reels = await getAllReels();
  res.json({ success: true, reels });
};

exports.deleteReelById = async (req, res) => {
  const { id } = req.params;
  await deleteReel(id);
  res.json({ success: true });
};
