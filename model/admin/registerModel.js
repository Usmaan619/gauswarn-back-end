const { withConnection } = require("../../utils/helper");

exports.findAdminUserByEmail = async (email) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM organic_farmer_admin_user WHERE email = ?`;
      const [rows] = await connection.execute(query, [email]);
      return rows[0] || null;
    });
  } catch (error) {
    console.log("error: ", error);
    return error;
  }
};

// Registration new user
exports.adminUserRegister = async (registerTable) => {
  const { full_name, email, mobile_number, password, role } = registerTable;

  //MySQl query
  try {
    return await withConnection(async (connection) => {
      const query = `INSERT INTO organic_farmer_admin_user (full_name, email, mobile_number, password,role) VALUES (?, ?, ?, ?, ?)`;

      //Execute the query
      const [results] = await connection.execute(query, [
        full_name,
        email,
        mobile_number,
        password,
        role,
      ]);
      return results;
    });
  } catch (error) {
    console.log("error: ", error);
    return error;
  }
};

exports.findUserById = async (uid) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM rajlaxmi_user WHERE uid = ?`;
      const [rows] = await connection.execute(query, [uid]);
      return rows[0] || null;
    });
  } catch (error) {
    console.log("error: ", error);
    return error;
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
    console.log("error: ", error);
    return error;
  }
};
