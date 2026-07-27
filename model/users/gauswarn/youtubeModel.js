const { withConnection } = require("../../../utils/helper");

exports.addYoutubeShort = async (shortId) => {
  return await withConnection(async (connection) => {
    const query = `
      INSERT INTO gauswarn_youtube (short_id)
      VALUES (?)
    `;
    const [result] = await connection.execute(query, [shortId]);
    return result.insertId;
  });
};

exports.getAllYoutubeShorts = async () => {
  return withConnection(async (connection) => {
    const query = "SELECT * FROM gauswarn_youtube ORDER BY id DESC";
    const [rows] = await connection.execute(query);
    return rows || [];
  });
};

exports.getYoutubeShortById = async (id) => {
  return withConnection(async (connection) => {
    const query = "SELECT * FROM gauswarn_youtube WHERE id = ?";
    const [rows] = await connection.execute(query, [id]);
    return rows[0] || null;
  });
};

exports.deleteYoutubeShort = async (id) => {
  return withConnection(async (connection) => {
    await connection.execute("DELETE FROM gauswarn_youtube WHERE id = ?", [id]);
    return true;
  });
};
