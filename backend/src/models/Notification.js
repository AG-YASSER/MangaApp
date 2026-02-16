import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // WHO gets the notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // WHAT TYPE OF NOTIFICATION?
    type: {
      type: String,
      enum: [
        "new_chapter", // "New chapter in [Manga Name]"
        "purchase_success", // "Your purchase was successful"
        "purchase_failed", // "Payment failed"
        "subscription_expiring", // "Your subscription expires in 3 days"
        "refund", // "You received a refund"
        "comment_reply", // "Someone replied to your comment"
        "system", // General announcements
        "promo", // Special offers
      ],
      required: true,
    },

    // TITLE & MESSAGE
    title: {
      type: String,
      required: true,
    },

    message: String,

    // WHAT IS THIS ABOUT?
    // Different notifications reference different things
    // E.g., new_chapter notification links to mangaId
    relatedTo: {
      mangaId: mongoose.Schema.Types.ObjectId,
      chapterId: mongoose.Schema.Types.ObjectId,
      purchaseId: mongoose.Schema.Types.ObjectId,
      userId: mongoose.Schema.Types.ObjectId, // For comment_reply notifications
    },

    // HAS USER SEEN IT?
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Fast query: "Get unread notifications"
    },

    // WHEN DID USER READ IT?
    readAt: Date,

    // PRIORITY
    // So app can show important ones first
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },

    // ACTION BUTTON DATA
    // When user taps notification, where should it go?
    actionUrl: {
      type: String,
      default: null, // e.g., "/manga/123", "/purchase/456"
    },

    // SHOULD WE SEND EMAIL TOO?
    emailSent: {
      type: Boolean,
      default: false,
    },

    // PUSH NOTIFICATION SENT?
    pushSent: {
      type: Boolean,
      default: false,
    },

    // AUTO-DELETE OLD NOTIFICATIONS (30 days)
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000),
      index: { expires: 0 }, // Auto-delete after this date
    },
  },
  { timestamps: true },
);

// Index: get unread notifications for user
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
