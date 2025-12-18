const { withConnection } = require("../../../utils/helper");

exports.getAll = async ({ page, limit, search, status }) => {
  return await withConnection(async (connection) => {
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    let values = [];

    if (search) {
      where += " AND email LIKE ?";
      values.push(`%${search}%`);
    }

    if (status !== "") {
      where += " AND status = ?";
      values.push(status);
    }

    const [rows] = await connection.execute(
      `SELECT * FROM gauswarn_newsletter_subscribers ${where}
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const [[{ total }]] = await connection.execute(
      `SELECT COUNT(*) as total FROM gauswarn_newsletter_subscribers ${where}`,
      values
    );

    return {
      rows,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
};

exports.create = async (email) => {
  return await withConnection(async (connection) => {
    const [res] = await connection.execute(
      `INSERT INTO gauswarn_newsletter_subscribers (email) VALUES (?)`,
      [email]
    );
    return res.insertId;
  });
};

exports.updateStatus = async (id, status) => {
  return await withConnection(async (connection) => {
    await connection.execute(
      `UPDATE gauswarn_newsletter_subscribers SET status=? WHERE id=?`,
      [status, id]
    );
    return true;
  });
};

exports.delete = async (id) => {
  return await withConnection(async (connection) => {
    await connection.execute(`DELETE FROM gauswarn_newsletter_subscribers WHERE id=?`, [
      id,
    ]);
    return true;
  });
};
