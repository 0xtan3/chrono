import { Client, Users } from 'node-appwrite';
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, userId, verifyUrl } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const API_KEY = process.env.APPWRITE_API_KEY;
    const RESEND_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

    if (!PROJECT_ID || !API_KEY || !RESEND_KEY) {
      throw new Error('Missing server credentials: VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, or RESEND_API_KEY.');
    }

    const client = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)
      .setKey(API_KEY);

    const users = new Users(client);
    const resend = new Resend(RESEND_KEY);

    let targetUserId = userId;
    let targetName = name || '';

    // If userId not provided (e.g. on resend), search user by email
    if (!targetUserId) {
      const userList = await users.list([`equal("email", ["${email}"])`]);
      if (userList.users && userList.users.length > 0) {
        targetUserId = userList.users[0].$id;
        targetName = userList.users[0].name || targetName;
      } else {
        return res.status(404).json({ error: 'No user found with the provided email address.' });
      }
    }

    // Generate secure 24-hour verification token
    const tokenObj = await users.createToken(targetUserId, 64, 86400);
    const secret = tokenObj.secret;

    const baseUrl = verifyUrl || 'https://chrono.tenazity.com/verify';
    const cleanVerifyUrl = `${baseUrl.replace(/\/$/, '')}?userId=${encodeURIComponent(targetUserId)}&secret=${encodeURIComponent(secret)}`;

    // Branded High-Conversion HTML Template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your CHRONO Account</title>
</head>
<body style="margin:0;padding:0;background-color:#080b12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e8ecff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#080b12;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:linear-gradient(145deg, #101424, #0d101d);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:40px 32px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.6);">
          <tr>
            <td align="center">
              <div style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#8b5cf6;margin-right:8px;box-shadow:0 0 12px #8b5cf6;"></div>
              <span style="font-size:22px;font-weight:900;letter-spacing:0.25em;color:#ffffff;text-transform:uppercase;">CHRONO</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 12px 0;">Verify Your Email</h1>
              <p style="font-size:15px;line-height:1.6;color:rgba(232,236,255,0.7);margin:0 0 28px 0;">
                Welcome${targetName ? `, <strong>${targetName}</strong>` : ''}! You are one step away from unlocking your Deep Work protocols, study streaks, and XP progression.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center">
              <a href="${cleanVerifyUrl}" style="display:inline-block;background:linear-gradient(135deg, #7c3aed, #4f46e5);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 34px;border-radius:999px;box-shadow:0 4px 20px rgba(124,58,237,0.4);">
                Verify Email Address ⚡
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="font-size:12px;color:rgba(232,236,255,0.4);line-height:1.5;margin:0;">
                Or copy and paste this link in your browser:<br>
                <a href="${cleanVerifyUrl}" style="color:#a78bfa;word-break:break-all;font-size:11px;">${cleanVerifyUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;">
              <p style="font-size:11px;color:rgba(232,236,255,0.3);margin:0;">
                This link expires in 24 hours. If you did not create a CHRONO account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send verification email via Resend
    let fromAddress = 'CHRONO <verify@chrono.tenazity.com>';
    try {
      await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: 'Verify your email for CHRONO ⚡',
        html: emailHtml,
      });
    } catch (e) {
      console.warn('Custom domain from failed, falling back to onboarding address:', e.message);
      await resend.emails.send({
        from: 'CHRONO <onboarding@resend.dev>',
        to: email,
        subject: 'Verify your email for CHRONO ⚡',
        html: emailHtml,
      });
    }

    return res.status(200).json({ success: true, message: 'Verification email sent successfully via Resend.' });
  } catch (err) {
    console.error('send-verification error:', err);
    return res.status(500).json({ error: err.message || 'Failed to dispatch verification email.' });
  }
}
