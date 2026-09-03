import { Resend } from "resend";
import nodemailer from "nodemailer";

const FROM_EMAIL = process.env.SMTP_FROM || process.env.EMAIL_FROM || "UNCOOKED <support@uncooked.in>";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || "support@uncooked.in";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Helper to wrap content in a unified modern dark email template
function buildEmailTemplate({ title, preheader, bodyHtml, actionButton }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0a0a0c;
      color: #e4e4e7;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #121216;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    .logo-badge {
      display: inline-block;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin-bottom: 24px;
      text-decoration: none;
    }
    .logo-highlight {
      color: #ff6b00;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #a1a1aa;
      margin: 0 0 20px 0;
    }
    .btn {
      display: inline-block;
      background-color: #ff6b00;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 10px;
      text-decoration: none;
      margin: 20px 0;
      text-align: center;
      transition: background-color 0.2s;
    }
    .btn:hover {
      background-color: #e05e00;
    }
    .code-box {
      background-color: #1c1c22;
      border: 1px dashed #3f3f46;
      border-radius: 10px;
      padding: 16px;
      font-family: monospace;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #ff6b00;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 12px;
      color: #71717a;
    }
    .footer a {
      color: #a1a1aa;
      text-decoration: underline;
    }
    .divider {
      height: 1px;
      background-color: #27272a;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <a href="${APP_URL}" class="logo-badge">
        UN<span class="logo-highlight">COOKED</span>
      </a>
      ${bodyHtml}
      ${actionButton ? `<div style="text-align: center;">${actionButton}</div>` : ""}
      <div class="divider"></div>
      <p style="font-size: 13px; color: #71717a; margin-bottom: 0;">
        If you did not initiate this request, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Uncooked Portal. All rights reserved.</p>
      <p><a href="${APP_URL}/privacy">Privacy Policy</a> &bull; <a href="${APP_URL}/help">Support Desk</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

// Master email sender method supporting Resend, Nodemailer SMTP, or Console Fallback
export async function sendEmail({ to, subject, html, text }) {
  // 1. Try Resend API if API Key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const data = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text,
      });
      console.log(`[EmailService] Sent via Resend to ${to}:`, data.id);
      return { success: true, provider: "resend", id: data.id };
    } catch (err) {
      console.error(`[EmailService] Resend failed, trying fallback:`, err.message);
    }
  }

  // 2. Try Nodemailer SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text,
      });
      console.log(`[EmailService] Sent via SMTP to ${to}:`, info.messageId);
      return { success: true, provider: "smtp", id: info.messageId };
    } catch (err) {
      console.error(`[EmailService] SMTP send failed:`, err.message);
    }
  }

  // 3. Fallback: Log email details cleanly in dev/test mode
  console.log(`\n=================== [DEV EMAIL DISPATCH] ===================`);
  console.log(`To: ${to}`);
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text Body: ${text || "(HTML content provided)"}`);
  console.log(`============================================================\n`);

  return { success: true, provider: "mock-dev-console" };
}

/**
 * 1. Email Verification
 */
export async function sendVerificationEmail({ email, name, token, verificationUrl }) {
  const url = verificationUrl || `${APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = buildEmailTemplate({
    title: "Verify Your Email Address - Uncooked",
    bodyHtml: `
      <h1>Welcome to Uncooked, ${name || "Creator"}! 🎉</h1>
      <p>Please verify your email address to unlock full access to events, organizer applications, and campus opportunities.</p>
      <div class="code-box">${token.slice(0, 6).toUpperCase()}</div>
      <p>Click the button below to verify your account instantly. This link expires in 24 hours.</p>
    `,
    actionButton: `<a href="${url}" class="btn">Verify Email Address</a>`,
  });

  const text = `Hi ${name || "User"},\n\nPlease verify your email address by visiting this URL: ${url}\n\nVerification Code: ${token.slice(0, 6).toUpperCase()}`;

  return sendEmail({
    to: email,
    subject: "Verify Your Email Address — Uncooked Portal",
    html,
    text,
  });
}

/**
 * 2. Password Reset
 */
