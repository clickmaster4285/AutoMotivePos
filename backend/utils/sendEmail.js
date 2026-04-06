require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async ({ to, replyTo, subject, html }) => {

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: true },
  });

  // Debug connection
  transporter.verify((error) => {
    if (error) {
      console.error('SMTP verify failed:', error);
    } else {
      console.log('SMTP connection looks good');
    }
  });

  const mailOptions = {
    // This sets the sender as Sales Team
    from: `"${process.env.ALIAS_NAME || 'Sales Team'}" <${process.env.ALIAS_EMAIL}>`,
    to: to || process.env.RECEIVER_EMAIL,
    // This ensures replies go to the person who submitted
    replyTo: replyTo || '',
    subject,
    html,
    // Additional headers to ensure proper sender
    headers: {
      'X-Sender-Email': process.env.ALIAS_EMAIL,
    }
  };

  try {
  
    const info = await transporter.sendMail(mailOptions);
  
    return info;
  } catch (err) {
    console.error('Send email failed:', err.message);
    console.error('Full error:', err);
    throw err;
  }
};

module.exports = sendEmail;
