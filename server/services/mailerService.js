const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const nodemailer = require('nodemailer');

let mailTransporter = null;

async function initMailer() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const isGmail = process.env.SMTP_HOST.includes('gmail');
    mailTransporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 5000,
            auth: {
              user: process.env.SMTP_USER,
              pass: (process.env.SMTP_PASS || '').trim()
            }
          }
        : {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 5000,
            auth: {
              user: process.env.SMTP_USER,
              pass: (process.env.SMTP_PASS || '').trim()
            }
          }
    );
    console.log(`📧 [CYPR Mailer] Configured custom SMTP server for ${process.env.SMTP_USER}`);
  } else {

    try {
      const testAccount = await nodemailer.createTestAccount();
      mailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`📧 [CYPR Mailer] Initialized Ethereal Mailer (${testAccount.user})`);
    } catch (err) {
      console.warn('⚠️ Could not initialize Ethereal mailer, fallback to console log mode:', err.message);
    }
  }
}

/**
 * Send OTP via Resend API or SMTP
 */
async function sendEmailOtp(toEmail, otpCode) {
  const htmlContent = `
    <div style="background-color: #0b0806; color: #ffffff; padding: 40px 20px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; text-align: center; border-radius: 20px;">
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 28px; font-weight: 900; color: #ffffff; margin: 0;">❤️ CYPR <span style="color: #ff5500;">ViAM</span></h1>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Synchronized Co-Watching Lounge for Couples</p>
      </div>

      <div style="background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,85,0,0.4); border-radius: 24px; padding: 32px; max-width: 440px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
        <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 8px;">Verify Your Email Address</h2>
        <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 24px; line-height: 1.5;">Enter the following 6-digit One-Time Password (OTP) to complete your account setup:</p>
        
        <div style="background: #120e0b; border: 2px solid #ff5500; border-radius: 16px; padding: 18px; display: inline-block; width: 80%; margin-bottom: 24px; box-shadow: 0 0 25px rgba(255,85,0,0.4);">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ff5500; font-family: monospace;">${otpCode}</span>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin: 0;">This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
      </div>

      <div style="margin-top: 32px; font-size: 12px; color: #64748b;">
        <p>© 2026 CYPR ViAM Inc. • AES-256 E2EE Cryptography Engine</p>
      </div>
    </div>
  `;

  // 1. Try Brevo REST API (300 free emails/day to ANY email address over HTTPS Port 443)
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER || 'internet.vineet@gmail.com';
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'CYPR ViAM', email: senderEmail },
          to: [{ email: toEmail }],
          subject: `🔒 Your CYPR ViAM OTP Code: ${otpCode}`,
          htmlContent: htmlContent
        })
      });

      const resData = await res.json();
      if (res.ok && resData && resData.messageId) {
        console.log(`🚀 [CYPR Mailer via Brevo] Delivered OTP email to ${toEmail} (ID: ${resData.messageId})`);
        return { success: true, id: resData.messageId, provider: 'brevo' };
      } else {
        console.warn(`⚠️ [Brevo API Notice]:`, resData?.message || resData);
      }
    } catch (brevoErr) {
      console.warn(`⚠️ [Brevo Error]: ${brevoErr.message}`);
    }
  }

  // 2. Try Resend API (works reliably on Render/cloud port 443 HTTPS)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const fromAddress = process.env.RESEND_FROM || 'CYPR ViAM <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject: `🔒 Your CYPR ViAM OTP Code: ${otpCode}`,
          html: htmlContent
        })
      });

      const resData = await res.json();
      if (res.ok && resData && resData.id) {
        console.log(`🚀 [CYPR Mailer via Resend] Successfully delivered OTP email to ${toEmail} (ID: ${resData.id})`);
        return { success: true, id: resData.id, provider: 'resend' };
      } else {
        console.warn(`⚠️ [Resend API Notice]:`, resData?.message || resData);
      }
    } catch (resendErr) {
      console.warn(`⚠️ [Resend Error]: ${resendErr.message}`);
    }
  }

  // 2. Fallback to Nodemailer SMTP
  if (!mailTransporter) {
    await initMailer();
  }

  if (mailTransporter) {
    try {
      const defaultFrom = process.env.SMTP_USER ? `"CYPR ViAM" <${process.env.SMTP_USER}>` : '"CYPR ViAM Private Lounge" <no-reply@cypr.com>';
      const mailOptions = {
        from: process.env.SMTP_FROM || defaultFrom,
        to: toEmail,
        subject: `🔒 Your CYPR ViAM OTP Code: ${otpCode}`,
        html: htmlContent
      };

      const sendPromise = mailTransporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP connection timed out (Render free tier blocks ports 25, 465, 587)')), 4000)
      );
      const info = await Promise.race([sendPromise, timeoutPromise]);

      console.log(`📧 [CYPR Mailer] OTP Email sent to ${toEmail} (MsgID: ${info.messageId})`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 [CYPR Mailer Preview] Direct Email View URL: ${previewUrl}`);
      }
      return { info, previewUrl, provider: 'nodemailer' };
    } catch (smtpErr) {
      console.warn(`⚠️ [SMTP Error]:`, smtpErr.message);
    }
  }

  return { simulated: true, otp: otpCode };
}

initMailer();

module.exports = {
  sendEmailOtp
};
