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

/**
 * Build a branded HTML email for streak notifications.
 */
function buildStreakEmail({ subject, bodyHtml }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <a href="https://chrono.tenazity.com" style="display:inline-block;background:linear-gradient(135deg, #7c3aed, #4f46e5);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:999px;box-shadow:0 4px 20px rgba(124,58,237,0.4);">
                Open CHRONO ⚡
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;">
              <p style="font-size:11px;color:rgba(232,236,255,0.3);margin:0;">
                You're receiving this because you have an active CHRONO account. Stay focused! 🧠
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
        try {
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: userTz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          userTodayStr = formatter.format(new Date());
        } catch (e) {
          userTodayStr = today;
        }
        
        if (lastActiveDate !== userTodayStr) {
          const lastActiveTime = new Date(lastActiveDate).getTime();
          const userTodayTime = new Date(userTodayStr).getTime();
          const daysSinceActive = Math.round((userTodayTime - lastActiveTime) / msPerDay);

          let subject = null;
          let bodyHtml = null;
          let shouldSend = false;

          if (streak > 0) {
            if (daysSinceActive === 1) {
              // About to lose streak
              subject = `🔥 Save your ${streak}-day streak!`;
              bodyHtml = `
                <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 12px 0;">Your Streak is at Risk! 🔥</h1>
                <p style="font-size:15px;line-height:1.6;color:rgba(232,236,255,0.7);margin:0 0 8px 0;">
                  You're about to lose your <strong style="color:#fbbf24;">${streak}-day</strong> CHRONO focus streak!
                </p>
                <p style="font-size:14px;line-height:1.6;color:rgba(232,236,255,0.5);margin:0;">
                  Complete a quick session today to keep it alive. Don't let your momentum fade.
                </p>
              `;
              shouldSend = true;
            } else if (daysSinceActive === 2) {
              // Lost (Check freezes first)
              if (userFreezes > 0) {
                try {
                  const userYesterdayTime = userTodayTime - msPerDay;
                  const userYesterdayStr = new Date(userYesterdayTime).toISOString().split('T')[0];
                  await databases.updateDocument(DB_ID, COL_ID, stat.$id, { 
                    streakFreezes: userFreezes - 1,
                    lastActiveDate: userYesterdayStr
                  });
                  subject = `🧊 Streak Freeze Activated!`;
                  bodyHtml = `
                    <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 12px 0;">Streak Freeze Activated! 🧊</h1>
                    <p style="font-size:15px;line-height:1.6;color:rgba(232,236,255,0.7);margin:0 0 8px 0;">
                      You missed a session yesterday, but your Streak Freeze automatically activated!
                    </p>
                    <p style="font-size:14px;line-height:1.6;color:rgba(232,236,255,0.5);margin:0;">
                      Your <strong style="color:#34d399;">${streak}-day streak</strong> is safe. Log a session today to keep it going!
                    </p>
                  `;
                  shouldSend = true;
                } catch (e) { console.error('Freeze error', e); }
              } else {
                try {
                  await databases.updateDocument(DB_ID, COL_ID, stat.$id, { streak: 0 });
                  streaksReset++;
                  subject = `💔 Your ${streak}-day streak was lost`;
                  bodyHtml = `
                    <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 12px 0;">Streak Lost 💔</h1>
                    <p style="font-size:15px;line-height:1.6;color:rgba(232,236,255,0.7);margin:0 0 8px 0;">
                      You missed a session yesterday and your <strong style="color:#f87171;">${streak}-day streak</strong> was reset.
                    </p>
                    <p style="font-size:14px;line-height:1.6;color:rgba(232,236,255,0.5);margin:0;">
                      Don't worry — every expert was once a beginner. Start a new streak today! 💪
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
                subject = `We miss you at CHRONO`;
                bodyHtml = `
                  <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 12px 0;">We Miss You! 👋</h1>
                  <p style="font-size:15px;line-height:1.6;color:rgba(232,236,255,0.7);margin:0 0 8px 0;">
                    It's been <strong style="color:#a78bfa;">${daysSinceActive} days</strong> since your last focus session.
                  </p>
                  <p style="font-size:14px;line-height:1.6;color:rgba(232,236,255,0.5);margin:0;">
                    We know building habits is tough, but we're here when you're ready. Jump back in and start building a new streak!
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

    res.status(200).json({ success: true, emailsSent, emailsFailed, streaksReset });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({ error: error.message });
  }
}
