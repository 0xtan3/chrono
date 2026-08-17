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

    for (const stat of allStats) {
      const { userId, streak, lastActiveDate, timezone, streakFreezes } = stat;
      
      if (!lastActiveDate) continue;

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
        let html = null;
        let shouldSend = false;

        if (streak > 0) {
          if (daysSinceActive === 1) {
            // About to lose
            subject = `🔥 Save your ${streak}-day streak!`;
            html = `<p>Hi there,</p><p>You're about to lose your ${streak}-day CHRONO focus streak! Complete a quick session today to keep it alive.</p><p>Stay focused,<br>CHRONO Team</p>`;
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
                html = `<p>Hi there,</p><p>You missed a session yesterday, but your Streak Freeze automatically activated! Your ${streak}-day streak is safe.</p><p>Log a session today!</p><p>CHRONO Team</p>`;
                shouldSend = true;
              } catch (e) { console.error('Freeze error', e); }
            } else {
              try {
                await databases.updateDocument(DB_ID, COL_ID, stat.$id, { streak: 0 });
                streaksReset++;
                subject = `💔 Your ${streak}-day streak was lost`;
                html = `<p>Hi there,</p><p>You missed a session yesterday and your ${streak}-day streak was lost.</p><p>Don't worry, you can always start a new one today!</p><p>CHRONO Team</p>`;
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
              html = `<p>Hi there,</p><p>It's been ${daysSinceActive} days since your last focus session. We know building habits is tough, but we're here when you're ready to get back into the groove.</p><p>Jump back in and start building a new streak!</p><p>CHRONO Team</p>`;
              shouldSend = true;
            }
          }
        }

        if (shouldSend && subject && html) {
          try {
            const user = await users.get(userId);
            if (user && user.email) {
              await resend.emails.send({
                from: 'Chrono <reminders@chrono.tenazity.com>', // Or fallback to default resend email if using free tier without domain
                to: user.email,
                subject: subject,
                html: html
              });
              emailsSent++;
              console.log(`Email sent to ${user.email}: ${subject}`);
            }
          } catch (e) {
            console.error(`Failed to send email to user ${userId}`, e);
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
