const { withConnection } = require("../../utils/helper");

//  Find admin by email
exports.findAdminUserByEmail = async (email) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM gauswarn_admin_user WHERE email = ? LIMIT 1`;
      const [rows] = await connection.execute(query, [email]);
      return rows[0] || null;
    });
  } catch (error) {
    throw error;
  }
};

//  Registration / create new admin user
exports.adminUserRegister = async (registerTable) => {
  const { full_name, email, mobile_number, password, role, permissions } =
    registerTable;

  try {
    return await withConnection(async (connection) => {
      const query = `
        INSERT INTO gauswarn_admin_user 
          (full_name, email, mobile_number, password, role, permissions) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [results] = await connection.execute(query, [
        full_name,
        email,
        mobile_number,
        password,
        role || "admin",
        permissions ? JSON.stringify(permissions) : null,
      ]);

      return results;
    });
  } catch (error) {
    throw error;
  }
};

//  Get all admin users
exports.getAllAdminUsers = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM gauswarn_admin_user ORDER BY id DESC`;
      const [rows] = await connection.execute(query);
      return rows || [];
    });
  } catch (error) {
    throw error;
  }
};

//  Update admin user
exports.updateAdminUser = async (id, updateData) => {
  const { full_name, email, mobile_number, role, permissions, status } =
    updateData;

  try {
    return await withConnection(async (connection) => {
      const fields = [];
      const values = [];

      if (full_name !== undefined) {
        fields.push("full_name = ?");
        values.push(full_name);
      }
      if (email !== undefined) {
        fields.push("email = ?");
        values.push(email);
      }
      if (mobile_number !== undefined) {
        fields.push("mobile_number = ?");
        values.push(mobile_number);
      }
      if (role !== undefined) {
        fields.push("role = ?");
        values.push(role);
      }
      if (permissions !== undefined) {
        fields.push("permissions = ?");
        values.push(JSON.stringify(permissions));
      }
      if (status !== undefined) {
        fields.push("status = ?");
        values.push(status);
      }

      if (!fields.length) {
        return { affectedRows: 0 };
      }

      const query = `
        UPDATE gauswarn_admin_user 
        SET ${fields.join(", ")} 
        WHERE id = ?
      `;
      values.push(id);

      const [result] = await connection.execute(query, values);
      return result;
    });
  } catch (error) {
    throw error;
  }
};

//  Delete admin user
exports.deleteAdminUser = async (id) => {
  try {
    return await withConnection(async (connection) => {
      const query = `DELETE FROM gauswarn_admin_user WHERE id = ?`;
      const [result] = await connection.execute(query, [id]);
      return result;
    });
  } catch (error) {
    throw error;
  }
};

exports.getAllUsers = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM rajlaxmi_user`;
      const [rows] = await connection.execute(query);
      return rows || null;
    });
  } catch (error) {
    throw error;
  }
};

// 🔒 FIXED: Parameterized queries — prevents SQL injection
exports.getAllGauswarnUsers = async ({ search, page, limit }) => {
  return await withConnection(async (connection) => {
    const offset = (page - 1) * limit;
    const params = [];

    let searchSql = "";
    if (search) {
      searchSql = `WHERE full_name LIKE ? OR email LIKE ? OR mobile_number LIKE ?`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const totalQuery = `SELECT COUNT(*) as total FROM gauswarn_admin_user ${searchSql}`;
    const [[totalResult]] = await connection.execute(totalQuery, params);

    const query = `
      SELECT *
      FROM gauswarn_admin_user
      ${searchSql}
      LIMIT ? OFFSET ?
    `;
    // Clone params and add limit/offset as strings (mysql2 execute requires strings)
    const queryParams = [...params, String(limit), String(offset)];
    const [rows] = await connection.execute(query, queryParams);

    return {
      rows,
      total: totalResult.total,
    };
  });
};

exports.updateUser = async (id, data) => {
  return await withConnection(async (connection) => {
    const query = `
      UPDATE gauswarn_admin_user SET 
      full_name=?,
      email=?,
      mobile_number=?,
      role=?,
      permissions=?
      WHERE id=?
    `;

    await connection.execute(query, [
      data.full_name,
      data.email,
      data.mobile_number,
      data.role,
      data.permissions,
      id,
    ]);
  });
};

exports.deleteUser = async (id) => {
  return await withConnection(async (connection) => {
    const query = `DELETE FROM gauswarn_admin_user WHERE id = ?`;
    await connection.execute(query, [id]);
  });
};
