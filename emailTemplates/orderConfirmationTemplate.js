/**
 * Order Confirmation Email Template — Gauswarn
 * Sent to customer after successful Razorpay payment
 */
const orderConfirmationTemplate = (orderData) => {
  const {
    user_name = "Customer",
    order_id = "",
    date = new Date().toLocaleDateString("en-IN"),
    cart = [],
    subtotal = 0,
    discount = 0,
    coupon_code = null,
    total_amount = 0,
    payment_id = "",
    user_house_number = "",
    user_landmark = "",
    user_city = "",
    user_state = "",
    user_pincode = "",
    user_country = "",
    user_mobile_num = "",
    user_email = "",
  } = orderData;

  // Build cart items rows
  const cartItemsRows = cart
    .map(
      (item, index) => `
      <tr>
        <td style="padding: 12px 4px; border-bottom: 1px solid #f0e6d3; color: #4a3728; font-size: 13px;">
          ${index + 1}
        </td>
        <td style="padding: 12px 4px; border-bottom: 1px solid #f0e6d3; color: #4a3728; font-size: 13px;">
          ${item.product_name || item.name || "A2 Cow Ghee"}
        </td>
        <td style="padding: 12px 4px; border-bottom: 1px solid #f0e6d3; color: #4a3728; font-size: 13px; text-align: center;">
          ${item.product_weight || "-"}
        </td>
        <td style="padding: 12px 4px; border-bottom: 1px solid #f0e6d3; color: #4a3728; font-size: 13px; text-align: center;">
          ${item.product_quantity || 1}
        </td>
        <td style="padding: 12px 4px; border-bottom: 1px solid #f0e6d3; color: #4a3728; font-size: 13px; text-align: right;">
          ₹${item.product_price || 0}
        </td>
        <td style="padding: 12px 4px; border-bottom: 1px solid #f0e6d3; color: #4a3728; font-size: 13px; text-align: right; font-weight: 600;">
          ₹${(item.product_price || 0) * (item.product_quantity || 1)}
        </td>
      </tr>`
    )
    .join("");

  const fullAddress = [user_house_number, user_landmark, user_city, user_state, user_pincode, user_country]
    .filter(Boolean)
    .join(", ");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Order Confirmation — Gauswarn</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: none;
      font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #fdf8f0;
    }

    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: none;
      max-width: 100%;
      outline: none;
      text-decoration: none;
    }

    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .content-cell {
        padding: 20px 12px !important;
      }
      .cart-table th, .cart-table td {
        padding: 8px 2px !important;
        font-size: 11px !important;
      }
      .order-info-td {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        border-right: none !important;
        border-bottom: 1px solid #f0e6d3 !important;
      }
      .order-info-td:last-child {
        border-bottom: none !important;
      }
    }
  </style>
