const pool = require('../config/db');
const nodemailer = require('nodemailer');

const sendContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Vui lòng cung cấp đầy đủ thông tin: Họ tên, Email, Tiêu đề và Nội dung tin nhắn.' 
    });
  }

  try {
    // 1. Lưu thông tin liên hệ vào cơ sở dữ liệu PostgreSQL
    const dbResult = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, email, subject, message]
    );

    const savedMessage = dbResult.rows[0];

    // 2. Gửi Email thông qua Nodemailer
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const receiverEmail = process.env.RECEIVER_EMAIL || 'lienhe@bookshop.com';

    let emailSent = false;
    let emailStatusInfo = '';

    if (emailUser && emailPass) {
      // Cấu hình SMTP
      const transporter = nodemailer.createTransport({
        service: 'gmail', // Hoặc dùng host/port nếu dùng dịch vụ khác
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });

      const mailOptions = {
        from: `"${name} (BookShop Customer)" <${emailUser}>`,
        to: receiverEmail,
        replyTo: email, // Giúp bạn bấm "Reply" là gửi trực tiếp cho khách hàng
        subject: `[BookShop Contact] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #1e1e2e 0%, #2d2b55 100%); padding: 24px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 22px;">📚 Đơn Liên Hệ Mới</h2>
              <p style="margin: 4px 0 0 0; color: #cba6f7; font-size: 14px;">Bạn có tin nhắn mới từ khách hàng BookShop</p>
            </div>
            <div style="padding: 24px; background: #ffffff; color: #334155; line-height: 1.6;">
              <p><strong>Họ và tên:</strong> ${name}</p>
              <p><strong>Email khách hàng:</strong> <a href="mailto:${email}" style="color: #6c5ce7; text-decoration: none;">${email}</a></p>
              <p><strong>Tiêu đề:</strong> ${subject}</p>
              <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;">
              <p><strong>Nội dung tin nhắn:</strong></p>
              <div style="background: #f7fafc; border-left: 4px solid #6c5ce7; padding: 16px; border-radius: 4px; color: #4a5568; font-style: italic; white-space: pre-wrap;">
                ${message}
              </div>
            </div>
            <div style="background: #f7fafc; padding: 16px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7;">
              Hệ thống liên hệ tự động - BookShop &copy; ${new Date().getFullYear()}
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      emailStatusInfo = `Đã gửi mail thành công tới: ${receiverEmail}`;
      console.log(`✉️ Email liên hệ mới từ [${email}] đã được gửi tới [${receiverEmail}]`);
    } else {
      // Demo giả lập nếu chưa có SMTP
      emailStatusInfo = 'SMTP chưa được cấu hình. Tin nhắn đã được lưu vào database và in ra console.';
      console.log('\n--- ✉️ ĐƠN LIÊN HỆ MỚI (LƯU DATABASE) ---');
      console.log(`Họ tên: ${name}`);
      console.log(`Email khách: ${email}`);
      console.log(`Tiêu đề: ${subject}`);
      console.log(`Nội dung: ${message}`);
      console.log('-------------------------------------------\n');
    }

    return res.status(200).json({
      status: 'success',
      message: 'Tin nhắn liên hệ của bạn đã được gửi thành công!',
      data: {
        id: savedMessage.id,
        created_at: savedMessage.created_at,
        email_sent: emailSent,
        info: emailStatusInfo
      }
    });

  } catch (err) {
    console.error('❌ Lỗi xử lý gửi liên hệ:', err.message);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server nội bộ. Vui lòng thử lại sau ít phút.',
      error: err.message
    });
  }
};

module.exports = {
  sendContactMessage
};
