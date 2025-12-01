const { withConnection } = require("../../../utils/helper");

exports.createAddress = async (data) => {
  try {
    const {
      fullName,
      email,
      address,
      houseNo,
      country,
      contactNo,
      state,
      city,
      pincode,
      userId,
    } = data;

    return await withConnection(async (connection) => {
      const query = `
        INSERT INTO rajlaxmi_user_address
        (fullName, email, address, houseNo, country, contactNo, state, city, pincode, userId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await connection.execute(query, [
        fullName,
        email,
        address,
        houseNo,
        country,
        contactNo,
        state,
        city,
        pincode,
        userId,
      ]);
      return result.insertId;
    });
  } catch (error) {
    console.error("DB Create Address Error:", error.message);
    throw error;
  }
};

exports.getAllAddresses = async () => {
  try {
    return await withConnection(async (connection) => {
      const [rows] = await connection.execute(
        `SELECT * FROM rajlaxmi_user_address`
      );
      return rows;
    });
  } catch (error) {
    console.error("DB Get All Addresses Error:", error.message);
    throw error;
  }
};

exports.getAddressById = async (id) => {
  try {
    return await withConnection(async (connection) => {
      const [rows] = await connection.execute(
        `SELECT * FROM rajlaxmi_user_address WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    });
  } catch (error) {
    console.error("DB Get Address By ID Error:", error.message);
    throw error;
  }
};

exports.updateAddress = async (id, data) => {
  try {
    const {
      fullName,
      email,
      address,
      houseNo,
      country,
      contactNo,
      state,
      city,
      pincode,
      userId,
    } = data;

    return await withConnection(async (connection) => {
      const query = `
        UPDATE rajlaxmi_user_address SET
        fullName = ?, email = ?, address = ?, houseNo = ?, country = ?,
        contactNo = ?, state = ?, city = ?, pincode = ?, userId = ?
        WHERE id = ?
      `;
      const [result] = await connection.execute(query, [
        fullName,
        email,
        address,
        houseNo,
        country,
        contactNo,
        state,
        city,
        pincode,
        userId,
        id,
      ]);
      return result.affectedRows;
    });
  } catch (error) {
    console.error("DB Update Address Error:", error.message);
    throw error;
  }
};

exports.deleteAddress = async (id) => {
  try {
    return await withConnection(async (connection) => {
      const [result] = await connection.execute(
        `DELETE FROM rajlaxmi_user_address WHERE id = ?`,
        [id]
      );
      return result.affectedRows;
    });
  } catch (error) {
    console.error("DB Delete Address Error:", error.message);
    throw error;
  }
};
