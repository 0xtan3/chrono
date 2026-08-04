import { Client, Users, Databases, Query } from 'node-appwrite';
import { Resend } from 'resend';

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

    const client = new Client();
    client
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)
      .setKey(API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);
    const resend = new Resend(RESEND_KEY);

    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];
    const msPerDay = 1000 * 60 * 60 * 24;

    const response = await databases.listDocuments(DB_ID, COL_ID, [
      Query.limit(100) 
    ]);

    const stats = response.documents;
    let emailsSent = 0;
    let streaksReset = 0;

    for (const stat of stats) {
      const { userId, streak, lastActiveDate, tasksData } = stat;
      
      if (streak > 0 && lastActiveDate && lastActiveDate !== today) {
        const lastActive = new Date(lastActiveDate).getTime();
        const nowTime = new Date(today).getTime();
        const daysSinceActive = Math.round((nowTime - lastActive) / msPerDay);

        // If they missed yesterday entirely (days >= 2), reset streak to 0 and send a "streak lost" email.
        if (daysSinceActive >= 2) {
          try {
            await databases.updateDocument(DB_ID, COL_ID, stat.$id, { streak: 0 });
            streaksReset++;
            console.log(`Reset streak to 0 for user ${userId}`);

            // Send a "streak lost" notification email
            let user;
            try { user = await users.get(userId); } catch (e) { continue; }
            if (user && user.email) {
              const lostHtml = `
                <!DOCTYPE html>
                <html>
                <head><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');</style></head>
                <body style="margin: 0; padding: 0; background-color: #080b12; font-family: 'Inter', -apple-system, sans-serif;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #080b12; padding: 40px 20px;">
                    <tr><td align="center">
                      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #10131f; border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden;">
                        <tr><td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.03);">
                          <h1 style="margin: 0; color: #a78bfa; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">CHRONO</h1>
                          <p style="margin: 8px 0 0 0; color: rgba(232,236,255,0.45); font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Focus Timer</p>
                        </td></tr>
                        <tr><td style="padding: 40px;">
                          <div style="text-align: center; margin-bottom: 30px;"><span style="font-size: 48px; line-height: 1;">💔</span></div>
                          <h2 style="margin: 0 0 15px 0; color: #e8ecff; font-size: 24px; font-weight: 600; text-align: center;">Your ${streak}-day streak was lost</h2>
                          <p style="margin: 0 0 20px 0; color: rgba(232,236,255,0.7); font-size: 16px; line-height: 1.6; text-align: center;">
                            Hi ${user.name || 'there'}, you missed ${daysSinceActive} days without a focus session, so your streak has been reset to 0. But don't worry — every great comeback starts with a single session.
                          </p>
                          <div style="text-align: center; margin-top: 35px;">
                            <a href="${process.env.VITE_APP_URL || 'https://chrono.tenazity.com'}"
                               style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);">
                              Start a New Streak 🚀
                            </a>
                          </div>
                        </td></tr>
                        <tr><td style="padding: 25px 40px; text-align: center; background-color: #0c0f18; border-top: 1px solid rgba(255,255,255,0.03);">
                          <p style="margin: 0; color: rgba(232,236,255,0.3); font-size: 12px;">Sent by Chrono Focus Timer<br>Every setback is a setup for a comeback.</p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
              `;
              await resend.emails.send({
                from: 'Chrono <reminders@chrono.tenazity.com>',
                to: user.email,
                subject: `💔 Your ${streak}-day streak was lost`,
                html: lostHtml
              });
              emailsSent++;
              console.log(`Streak-lost email sent to ${user.email} (was ${streak} days)`);
            }
          } catch (e) {
            console.error(`Failed to reset streak for user ${userId}`, e);
          }
          continue;
        }

        // If days === 1, they missed today so far. Send ONE warning email.
        if (daysSinceActive === 1) {
          let user;
          try {
            user = await users.get(userId);
          } catch (e) {
            continue;
          }

          if (user && user.email) {
            let pendingTasks = [];
            if (tasksData) {
              try {
                const tasks = JSON.parse(tasksData);
                pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
              } catch (e) {}
            }

            const tasksHtml = pendingTasks.length > 0 
              ? `<div style="background-color: #181c2e; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid rgba(255,255,255,0.05);">
                  <h3 style="margin-top: 0; color: #e8ecff; font-size: 16px; font-weight: 600; margin-bottom: 15px;">Your Pending Tasks:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: rgba(232,236,255,0.8); line-height: 1.6;">
                    ${pendingTasks.map(t => {
                      const overdue = t.deadline && t.deadline < today;
                      const deadlineText = t.deadline 
                        ? `<span style="font-size: 12px; margin-left: 8px; color: ${overdue ? '#fca5a5' : 'rgba(232,236,255,0.5)'};">${overdue ? '⚠️ Overdue: ' : '📅 '}${t.deadline}</span>` 
                        : '';
                      return `<li style="margin-bottom: 8px;">${t.title}${deadlineText}</li>`;
                    }).join('')}
                  </ul>
                 </div>`
              : `<div style="background-color: #181c2e; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
                  <p style="margin: 0; color: rgba(232,236,255,0.8); font-size: 15px;">Log a quick 25-minute focus session today to keep the fire alive!</p>
                 </div>`;

            const html = `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                </style>
              </head>
              <body style="margin: 0; padding: 0; background-color: #080b12; font-family: 'Inter', -apple-system, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #080b12; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #10131f; border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                          <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <h1 style="margin: 0; color: #a78bfa; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">CHRONO</h1>
                            <p style="margin: 8px 0 0 0; color: rgba(232,236,255,0.45); font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Focus Timer</p>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                              <span style="font-size: 48px; line-height: 1;">🔥</span>
                            </div>
                            <h2 style="margin: 0 0 15px 0; color: #e8ecff; font-size: 24px; font-weight: 600; text-align: center;">Save your ${streak}-day streak!</h2>
                            <p style="margin: 0 0 20px 0; color: rgba(232,236,255,0.7); font-size: 16px; line-height: 1.6; text-align: center;">
                              Hi ${user.name || 'there'}, you haven't completed a focus session today. You have a few hours left before midnight to log a session and save your <strong>${streak}-day streak</strong>!
                            </p>
                            
                            ${tasksHtml}

                            <div style="text-align: center; margin-top: 35px;">
                              <a href="${process.env.VITE_APP_URL || 'https://chrono.tenazity.com'}" 
                                 style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);">
                                Jump In & Focus
                              </a>
                            </div>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="padding: 25px 40px; text-align: center; background-color: #0c0f18; border-top: 1px solid rgba(255,255,255,0.03);">
                            <p style="margin: 0; color: rgba(232,236,255,0.3); font-size: 12px;">
                              Sent by Chrono Focus Timer<br>Keep pushing your limits.
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

            await resend.emails.send({
              from: 'Chrono <reminders@chrono.tenazity.com>',
              to: user.email,
              subject: `🔥 Save your ${streak}-day streak!`,
              html: html
            });
            
            emailsSent++;
            console.log(`Email sent to ${user.email} (Streak: ${streak})`);
          }
        }
      }
    }

    res.status(200).json({ success: true, emailsSent, streaksReset });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({ error: error.message });
  }
}
