const { withConnection } = require("../../utils/helper");

exports.getDashboardCounts = async () => {
  return await withConnection(async (connection) => {
    const queries = {
      customers: "SELECT COUNT(*) AS count FROM gauswarn_payment",
      b2bInquiry: "SELECT COUNT(*) AS count FROM gauswarn_inquiries",
      contact: "SELECT COUNT(*) AS count FROM gauswarn_contact",
      newsletter: "SELECT COUNT(*) AS count FROM gauswarn_newsletter_subscribers",
      offerBanner: "SELECT COUNT(*) AS count FROM gauswarn_offers", // or gauswarn_home_banners, using gauswarn_offers as record count
      feedback: "SELECT COUNT(*) AS count FROM gauswarn_feedback"
    };

    const results = {};
    for (const [key, query] of Object.entries(queries)) {
      const [rows] = await connection.execute(query);
      results[key] = rows[0].count;
    }
    return results;
  });
};
