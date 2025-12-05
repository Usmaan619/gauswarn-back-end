const { withConnection } = require("../../../utils/helper");

exports.createBlog = async (data) => {
  return await withConnection(async (connection) => {
    const query = `
      INSERT INTO gauswarn_blogs (title, slug, content, category, image_url)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(query, [
      data.title,
      data.slug,
      data.content,
      data.category,
      data.image_url,
    ]);
    return result.insertId;
  });
};

exports.getAllBlogs = async (page, limit) => {
  return await withConnection(async (connection) => {
    const offset = (page - 1) * limit;

    const [rows] = await connection.execute(
      "SELECT * FROM gauswarn_blogs ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    return rows;
  });
};


exports.getBlogCount = async () => {
  return await withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT COUNT(*) AS total FROM gauswarn_blogs"
    );
    return rows[0].total;
  });
};

exports.getBlogById = async (id) => {
  return await withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM gauswarn_blogs WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  });
};

exports.getBlogBySlug = async (slug) => {
  return await withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM gauswarn_blogs WHERE slug = ?",
      [slug]
    );
    return rows[0] || null;
  });
};

exports.updateBlog = async (id, data) => {
  return await withConnection(async (connection) => {
    const query = `
      UPDATE gauswarn_blogs SET 
      title = ?, slug = ?, content = ?, category = ?, image_url = ?
      WHERE id = ?
    `;
    await connection.execute(query, [
      data.title,
      data.slug,
      data.content,
      data.category,
      data.image_url,
      id,
    ]);
    return true;
  });
};

exports.deleteBlog = async (id) => {
  return await withConnection(async (connection) => {
    const query = "DELETE FROM gauswarn_blogs WHERE id = ?";
    await connection.execute(query, [id]);
    return true;
  });
};
