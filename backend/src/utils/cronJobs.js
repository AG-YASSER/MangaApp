import cron from 'node-cron';
import Manga from '../models/Manga.js';
import User from '../models/User.js';
import admin from '../config/firebase.js';

cron.schedule('0 0 * * *', async () => {
  try {
    const result = await Manga.updateMany(
      { isFeatured: true, featuredUntil: { $lt: new Date() } },
      { isFeatured: false, featuredUntil: null }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Unfeatured ${result.modifiedCount} expired manga`);
    }
  } catch (error) {
    console.error('❌ Featured manga error:', error.message);
  }
});

cron.schedule('0 0 * * *', async () => {
  try {
    const usersToDelete = await User.find({
      deleteVerified: true,
      deleteScheduledFor: { $lt: new Date() }
    });

    if (usersToDelete.length === 0) return;

    let deleted = 0;
    let failed = 0;

    for (const user of usersToDelete) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
        await User.findByIdAndDelete(user._id);
        console.log(`✅ Deleted: ${user.email}`);
        deleted++;
      } catch (error) {
        console.error(`❌ Failed to delete ${user.email}:`, error.message);
        failed++;
      }
    }

    console.log(`✅ Complete: ${deleted} deleted, ${failed} failed`);
  } catch (error) {
    console.error('❌ Account deletion error:', error.message);
  }
});

cron.schedule('0 * * * *', async () => {
  try {
    const result = await User.updateMany(
      { 
        deleteVerificationExpires: { $lt: new Date() },
        deleteRequestedAt: { $ne: null }
      },
      { 
        $unset: {
          deleteVerificationCode: 1,
          deleteVerificationExpires: 1
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Cleared ${result.modifiedCount} expired verification codes`);
    }
  } catch (error) {
    console.error('❌ Code cleanup error:', error.message);
  }
});

console.log('Cron jobs running');