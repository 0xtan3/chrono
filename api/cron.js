import { Client, Users, Databases, Query } from 'node-appwrite';
import { Resend } from 'resend';

/**
 * Send email via Resend with automatic fallback from custom domain to onboarding@resend.dev.
 */
async function sendEmailWithFallback(resend, { to, subject, html }) {
  const customFrom = 'Chrono <reminders@chrono.tenazity.com>';
  const fallbackFrom = 'Chrono <onboarding@resend.dev>';

  try {
    const result = await resend.emails.send({ from: customFrom, to, subject, html });
    if (result.error) throw new Error(result.error.message);
    return true;
  } catch (e) {
    console.warn(`Custom domain failed for ${to}, using fallback:`, e.message);
    try {
      const result = await resend.emails.send({ from: fallbackFrom, to, subject, html });
      if (result.error) throw new Error(result.error.message);
      return true;
    } catch (e2) {
      console.error(`Both send attempts failed for ${to}:`, e2.message);
      return false;
    }
  }
}

function buildStreakEmail({ subject, bodyHtml }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#06080F;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e8ecff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#06080F;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:linear-gradient(145deg, #101424, #0b0d18);border:1px solid rgba(124, 58, 237, 0.2);border-radius:16px;padding:40px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.5), inset 0 0 40px rgba(124, 58, 237, 0.05);">
          <tr>
            <td style="padding-bottom:30px;">
              <span style="font-size:22px;font-weight:900;letter-spacing:0.15em;color:#fff;text-shadow:0 0 20px rgba(124, 58, 237, 0.8);">CHRONO</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:10px;text-align:center;font-size:16px;line-height:1.6;color:#a1a1aa;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding-top:40px;">
              <a href="https://chrono.tenazity.com" style="display:inline-block;background:linear-gradient(135deg, #7c3aed, #a855f7);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;letter-spacing:0.02em;box-shadow:0 4px 15px rgba(124, 58, 237, 0.4);">
                ENTER THE MATRIX
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-top:40px;border-top:1px solid rgba(255,255,255,0.05);margin-top:40px;">
              <p style="font-size:12px;color:#52525b;margin:0;line-height:1.5;">
                You're receiving this because you're actively building a focus habit on Chrono.<br>
                Keep the momentum going.
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
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized. Invalid CRON_SECRET.' });
  }

  try {
    console.log('Initiating Chrono Email Reminders Cron Job...');
    
    const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
    const API_KEY = process.env.APPWRITE_API_KEY; 
    const DB_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'focus_timer_db';
    const COL_ID = process.env.VITE_APPWRITE_COLLECTION_ID || 'user_stats';
    const RESEND_KEY = process.env.RESEND_API_KEY;

    if (!PROJECT_ID || !API_KEY || !RESEND_KEY) {
      throw new Error('Missing critical environment variables: PROJECT_ID, APPWRITE_API_KEY, or RESEND_API_KEY.');
    }

    const client = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)
      .setKey(API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);
    const resend = new Resend(RESEND_KEY);

    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];
    const msPerDay = 1000 * 60 * 60 * 24;

    let offset = 0;
    const limit = 100;
    let allStats = [];

    while (true) {
      const response = await databases.listDocuments(DB_ID, COL_ID, [
        Query.limit(limit),
        Query.offset(offset)
      ]);
      allStats.push(...response.documents);
      if (response.documents.length < limit) break;
      offset += limit;
    }

    let emailsSent = 0;
    let streaksReset = 0;
    let emailsFailed = 0;

    // Process users in chunks to respect rate limits and improve speed
    const chunkSize = 5;
    for (let i = 0; i < allStats.length; i += chunkSize) {
      const chunk = allStats.slice(i, i + chunkSize);
      
      await Promise.allSettled(chunk.map(async (stat) => {
        const { userId, streak, lastActiveDate, timezone, streakFreezes } = stat;
        
        if (!lastActiveDate) return;

        const userTz = timezone || 'UTC';
        let userFreezes = streakFreezes !== undefined ? streakFreezes : 1;
        
        let userTodayStr = today;
        let localHour = 0;
        try {
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: userTz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            hourCycle: 'h23'
          });
          const parts = formatter.formatToParts(new Date());
          let y, m, d;
          for (const part of parts) {
            if (part.type === 'year') y = part.value;
            if (part.type === 'month') m = part.value;
            if (part.type === 'day') d = part.value;
            if (part.type === 'hour') localHour = parseInt(part.value, 10);
          }
          userTodayStr = `${y}-${m}-${d}`;
        } catch (e) {
          userTodayStr = today;
          localHour = new Date().getUTCHours();
        }
        
        if (lastActiveDate !== userTodayStr) {
          const lastActiveTime = new Date(lastActiveDate).getTime();
          const userTodayTime = new Date(userTodayStr).getTime();
          const daysSinceActive = Math.round((userTodayTime - lastActiveTime) / msPerDay);

          let subject = null;
          let bodyHtml = null;
          let shouldSend = false;

          if (streak > 0) {
            if (daysSinceActive === 1 && localHour === 20) {
              // About to lose streak
              subject = `Keep your ${streak}-day streak alive`;
              bodyHtml = `
                <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px 0;">Your streak is at risk</h1>
                <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 16px 0;">
                  You are about to lose your <strong>${streak}-day</strong> focus streak on Chrono.
                </p>
                <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0;">
                  Complete a quick session today to keep your momentum going.
                </p>
              `;
              shouldSend = true;
            } else if (daysSinceActive === 2 && localHour === 1) {
              // Lost (Check freezes first)
              if (userFreezes > 0) {
                try {
                  const userYesterdayTime = userTodayTime - msPerDay;
                  const userYesterdayStr = new Date(userYesterdayTime).toISOString().split('T')[0];
                  await databases.updateDocument(DB_ID, COL_ID, stat.$id, { 
                    streakFreezes: userFreezes - 1,
                    lastActiveDate: userYesterdayStr
                  });
                  subject = `Streak Freeze activated`;
                  bodyHtml = `
                    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px 0;">Streak Freeze activated</h1>
                    <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 16px 0;">
                      You missed a session yesterday, but your Streak Freeze was automatically applied.
                    </p>
                    <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0;">
                      Your <strong>${streak}-day streak</strong> has been protected. Log a session today to keep it going.
                    </p>
                  `;
                  shouldSend = true;
                } catch (e) { console.error('Freeze error', e); }
              } else {
                try {
                  await databases.updateDocument(DB_ID, COL_ID, stat.$id, { streak: 0 });
                  streaksReset++;
                  subject = `Your ${streak}-day streak was reset`;
                  bodyHtml = `
                    <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px 0;">Streak reset</h1>
                    <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 16px 0;">
                      You missed a session yesterday and your <strong>${streak}-day streak</strong> has been reset.
                    </p>
                    <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0;">
                      Consistency is key. Start a new streak today.
                    </p>
                  `;
                  shouldSend = true;
                } catch (e) { console.error('Reset error', e); }
              }
            }
          } else {
            // Streak is 0. Check for 2^N days if they missed more than 2 days.
            if (daysSinceActive > 2) {
              const isPowerOfTwo = (Math.log2(daysSinceActive) % 1 === 0);
              if (isPowerOfTwo) {
                subject = `Ready to get back to it?`;
                bodyHtml = `
                  <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px 0;">It's been a while</h1>
                  <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 16px 0;">
                    It has been <strong>${daysSinceActive} days</strong> since your last focus session.
                  </p>
                  <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0;">
                    Whenever you are ready, jump back in and start building a new habit.
                  </p>
                `;
                shouldSend = true;
              }
            }
          }

          if (shouldSend && subject && bodyHtml) {
            try {
              const user = await users.get(userId);
              if (user && user.email && user.emailVerification) {
                const html = buildStreakEmail({ subject, bodyHtml });
                const sent = await sendEmailWithFallback(resend, {
                  to: user.email,
                  subject,
                  html,
                });
                if (sent) {
                  emailsSent++;
                  console.log(`Email sent to ${user.email}: ${subject}`);
                } else {
                  emailsFailed++;
                }
              }
            } catch (e) {
              emailsFailed++;
              console.error(`Failed to send email to user ${userId}`, e);
            }
          }
        }
      }));
      // Add a small delay between chunks to respect rate limits (e.g. 10/sec for Resend)
      await new Promise(r => setTimeout(r, 600));
    }

    // ── 2. UNVERIFIED USER REMINDERS ──────────────────────────────────────
    let unverifiedRemindersSent = 0;
    
    try {
      let usersOffset = 0;
      const usersLimit = 100;
      let allUsers = [];

      while (true) {
        const userList = await users.list([
          Query.limit(usersLimit),
          Query.offset(usersOffset)
        ]);
        allUsers.push(...userList.users);
        if (userList.users.length < usersLimit) break;
        usersOffset += usersLimit;
      }

      const unverifiedUsers = allUsers.filter(u => !u.emailVerification);

      for (let i = 0; i < unverifiedUsers.length; i += chunkSize) {
        const chunk = unverifiedUsers.slice(i, i + chunkSize);

        await Promise.allSettled(chunk.map(async (u) => {
          try {
            const prefs = await users.getPrefs(u.$id);
            const lastSent = prefs.lastVerificationSent || 0;
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;

            // If we haven't sent a verification email in the last 24 hours
            if (now - lastSent > oneDayMs) {
              // Generate token
              const tokenObj = await users.createToken(u.$id, 64, 86400);
              const secret = tokenObj.secret;
              if (!secret) return;

              // Build URL
              const baseUrl = process.env.VITE_APP_URL
                ? `${process.env.VITE_APP_URL.replace(/\/$/, '')}/verify`
                : 'https://chrono.tenazity.com/verify';
              const cleanVerifyUrl = `${baseUrl}?userId=${encodeURIComponent(u.$id)}&secret=${encodeURIComponent(secret)}`;

              // Clean verification template
              const emailHtml = `<!DOCTYPE html>
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
                Hi${u.name ? ` ${u.name}` : ''},<br><br>
                Welcome to Chrono. We noticed you haven't verified your email yet. Please verify your email address to secure your account.
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
</html>`;

              const sent = await sendEmailWithFallback(resend, {
                to: u.email,
                subject: 'Verify your email for CHRONO',
                html: emailHtml,
              });

              if (sent) {
                unverifiedRemindersSent++;
                console.log(`Unverified reminder sent to ${u.email}`);
                await users.updatePrefs(u.$id, {
                  ...prefs,
                  lastVerificationSent: now,
                });
              }
            }
          } catch (e) {
            console.error(`Failed to process unverified user ${u.$id}`, e);
          }
        }));
        await new Promise(r => setTimeout(r, 600));
      }
    } catch (e) {
      console.error('Error processing unverified users:', e);
    }

    res.status(200).json({ success: true, emailsSent, emailsFailed, streaksReset, unverifiedRemindersSent });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({ error: error.message });
  }
}
