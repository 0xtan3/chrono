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
    const MAX_DAILY_CRON_EMAILS = 60; // Preserves Resend 100/day & 3k/month free quota

    // Process users in chunks to respect rate limits and improve speed
    const chunkSize = 5;
    for (let i = 0; i < allStats.length; i += chunkSize) {
      if (emailsSent >= MAX_DAILY_CRON_EMAILS) {
        console.log(`Cron daily send cap (${MAX_DAILY_CRON_EMAILS}) reached. Conserving Resend free quota.`);
        break;
      }

      const chunk = allStats.slice(i, i + chunkSize);
      
      await Promise.allSettled(chunk.map(async (stat) => {
        const { userId, streak, lastActiveDate, timezone, streakFreezes } = stat;
        
        if (!lastActiveDate) return;
        
        // Standardize globally on UTC for the daily run
        const userTodayStr = today;
        
        if (lastActiveDate !== userTodayStr) {
          const lastActiveTime = new Date(lastActiveDate).getTime();
          const userTodayTime = new Date(userTodayStr).getTime();
          const daysSinceActive = Math.round((userTodayTime - lastActiveTime) / msPerDay);

          let subject = null;
          let bodyHtml = null;
          let shouldSend = false;
          let userFreezes = streakFreezes !== undefined ? streakFreezes : 1;

          if (streak > 0) {
            if (daysSinceActive === 1) {
              // Warning - sent at 20:00 UTC, they still have time depending on timezone
              subject = `Keep your ${streak}-day streak alive`;
              bodyHtml = `
                <h1 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 16px 0;">Your streak is at risk</h1>
                <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0 0 16px 0;">
                  You are about to lose your <strong>${streak}-day</strong> focus streak on Chrono.
                </p>
                <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0;">
                  Complete a quick session today to keep your momentum going.
                </p>
              `;
              shouldSend = true;
            } else if (daysSinceActive === 2) {
              // Missed a whole day - Apply Freeze or Reset
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
                    <h1 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 16px 0;">Streak Freeze activated</h1>
                    <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0 0 16px 0;">
                      You missed a session yesterday, but your Streak Freeze was automatically applied.
                    </p>
                    <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0;">
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
                    <h1 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 16px 0;">Streak reset</h1>
                    <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0 0 16px 0;">
                      You missed a session yesterday and your <strong>${streak}-day streak</strong> has been reset.
                    </p>
                    <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0;">
                      Consistency is key. Start a new streak today.
                    </p>
                  `;
                  shouldSend = true;
                } catch (e) { console.error('Reset error', e); }
              }
            }
          } else {
            // Streak is 0. User has missed >= 2 days of studying.
            // Conserve quota: Send immediately at Day 2, follow up at Day 4, and final call at Day 7.
            // This prevents inactive accounts from draining the 3k monthly cap.
            const isTargetInactivityDay = daysSinceActive === 2 || daysSinceActive === 4 || daysSinceActive === 7;
            if (isTargetInactivityDay) {
              subject = daysSinceActive === 2
                ? `Don't let 2 days slip by — lock in a session today`
                : `⚡ ${daysSinceActive} days without study — reignite your focus`;
              bodyHtml = `
                <h1 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 16px 0;">Don't let the standstill continue</h1>
                <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0 0 16px 0;">
                  You haven't logged a study session in <strong>${daysSinceActive} days</strong>.
                </p>
                <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0 0 16px 0;">
                  The hardest part is crossing the threshold to start. Just a quick session today will break the inertia and get your momentum back.
                </p>
                <p style="font-size:14px;line-height:1.6;color:#71717a;margin:0;">
                  Willpower is a myth. Protocol is a weapon.
                </p>
              `;
              shouldSend = true;
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

    // Note: Unverified users receive their verification email once upon registration
    // and can re-request on demand via /api/send-verification. We do NOT spam them daily.

    res.status(200).json({ success: true, emailsSent, emailsFailed, streaksReset });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({ error: error.message });
  }
}
