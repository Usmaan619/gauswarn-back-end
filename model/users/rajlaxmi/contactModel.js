const { connectToDatabase } = require("../../../config/dbConnection");
const { withConnection } = require("../../../utils/helper");

exports.userContact = async (contactTable) => {
  try {
    const { user_name, user_email, user_number, message } = contactTable;

    const connection = await connectToDatabase();
    const query = `INSERT INTO rajlaxmi_contact (
     user_name, user_email, user_number,  message) 
    VALUES( ?, ?, ?, ?)`;

    const [results] = await connection.execute(query, [
      user_name,
      user_email,
      user_number,
      message,
    ]);

    return results;
  } catch (error) {
    console.error(" Database Error", error);
    throw error;
  }
};

// Create (Add Contact)
exports.addContact = async (user_name, user_email, user_number, message) => {
  try {
    return await withConnection(async (connection) => {
      const query = `
        INSERT INTO rajlaxmi_contact (user_name, user_email, user_number,  message)
        VALUES ( ?, ?, ?, ?)
      `;
      const [result] = await connection.execute(query, [
        user_name,
        user_email,
        user_number,
        message,
      ]);
      return result.insertId;
    });
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
};

// Read (Get All Contacts)
exports.getAllContacts = async () => {
  return await withConnection(async (connection) => {
    const [rows] = await connection.query(`SELECT * FROM rajlaxmi_contact`);
    return rows;
  });
};

// Read (Single Contact by ID)
exports.getContactById = async (id) => {
  return await withConnection(async (connection) => {
    const [rows] = await connection.query(
      `SELECT * FROM rajlaxmi_contact WHERE id = ?`,
      [id]
    );
    return rows[0];
  });
};

// Update Contact
exports.updateContact = async (id, updatedData) => {
  const { user_name, user_email, user_number, message } = updatedData;
  return await withConnection(async (connection) => {
    const query = `
      UPDATE rajlaxmi_contact 
      SET user_name = ?, user_email = ?, user_number = ?, message = ?
      WHERE id = ?
    `;
    const [result] = await connection.execute(query, [
      user_name,
      user_email,
      user_number,
      message,
      id,
    ]);
    return result;
  });
};

// Delete Contact
exports.deleteContact = async (id) => {
  return await withConnection(async (connection) => {
    const [result] = await connection.execute(
      `DELETE FROM rajlaxmi_contact WHERE id = ?`,
      [id]
    );
    return result;
  });
};
