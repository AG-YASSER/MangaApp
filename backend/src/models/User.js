import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required'],
    select: false // Won't be returned in queries by default
  },
  
  role: {
    type: String,
    enum: ['user', 'mod', 'admin'],
    default: 'user'
  },
  
  tokensBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  isBanned: {
    type: Boolean,
    default: false
  },
  
  banExpiresAt: {
    type: Date,
    default: null
  },
  
  profileImage: {
    type: String,
    default: ''
  },
  
  notifications: [{
    type: String,
    default: []
  }],
  
  // Stats
  chaptersPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  
  titlesPurchased: {
    type: Number,
    default: 0,
    min: 0
  },
  
  chaptersRead: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true // We're handling these manually above
});


// Check if user is currently banned
userSchema.methods.isCurrentlyBanned = function() {
  if (!this.isBanned) return false;
  if (!this.banExpiresAt) return true;
  return this.banExpiresAt > new Date();
};

// Add tokens to balance
userSchema.methods.addTokens = function(amount) {
  this.tokensBalance += amount;
  return this.save();
};

// Deduct tokens from balance
userSchema.methods.deductTokens = function(amount) {
  if (this.tokensBalance < amount) {
    throw new Error('Insufficient tokens');
  }
  this.tokensBalance -= amount;
  return this.save();
};

// Add notification
userSchema.methods.addNotification = function(message) {
  // Keep only last 50 notifications
  this.notifications.unshift(message);
  if (this.notifications.length > 50) {
    this.notifications.pop();
  }
  return this.save();
};

// Static method to find by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to get all banned users
userSchema.statics.getBannedUsers = function() {
  return this.find({ isBanned: true });
};

// Static method to get users by role
userSchema.statics.getByRole = function(role) {
  return this.find({ role });
};

// Indexes for better performance
userSchema.index({ role: 1 });
userSchema.index({ isBanned: 1 });
userSchema.index({ tokensBalance: -1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

export default User;