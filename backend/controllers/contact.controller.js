// controllers/contactController.js
const sendEmail = require('../utils/sendEmail');

const contactController = async (req, res) => {
  try {
    // 1. Extract form data
    const {
      name,
      email,
      company,
      phone,
      message,
      services,
      budget
    } = req.body;

    // 2. Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required fields"
      });
    }

    // Handle services if array
    const formattedServices = Array.isArray(services)
      ? services.join(", ")
      : services;

    // ============================
    // 📩 ADMIN EMAIL TEMPLATE
    // ============================
    const adminEmailContent = `
    <div style="background:#f4f6f8;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:650px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
        
        <div style="background:#111827;padding:24px;text-align:center;color:#fff;">
          <h1 style="margin:0;font-size:22px;color:#f59e0b;">New Automotive Inquiry</h1>
          <p style="margin:6px 0 0;font-size:14px;opacity:0.8;">
            Customer submitted a request
          </p>
        </div>

        <div style="padding:30px;">
          <h2 style="margin-top:0;color:#111;font-size:18px;">Customer Details</h2>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;font-weight:600;color:#555;width:150px;">Name</td>
              <td style="padding:10px 0;color:#111;">${name}</td>
            </tr>

            <tr style="border-top:1px solid #eee;">
              <td style="padding:10px 0;font-weight:600;color:#555;">Email</td>
              <td style="padding:10px 0;color:#111;">${email}</td>
            </tr>

            ${company ? `
            <tr style="border-top:1px solid #eee;">
              <td style="padding:10px 0;font-weight:600;color:#555;">Company</td>
              <td style="padding:10px 0;color:#111;">${company}</td>
            </tr>` : ''}

            ${phone ? `
            <tr style="border-top:1px solid #eee;">
              <td style="padding:10px 0;font-weight:600;color:#555;">Phone</td>
              <td style="padding:10px 0;color:#111;">${phone}</td>
            </tr>` : ''}

            ${formattedServices ? `
            <tr style="border-top:1px solid #eee;">
              <td style="padding:10px 0;font-weight:600;color:#555;">Services</td>
              <td style="padding:10px 0;color:#111;">${formattedServices}</td>
            </tr>` : ''}

            ${budget ? `
            <tr style="border-top:1px solid #eee;">
              <td style="padding:10px 0;font-weight:600;color:#555;">Budget</td>
              <td style="padding:10px 0;color:#111;">${budget}</td>
            </tr>` : ''}

          </table>

          <div style="margin-top:25px;">
            <h3 style="margin-bottom:10px;color:#111;">Message</h3>
            <div style="background:#f9fafb;border:1px solid #eee;border-radius:8px;padding:15px;">
              ${message}
            </div>
          </div>
        </div>

        <div style="background:#111827;padding:18px;text-align:center;font-size:12px;color:#aaa;">
          <p style="margin:0;">Automotive ERP System</p>
          <p style="margin:4px 0 0;">© ${new Date().getFullYear()}</p>
        </div>

      </div>
    </div>
    `;

    // ============================
    // 📩 USER AUTO-REPLY TEMPLATE
    // ============================
    const userEmailContent = `
    <div style="background:#f4f6f8;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:650px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
        
        <div style="background:#111827;padding:24px;text-align:center;">
          <h1 style="margin:0;font-size:22px;color:#f59e0b;">Thank You for Contacting Us</h1>
        </div>

        <div style="padding:30px;color:#333;">
          <p>Hi <strong>${name}</strong>,</p>

          <p style="line-height:1.6;">
            Thank you for reaching out to us regarding your automotive needs. 
            We have successfully received your inquiry.
          </p>

          <div style="background:#fff7ed;border:1px solid #fde68a;padding:15px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;color:#92400e;">
              Our team will contact you within <strong>24 hours</strong>.
            </p>
          </div>

          <p style="line-height:1.6;">
            If your request is urgent, feel free to reply to this email.
          </p>

          <p style="margin-top:25px;">
            Best Regards,<br/>
            <strong>Your Company Name</strong><br/>
            Automotive Support Team
          </p>
        </div>

        <div style="background:#111827;padding:18px;text-align:center;font-size:12px;color:#aaa;">
          <p style="margin:0;">We appreciate your trust in our services.</p>
          <p style="margin:4px 0 0;">© ${new Date().getFullYear()} Your Company</p>
        </div>

      </div>
    </div>
    `;

    // ============================
    // 🚀 SEND EMAILS
    // ============================

    // 1. Send to ADMIN
    await sendEmail({
      subject: `New Inquiry from ${name}${company ? ` (${company})` : ''}`,
      html: adminEmailContent,
      replyTo: email
    });

    // 2. Send AUTO-REPLY to USER
    await sendEmail({
      to: email,
      subject: "Thank you for contacting us 🚗",
      html: userEmailContent
    });

    // ============================
    // ✅ RESPONSE
    // ============================
    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully."
    });

  } catch (error) {
    console.error("Contact form error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later."
    });
  }
};

module.exports = contactController;