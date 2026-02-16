// utils/cronJobs.js
import cron from 'node-cron';
import Manga from '../models/Manga.js';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    // Auto-unfeature expired manga
    await Manga.updateMany(
      { 
        isFeatured: true, 
        featuredUntil: { $lt: new Date() } 
      },
      { 
        isFeatured: false,
        featuredUntil: null 
      }
    );
    console.log('✅ Expired featured manga updated');
  } catch (error) {
    console.error('Cron job error:', error);
  }
});