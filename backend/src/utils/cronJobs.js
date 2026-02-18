import cron from 'node-cron';
import Manga from '../models/Manga.js';
import User from '../models/User.js';
import admin from '../config/firebase.js';
import { sendDeletionConfirmedEmail } from '../utils/email.js';

// ============ FEATURED MANGA CLEANUP ============
// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('🔄 [CRON] Running featured manga cleanup...');
    
    const result = await Manga.updateMany(
      { 
        isFeatured: true, 
        featuredUntil: { $lt: new Date() } 
      },
      { 
        isFeatured: false,
        featuredUntil: null 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ [CRON] Unfeatured ${result.modifiedCount} expired manga`);
    }
  } catch (error) {
    console.error('❌ [CRON] Featured manga error:', error.message);
  }
});

// ============ ACCOUNT DELETION CLEANUP ============
// Run every day at midnight - DELETE users whose 15 days are up
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('🔄 [CRON] Running account deletion cleanup...');
    
    // Find users who have verified deletion and are past their scheduled date
    const usersToDelete = await User.find({
      deleteVerified: true,
      deleteScheduledFor: { $lt: new Date() }
    });

    if (usersToDelete.length === 0) {
      return;
    }

    console.log(`📊 [CRON] Found ${usersToDelete.length} accounts to permanently delete`);

    const results = {
      deleted: 0,
      failed: 0,
      emails: 0
    };

    for (const user of usersToDelete) {
      try {
        // Store user info before deletion
        const userEmail = user.email;
        const userName = user.username;

        // Delete from Firebase
        await admin.auth().deleteUser(user.firebaseUid);
        
        // Delete from MongoDB
        await User.findByIdAndDelete(user._id);
        
        // Send confirmation email
        try {
          await sendDeletionConfirmedEmail(userEmail, userName);
          results.emails++;
          console.log(`📧 [CRON] Confirmation email sent to: ${userEmail}`);
        } catch (emailError) {
          console.error(`⚠️ [CRON] Email failed for ${userEmail}:`, emailError.message);
        }
        
        console.log(`✅ [CRON] Permanently deleted: ${userEmail}`);
        results.deleted++;
        
      } catch (error) {
        console.error(`❌ [CRON] Failed to delete ${user.email}:`, error.message);
        results.failed++;
      }
    }

    console.log(`✅ [CRON] Deletion complete: ${results.deleted} deleted, ${results.failed} failed, ${results.emails} emails sent`);
    
  } catch (error) {
    console.error('❌ [CRON] Account deletion error:', error.message);
  }
});

// ============ EXPIRE VERIFICATION CODES ============
// Run every hour to clean up expired codes
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
      console.log(`✅ [CRON] Cleared ${result.modifiedCount} expired verification codes`);
    }
  } catch (error) {
    console.error('❌ [CRON] Code cleanup error:', error.message);
  }
});

console.log('⏰ [CRON] Jobs scheduled:');
console.log('  • Featured manga cleanup (midnight)');
console.log('  • Account deletion cleanup (midnight)');
console.log('  • Expired code cleanup (hourly)');