</head>
<body style="background-color: #fdf8f0; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fdf8f0;">
    <tr>
      <td align="center" style="padding: 20px 8px;">
        <!-- Main Container -->
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: #8B6914; padding: 24px 16px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 4px; letter-spacing: 1px;">GAUSWARN</h1>
              <p style="color: #f5e6c8; font-size: 13px; margin: 0; letter-spacing: 2px;">PURE A2 GIR COW GHEE</p>
            </td>
          </tr>

          <!-- Success Icon + Message -->
          <tr>
            <td style="padding: 32px 16px 16px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" valign="middle" style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%;">
                    <span style="color: #ffffff; font-size: 30px; font-weight: bold; line-height: 60px; display: block; text-align: center;">✓</span>
                  </td>
                </tr>
              </table>
              <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 16px 0 8px;">Order Confirmed!</h2>
              <p style="color: #6b7280; font-size: 15px; margin: 0;">Thank you for your purchase, <strong style="color: #8B6914;">${user_name}</strong>!</p>
            </td>
          </tr>

          <!-- Order Info Bar -->
          <tr>
            <td style="padding: 0 16px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9ee; border-radius: 8px; border: 1px solid #f0e6d3;">
                <tr>
                  <td class="order-info-td" style="padding: 12px; text-align: center; border-right: 1px solid #f0e6d3;">
                    <p style="color: #9ca3af; font-size: 11px; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 1px;">Order ID</p>
                    <p style="color: #8B6914; font-size: 13px; font-weight: 600; margin: 0; word-break: break-all;">${order_id}</p>
                  </td>
                  <td class="order-info-td" style="padding: 12px; text-align: center; border-right: 1px solid #f0e6d3;">
                    <p style="color: #9ca3af; font-size: 11px; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 1px;">Date</p>
                    <p style="color: #4a3728; font-size: 13px; font-weight: 600; margin: 0;">${date}</p>
                  </td>
                  <td class="order-info-td" style="padding: 12px; text-align: center;">
                    <p style="color: #9ca3af; font-size: 11px; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 1px;">Payment ID</p>
                    <p style="color: #4a3728; font-size: 13px; font-weight: 600; margin: 0; word-break: break-all;">${payment_id}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td class="content-cell" style="padding: 16px;">
              <h3 style="color: #4a3728; font-size: 16px; font-weight: 600; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #8B6914;">🛒 Order Details</h3>
              <div style="overflow-x: auto;">
                <table class="cart-table" width="100%" cellpadding="0" cellspacing="0" style="min-width: 280px;">
                  <thead>
                    <tr>
                      <th style="padding: 8px 4px; text-align: left; color: #8B6914; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f0e6d3;">#</th>
                      <th style="padding: 8px 4px; text-align: left; color: #8B6914; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f0e6d3;">Product</th>
                      <th style="padding: 8px 4px; text-align: center; color: #8B6914; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f0e6d3;">Size</th>
                      <th style="padding: 8px 4px; text-align: center; color: #8B6914; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f0e6d3;">Qty</th>
                      <th style="padding: 8px 4px; text-align: right; color: #8B6914; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f0e6d3;">Price</th>
                      <th style="padding: 8px 4px; text-align: right; color: #8B6914; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f0e6d3;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cartItemsRows}
                  </tbody>
                </table>
              </div>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                <tr>
                  <td style="padding: 4px 8px; color: #6b7280; font-size: 13px;">Subtotal</td>
                  <td style="padding: 4px 8px; color: #4a3728; font-size: 13px; text-align: right;">₹${subtotal}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; color: #6b7280; font-size: 13px;">Shipping</td>
                  <td style="padding: 4px 8px; color: #22c55e; font-size: 13px; text-align: right; font-weight: 600;">FREE</td>
                </tr>
                ${discount > 0
      ? `<tr>
                  <td style="padding: 4px 8px; color: #6b7280; font-size: 13px;">Discount ${coupon_code ? `(${coupon_code})` : ""}</td>
                  <td style="padding: 4px 8px; color: #22c55e; font-size: 13px; text-align: right; font-weight: 600;">-₹${discount}</td>
                </tr>`
      : ""
    }
                <tr>
                  <td colspan="2" style="padding: 0;"><hr style="border: none; border-top: 2px solid #8B6914; margin: 8px 0;" /></td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #4a3728; font-size: 16px; font-weight: 700;">Total Paid</td>
                  <td style="padding: 8px; color: #8B6914; font-size: 18px; font-weight: 700; text-align: right;">₹${total_amount}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding: 0 16px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9ee; border-radius: 8px; border: 1px solid #f0e6d3; padding: 12px;">
                <tr>
                  <td style="padding: 12px;">
                    <h3 style="color: #4a3728; font-size: 14px; font-weight: 600; margin: 0 0 6px;">📦 Delivery Address</h3>
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;"><strong style="color: #4a3728;">${user_name}</strong></p>
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px; line-height: 1.4;">${fullAddress}</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 0;">📞 ${user_mobile_num} &nbsp;|&nbsp; ✉️ ${user_email}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 8px 16px 24px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background-color: #8B6914; border-radius: 6px;">
                    <a href="https://gauswarn.com/products" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: 'Poppins', sans-serif; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 600;">Continue Shopping →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer — Gauswarn Details -->
          <tr>
            <td style="background-color: #4a3728; padding: 24px 16px; text-align: center;">
              <p style="color: #c4993d; font-size: 15px; font-weight: 700; margin: 0 0 8px; letter-spacing: 1px;">GAUSWARN</p>
              <p style="color: #d4b896; font-size: 12px; margin: 0 0 4px; line-height: 1.4;">📍 11, Sapna Sangeeta Rd, Manish Baag Colony,</p>
              <p style="color: #d4b896; font-size: 12px; margin: 0 0 8px; line-height: 1.4;">New Agrawal Nagar, Indore, Madhya Pradesh 452001</p>
              <p style="color: #d4b896; font-size: 12px; margin: 0 0 4px;">📞 +91-96857-15905 &nbsp;|&nbsp; +91-74709-15905</p>
              <p style="color: #d4b896; font-size: 12px; margin: 0 0 16px;">✉️ gauswarn@gmail.com &nbsp;|&nbsp; info@gauswarn.com</p>
              <hr style="border: none; border-top: 1px solid #6b5a4a; margin: 0 0 12px;" />
              <p style="color: #9a8b7a; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Gauswarn India. All rights reserved.</p>
              <p style="color: #9a8b7a; font-size: 10px; margin: 4px 0 0;">This is an automated order confirmation email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = { orderConfirmationTemplate };