export async function sendPasswordResetEmail({ email, name, token, resetUrl }) {
  const url = resetUrl || `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const html = buildEmailTemplate({
    title: "Reset Your Password - Uncooked",
    bodyHtml: `
      <h1>Password Reset Request 🔐</h1>
      <p>Hi ${name || "there"}, we received a request to reset the password for your account associated with <strong>${email}</strong>.</p>
      <p>Click the button below to choose a new password. This reset link will expire in 1 hour.</p>
    `,
    actionButton: `<a href="${url}" class="btn">Reset Password</a>`,
  });

  const text = `Hi ${name || "User"},\n\nYou requested a password reset. Please use the following link to reset your password (expires in 1 hour):\n${url}`;

  return sendEmail({
    to: email,
    subject: "Reset Your Password — Uncooked Portal",
    html,
    text,
  });
}

/**
 * 3. Support Ticket Updates & Notifications
 */
export async function sendSupportTicketNotification({ to, ticketId, subject, category, message, senderName, isReply }) {
  const title = isReply ? `Response on Support Ticket #${ticketId.slice(-6)}` : `Support Ticket Received #${ticketId.slice(-6)}`;
  const portalUrl = `${APP_URL}/admin/support`;

  const html = buildEmailTemplate({
    title,
    bodyHtml: `
      <h1>${title} 🎫</h1>
      <p><strong>Category:</strong> ${category || "General"}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>From:</strong> ${senderName || "Support Agent"}</p>
      <div style="background-color: #1a1a20; border-left: 4px solid #ff6b00; padding: 16px; border-radius: 8px; margin: 16px 0; color: #d4d4d8;">
        ${message.replace(/\n/g, "<br/>")}
      </div>
      <p>You can check ticket updates anytime on your support desk dashboard.</p>
    `,
    actionButton: `<a href="${portalUrl}" class="btn">View Support Desk</a>`,
  });

  const text = `Support Ticket #${ticketId}\nSubject: ${subject}\nFrom: ${senderName}\n\n${message}`;

  return sendEmail({
    to,
    subject: `${title}: ${subject}`,
    html,
    text,
  });
}

/**
 * 4. Admin Broadcast & Direct Announcements
 */
export async function sendAdminBroadcastEmail({ to, subject, message, mediaUrl, senderName }) {
  const mediaHtml = mediaUrl ? `
    <div style="margin: 20px 0; text-align: center;">
      <img src="${mediaUrl}" alt="Announcement Banner" style="max-width: 100%; max-height: 320px; border-radius: 12px; border: 1px solid #27272a; object-fit: cover;" />
    </div>
  ` : "";

  const html = buildEmailTemplate({
    title: subject,
    bodyHtml: `
      <h1>📢 Announcement from ${senderName || "Uncooked Admin"}</h1>
      ${mediaHtml}
      <div style="font-size: 15px; line-height: 1.7; color: #d4d4d8; margin: 20px 0;">
        ${message.replace(/\n/g, "<br/>")}
      </div>
    `,
    actionButton: `<a href="${APP_URL}/dashboard" class="btn">Open Portal</a>`,
  });

  return sendEmail({
    to,
    subject: `[Announcement] ${subject}`,
    html,
    text: message,
  });
}

/**
 * 5. Contact Form Notifications & Auto-Replies
 */
export async function sendContactNotification({ name, email, category, message }) {
  // Send notification to Support Desk team
  const adminHtml = buildEmailTemplate({
    title: `New Contact Form Inquiry: ${category}`,
    bodyHtml: `
      <h1>New Support/Contact Inquiry 📬</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Category:</strong> ${category}</p>
      <div style="background-color: #1a1a20; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 16px 0; color: #d4d4d8;">
        ${message.replace(/\n/g, "<br/>")}
      </div>
    `,
    actionButton: `<a href="mailto:${email}?subject=Re:%20${encodeURIComponent(category)}%20Inquiry" class="btn">Reply to User</a>`,
  });

  await sendEmail({
    to: SUPPORT_EMAIL,
    subject: `[Inquiry] ${category} from ${name}`,
    html: adminHtml,
    text: `From: ${name} (${email})\nCategory: ${category}\n\n${message}`,
  });

  // Send Auto-Reply to user
  const userHtml = buildEmailTemplate({
    title: "We Received Your Message - Uncooked",
    bodyHtml: `
      <h1>We've Got Your Message, ${name}! 👋</h1>
      <p>Thank you for reaching out regarding <strong>${category}</strong>. Our team has received your message and will get back to you within 24 hours.</p>
      <div style="background-color: #18181b; padding: 14px; border-radius: 8px; font-size: 13px; color: #a1a1aa;">
        <strong>Your message excerpt:</strong><br/>
        "${message.slice(0, 150)}${message.length > 150 ? "..." : ""}"
      </div>
    `,
  });

  return sendEmail({
    to: email,
    subject: "We received your message — Uncooked Portal",
    html: userHtml,
    text: `Hi ${name},\n\nWe received your message regarding ${category} and will reply shortly!`,
  });
}
