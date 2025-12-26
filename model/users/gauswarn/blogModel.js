
const { withConnection } = require("../../../utils/helper");

/* ================================
   CREATE BLOG
================================ */
exports.createBlog = async (data) => {
  return withConnection(async (connection) => {
    const query = `
      INSERT INTO gauswarn_blogs 
      (title, slug, content, category, image_url)
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

/* ================================
   GET ALL BLOGS (PAGINATION + SORT)
================================ */
exports.getAllBlogs = async (page = 1, limit = 10, sortOrder = "DESC") => {
  return withConnection(async (connection) => {
    // ✅ force numbers
    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    // ✅ sanitize sort order
    sortOrder = sortOrder === "ASC" ? "ASC" : "DESC";

    const query = `
      SELECT *
      FROM gauswarn_blogs
      ORDER BY created_at ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.execute(query, [
      Number(limit),
      Number(offset),
    ]);

    return rows;
  });
};

/* ================================
   GET TOTAL BLOG COUNT
================================ */
exports.getBlogCount = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT COUNT(*) AS total FROM gauswarn_blogs"
    );
    return rows[0].total;
  });
};

/* ================================
   GET BLOG BY ID
================================ */
exports.getBlogById = async (id) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM gauswarn_blogs WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  });
};

/* ================================
   GET BLOG BY SLUG
================================ */
exports.getBlogBySlug = async (slug) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM gauswarn_blogs WHERE slug = ?",
      [slug]
    );
    return rows[0] || null;
  });
};

/* ================================
   UPDATE BLOG
================================ */
exports.updateBlog = async (id, data) => {
  return withConnection(async (connection) => {
    const query = `
      UPDATE gauswarn_blogs
      SET title = ?, slug = ?, content = ?, category = ?, image_url = ?
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

/* ================================
   DELETE BLOG
================================ */
exports.deleteBlog = async (id) => {
  return withConnection(async (connection) => {
    await connection.execute(
      "DELETE FROM gauswarn_blogs WHERE id = ?",
      [id]
    );
    return true;
  });
};

// const { withConnection } = require("../../../utils/helper");

// exports.createBlog = async (data) => {
//   return await withConnection(async (connection) => {
//     const query = `
//       INSERT INTO gauswarn_blogs (title, slug, content, category, image_url)
//       VALUES (?, ?, ?, ?, ?)
//     `;
//     const [result] = await connection.execute(query, [
//       data.title,
//       data.slug,
//       data.content,
//       data.category,
//       data.image_url,
//     ]);
//     return result.insertId;
//   });
// };

// exports.getAllBlogs = async (page, limit, sortOrder = "DESC") => {
//   return await withConnection(async (connection) => {
//     const offset = (page - 1) * limit;

//     //  SQL LEVEL SORTING (FAST & CORRECT)
//     const query = `
//       SELECT *
//       FROM gauswarn_blogs
//       ORDER BY created_at ${sortOrder}
//       LIMIT ? OFFSET ?
//     `;

//     const [rows] = await connection.execute(query, [limit, offset]);

//     return rows;
//   });
// };

// // exports.getAllBlogs = async (page, limit) => {
// //   return await withConnection(async (connection) => {
// //     const offset = (page - 1) * limit;

// //     const [rows] = await connection.execute(
// //       "SELECT * FROM gauswarn_blogs ORDER BY id DESC LIMIT ? OFFSET ?",
// //       [limit, offset]
// //     );

// //     return rows;
// //   });
// // };

// exports.getBlogCount = async () => {
//   return await withConnection(async (connection) => {
//     const [rows] = await connection.execute(
//       "SELECT COUNT(*) AS total FROM gauswarn_blogs"
//     );
//     return rows[0].total;
//   });
// };

// exports.getBlogById = async (id) => {
//   return await withConnection(async (connection) => {
//     const [rows] = await connection.execute(
//       "SELECT * FROM gauswarn_blogs WHERE id = ?",
//       [id]
//     );
//     return rows[0] || null;
//   });
// };

// exports.getBlogBySlug = async (slug) => {
//   return await withConnection(async (connection) => {
//     const [rows] = await connection.execute(
//       "SELECT * FROM gauswarn_blogs WHERE slug = ?",
//       [slug]
//     );
//     return rows[0] || null;
//   });
// };

// exports.updateBlog = async (id, data) => {
//   return await withConnection(async (connection) => {
//     const query = `
//       UPDATE gauswarn_blogs SET 
//       title = ?, slug = ?, content = ?, category = ?, image_url = ?
//       WHERE id = ?
//     `;
//     await connection.execute(query, [
//       data.title,
//       data.slug,
//       data.content,
//       data.category,
//       data.image_url,
//       id,
//     ]);
//     return true;
//   });
// };

// exports.deleteBlog = async (id) => {
//   return await withConnection(async (connection) => {
//     const query = "DELETE FROM gauswarn_blogs WHERE id = ?";
//     await connection.execute(query, [id]);
//     return true;
//   });
// };
