import mongoose from "mongoose";

const tempRegistrationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // REMOVE this line: index: true,  ← This is the duplicate!
    },
    password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,  // This creates an index automatically
      // REMOVE this line: index: true,  ← If you had it
    },
    tokenExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Define ALL indexes here (single source of truth)
// Index for TTL (auto-delete)
tempRegistrationSchema.index(
  { tokenExpiry: 1 }, 
  { expireAfterSeconds: 0 }
);

// Index for email lookups
tempRegistrationSchema.index({ email: 1 });  // Keep ONLY this, remove from field

// Index for verification token lookups (if not already unique)
// tempRegistrationSchema.index({ verificationToken: 1 }); // Not needed if unique:true

const TempRegistration = mongoose.model("TempRegistration", tempRegistrationSchema);

export default TempRegistration;