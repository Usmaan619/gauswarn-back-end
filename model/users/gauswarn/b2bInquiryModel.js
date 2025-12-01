const { withConnection } = require("../../../utils/helper");
const moment = require("moment");

/* =====================================================
    CREATE Inquiry
===================================================== */
exports.create = async (data) => {
  try {
    return await withConnection(async (conn) => {
      const sql = `
        INSERT INTO gauswarn_inquiries 
        (full_name, business_name, phone, email, business_type, monthly_requirement, message, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        data.full_name,
        data.business_name,
        data.phone,
        data.email,
        data.business_type,
        data.monthly_requirement,
        data.message,
        "new",
      ];

      const [result] = await conn.execute(sql, values);

      return result.insertId;
    });
  } catch (error) {
    console.error(
      " Error in create inquiry:",
      error.message,
      moment().format("YYYY-MM-DD HH:mm:ss")
    );
    throw new Error("Unable to create inquiry");
  }
};

/* =====================================================
    GET ALL - Pagination + Search + Filter
===================================================== */
exports.getAll = async ({ page, limit, search, status }) => {
  try {
    return await withConnection(async (conn) => {
      const offset = (page - 1) * limit;

      let where = "WHERE 1=1";
      const params = [];

      if (search) {
        where += ` AND (
          full_name LIKE ? OR 
          business_name LIKE ? OR 
          email LIKE ? OR 
          phone LIKE ? OR 
          business_type LIKE ? OR
          message LIKE ?
        )`;

        params.push(
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`
        );
      }

      if (status) {
        where += " AND status = ?";
        params.push(status);
      }

      const sql = `
        SELECT * FROM gauswarn_inquiries 
        ${where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countSql = `
        SELECT COUNT(*) as total FROM gauswarn_inquiries ${where}
      `;

      const [rows] = await conn.execute(sql, [...params, limit, offset]);
      const [countResult] = await conn.execute(countSql, params);

      return {
        data: rows,
        total: countResult[0].total,
      };
    });
  } catch (error) {
    console.error(
      " Error in getAll gauswarn_inquiries:",
      error.message,
      moment().format("YYYY-MM-DD HH:mm:ss")
    );
    throw new Error("Unable to fetch gauswarn_inquiries");
  }
};

/* =====================================================
    GET ONE Inquiry
===================================================== */
exports.getById = async (id) => {
  try {
    return await withConnection(async (conn) => {
      const sql = "SELECT * FROM gauswarn_inquiries WHERE id = ?";
      const [rows] = await conn.execute(sql, [id]);
      return rows[0];
    });
  } catch (error) {
    console.error(
      " Error in getById inquiry:",
      error.message,
      moment().format("YYYY-MM-DD HH:mm:ss")
    );
    throw new Error("Unable to fetch inquiry");
  }
};

/* =====================================================
    UPDATE Inquiry
===================================================== */
exports.update = async (id, data) => {
  try {
    return await withConnection(async (conn) => {
      const sql = `
        UPDATE gauswarn_inquiries SET 
          full_name = ?, 
          business_name = ?, 
          phone = ?, 
          email = ?, 
          business_type = ?, 
          monthly_requirement = ?, 
          message = ?, 
          status = ?
        WHERE id = ?
      `;

      const values = [
        data.full_name,
        data.business_name,
        data.phone,
        data.email,
        data.business_type,
        data.monthly_requirement,
        data.message,
        data.status,
        id,
      ];

      const [result] = await conn.execute(sql, values);

      return result.affectedRows;
    });
  } catch (error) {
    console.error(
      " Error in update inquiry:",
      error.message,
      moment().format("YYYY-MM-DD HH:mm:ss")
    );
    throw new Error("Unable to update inquiry");
  }
};

/* =====================================================
    DELETE Inquiry
===================================================== */
exports.delete = async (id) => {
  try {
    return await withConnection(async (conn) => {
      const sql = "DELETE FROM gauswarn_inquiries WHERE id = ?";
      const [result] = await conn.execute(sql, [id]);

      return result.affectedRows;
    });
  } catch (error) {
    console.error(
      " Error in delete inquiry:",
      error.message,
      moment().format("YYYY-MM-DD HH:mm:ss")
    );
    throw new Error("Unable to delete inquiry");
  }
};
