import { Client, Users, Query } from 'node-appwrite';
import { Resend } from 'resend';

export default async function handler(req, res) {
  // Allow both GET and POST for flexibility (resend links can be GET)
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
    const RESEND_KEY = process.env.RESEND_API_KEY;

    if (!PROJECT_ID || !API_KEY || !RESEND_KEY) {
      console.error('Missing env vars:', { PROJECT_ID: !!PROJECT_ID, API_KEY: !!API_KEY, RESEND_KEY: !!RESEND_KEY });
      throw new Error('Missing server credentials. Check VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, and RESEND_API_KEY.');
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
      const userList = await users.list([Query.equal("email", email)]);
      if (userList.users && userList.users.length > 0) {
        targetUserId = userList.users[0].$id;
        targetName = userList.users[0].name || targetName;

        // If user is already verified, don't send again
        if (userList.users[0].emailVerification) {
          return res.status(200).json({ success: true, message: 'Email is already verified.', alreadyVerified: true });
        }
      } else {
        return res.status(404).json({ error: 'No user found with the provided email address.' });
      }
    }

    // Rate limiting: Check user prefs for last verification email timestamp
    try {
      const prefs = await users.getPrefs(targetUserId);
      const lastSent = prefs.lastVerificationSent || 0;
      const now = Date.now();
      const cooldownMs = 60 * 1000; // 60 second cooldown

      if (now - lastSent < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
        return res.status(429).json({
          error: `Please wait ${waitSec} seconds before requesting another verification email.`,
          retryAfter: waitSec,
        });
      }
    } catch (e) {
      // If prefs fail, continue anyway — don't block verification
      console.warn('Rate limit check failed (non-blocking):', e.message);
    }

    // Generate a verification token via Appwrite's createToken API
    // This creates a secure server-side token with a 24-hour expiry
    const tokenObj = await users.createToken(targetUserId, 64, 86400);
    const secret = tokenObj.secret;

    if (!secret) {
      throw new Error('Token creation succeeded but no secret was returned. This may be an Appwrite version issue.');
    }

    // Build verification URL
    let baseUrl;
    if (verifyUrl) {
      baseUrl = verifyUrl;
    } else if (process.env.VITE_APP_URL) {
      baseUrl = `${process.env.VITE_APP_URL.replace(/\/$/, '')}/verify`;
    } else {
      baseUrl = 'https://chrono.tenazity.com/verify';
    }
    const cleanVerifyUrl = `${baseUrl}?userId=${encodeURIComponent(targetUserId)}&secret=${encodeURIComponent(secret)}`;

    // Branded HTML Email Template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your CHRONO Account</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:40px 32px;text-align:left;">
          <tr>
            <td style="padding-bottom:24px;border-bottom:1px solid #f3f4f6;">
              <span style="font-size:18px;font-weight:800;letter-spacing:0.1em;color:#111827;">CHRONO</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;">
              <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px 0;">Verify your email address</h1>
              <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 32px 0;">
                Hi${targetName ? ` ${targetName}` : ''},<br><br>
                Welcome to Chrono. To complete your registration and secure your account, please verify your email address.
              </p>
            </td>
          </tr>
          <tr>
            <td>
              <a href="${cleanVerifyUrl}" style="display:inline-block;background-color:#111827;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;">
                Verify Email
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;">
              <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:0;">
                Or copy and paste this link into your browser:<br>
                <a href="${cleanVerifyUrl}" style="color:#2563eb;word-break:break-all;">${cleanVerifyUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;margin-top:32px;border-top:1px solid #f3f4f6;">
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                If you didn't request this email, you can safely ignore it. This link will expire in 24 hours.
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
    // Try custom domain first, fall back to onboarding@resend.dev (free tier)
    let emailSent = false;
    let sendError = null;

    const customFrom = 'CHRONO <verify@chrono.tenazity.com>';
    const fallbackFrom = 'CHRONO <onboarding@resend.dev>';

    try {
      const result = await resend.emails.send({
        from: customFrom,
        to: email,
        subject: 'Verify your email for CHRONO ⚡',
        html: emailHtml,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Resend API returned an error');
      }

      emailSent = true;
      console.log('Verification email sent via custom domain to:', email);
    } catch (e) {
      console.warn('Custom domain send failed, trying fallback:', e.message);
      sendError = e;
    }

    if (!emailSent) {
      try {
        const result = await resend.emails.send({
          from: fallbackFrom,
          to: email,
          subject: 'Verify your email for CHRONO ⚡',
          html: emailHtml,
        });

        if (result.error) {
          throw new Error(result.error.message || 'Resend fallback also failed');
        }

        emailSent = true;
        console.log('Verification email sent via fallback (onboarding@resend.dev) to:', email);
      } catch (e2) {
        console.error('Both custom and fallback email sends failed.');
        console.error('Custom domain error:', sendError?.message);
        console.error('Fallback error:', e2.message);
        throw new Error(`Custom domain failed: ${sendError?.message}. Fallback also failed: ${e2.message}`);
      }
    }

    // Update rate limit timestamp in user prefs
    try {
      const existingPrefs = await users.getPrefs(targetUserId);
      await users.updatePrefs(targetUserId, {
        ...existingPrefs,
        lastVerificationSent: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to update rate limit prefs (non-blocking):', e.message);
    }

    return res.status(200).json({ success: true, message: 'Verification email sent successfully.' });
  } catch (err) {
    console.error('send-verification error:', err);
    return res.status(500).json({ error: err.message || 'Failed to dispatch verification email.' });
  }
}
