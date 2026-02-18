# Subscription System Documentation

## Overview

MangaApp now features a **single Premium subscription tier** at $4.99/month. The system supports two income streams:

1. **Subscriptions** ($4.99/month) - Access premium features
2. **Donations/Ads** - Users can donate to get tokens and enable ad viewing
3. **All chapters are FREE for all users** - No paywalls, supporting creators through subscriptions

## Business Model

### Primary Income: Premium Subscription

Users upgrade to Premium ($4.99/month) to unlock exclusive features like profile customization and auto-reader.

### Secondary Income: Ads + Tokens System

- **Donations**: Users donate money → receive tokens
- **Tokens**: Earned through donations or accumulated
- **Token Usage**: After gathering enough tokens (4.99 equivalent), users can subscribe for free using tokens
- **Ads**: Display ads throughout the platform for free users

## Subscription Plans

### Premium Tier (Only One)

- **Price:** $4.99/month
- **Billing:** Monthly recurring
- **Payment Methods:** Credit Card (Stripe) or Tokens

#### Premium Features:

1. **Profile Customization**
   - Add GIFs to your profile
   - Custom profile banner

2. **Reading Experience**
   - Auto-reader feature with adjustable speed
   - Ad-free reading

3. **Content Access**
   - All chapters completely free (no paywalls)
   - Same content as free users

## Tokens & Donations System

### Donation Tiers

| Tier   | Tokens     | Price  | Bonus                              |
| ------ | ---------- | ------ | ---------------------------------- |
| Tier 1 | 50 tokens  | $1.99  | -                                  |
| Tier 2 | 130 tokens | $4.99  | +30 bonus (equivalent to 1 month)  |
| Tier 3 | 270 tokens | $9.99  | +70 bonus (2.2 months equivalent)  |
| Tier 4 | 550 tokens | $19.99 | +150 bonus (4.4 months equivalent) |

## API Endpoints

### Public Endpoints

#### Get Subscription Plan

```
GET /api/subscription/plans
```

**Response:**

```json
{
  "success": true,
  "plans": [
    {
      "id": "premium",
      "name": "Premium",
      "price": 4.99,
      "billingCycle": "monthly",
      "features": [
        "Add GIFs to your profile",
        "Custom profile banner",
        "Auto-reader feature with adjustable speed",
        "All chapters free & ad-free",
        "Support our creators"
      ],
      "benefits": {
        "canAddGifProfile": true,
        "canAddBanner": true,
        "autoReaderEnabled": true,
        "noAds": true,
        "allChaptersFree": true
      }
    }
  ]
}
```

#### Get Donation Options

```
GET /api/subscription/donations/options
```

**Response:**

```json
{
  "success": true,
  "donationOptions": [
    {
      "id": "tier1",
      "tokens": 50,
      "displayName": "$1.99",
      "price": 1.99,
      "message": "Support our creators"
    },
    {
      "id": "tier2",
      "tokens": 130,
      "displayName": "$4.99",
      "price": 4.99,
      "message": "You're awesome! 1 month subscription value",
      "bonus": 30
    },
    {
      "id": "tier3",
      "tokens": 270,
      "displayName": "$9.99",
      "price": 9.99,
      "message": "Super donor! 2.2 months value",
      "bonus": 70
    },
    {
      "id": "tier4",
      "tokens": 550,
      "displayName": "$19.99",
      "price": 19.99,
      "message": "Incredible! 4.4 months value",
      "bonus": 150
    }
  ]
}
```

### Protected Endpoints

#### Get Current Subscription

```
GET /api/subscription/me
Authorization: Bearer <token>
```

**Response (Subscriber):**

```json
{
  "success": true,
  "isSubscriber": true,
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": true,
    "startDate": "2026-02-17T10:00:00Z",
    "expiresAt": "2026-03-17T10:00:00Z",
    "benefits": {
      "canAddGifProfile": true,
      "canAddBanner": true,
      "autoReaderEnabled": true,
      "noAds": true,
      "allChaptersFree": true
    },
    "price": 4.99,
    "billingCycle": "monthly",
    "isAutoRenew": true,
    "purchaseMethod": "cash"
  }
}
```

**Response (Non-Subscriber):**

```json
{
  "success": true,
  "isSubscriber": false,
  "subscription": null,
  "message": "User does not have an active subscription"
}
```

#### Subscribe to Premium

```
POST /api/subscription/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "cash"    // "cash" or "tokens"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Premium subscription activated! (Paid with tokens)",
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": true,
    "startDate": "2026-02-17T10:00:00Z",
    "expiresAt": "2026-03-17T10:00:00Z",
    "benefits": { ... },
    "price": 4.99,
    "billingCycle": "monthly",
    "isAutoRenew": true,
    "purchaseMethod": "tokens"
  }
}
```

#### Cancel Subscription

```
POST /api/subscription/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Too expensive"  // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscription cancelled successfully. You will lose premium features at expiration.",
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": false,
    "cancelledAt": "2026-02-17T10:00:00Z",
    "cancellationReason": "Too expensive",
    "expiresAt": "2026-03-17T10:00:00Z"
  }
}
```

#### Get Subscription History

```
GET /api/subscription/history?limit=10&skip=0
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "history": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "isActive": false,
      "startDate": "2026-01-17T10:00:00Z",
      "expiresAt": "2026-02-17T10:00:00Z",
      "price": 4.99,
      "billingCycle": "monthly",
      "purchaseMethod": "cash"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "skip": 0,
    "pages": 1
  }
}
```

#### Check Feature Access

```
GET /api/subscription/check-feature?feature=gif_profile
Authorization: Bearer <token>
```

**Valid Features:**

- `gif_profile` - Add GIF to profile
- `banner` or `profile_banner` - Custom profile banner
- `auto_reader` or `autoreader` - Auto-reader feature
- `no_ads` or `noads` - Ad-free experience
- `all_chapters` or `allchapters` - All chapters free

**Response:**

```json
{
  "success": true,
  "feature": "gif_profile",
  "hasAccess": true,
  "isSubscriber": true,
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "expiresAt": "2026-03-17T10:00:00Z",
    "benefits": { ... }
  }
}
```

#### Get Subscription Benefits

```
GET /api/subscription/benefits
Authorization: Bearer <token>
```

**Response (Subscriber):**

```json
{
  "success": true,
  "isSubscriber": true,
  "benefits": {
    "canAddGifProfile": true,
    "canAddBanner": true,
    "autoReaderEnabled": true,
    "noAds": true,
    "allChaptersFree": true
  },
  "features": [
    "Add GIFs to your profile",
    "Custom profile banner",
    "Auto-reader feature with adjustable speed",
    "All chapters free & ad-free",
    "Support our creators"
  ],
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "startDate": "2026-02-17T10:00:00Z",
    "expiresAt": "2026-03-17T10:00:00Z",
    "isAutoRenew": true,
    "purchaseMethod": "cash"
  }
}
```

### Tokens & Donations Endpoints

#### Get Tokens Balance

```
GET /api/subscription/tokens/balance
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "wallet": {
    "tokensBalance": 250,
    "coinsBalance": 1500
  }
}
```

#### Make a Donation

```
POST /api/subscription/donations/make
Authorization: Bearer <token>
Content-Type: application/json

{
  "donationTierId": "tier2"  // "tier1", "tier2", "tier3", or "tier4"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Ready to donate! You will receive 130 tokens.",
  "donation": {
    "tier": "tier2",
    "tokens": 130,
    "price": 4.99,
    "purchaseId": "507f1f77bcf86cd799439012"
  },
  "wallet": {
    "tokensBalance": 130
  }
}
```

#### Subscribe Using Tokens

```
POST /api/subscription/subscribe-with-tokens
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Premium subscription activated! (Paid with tokens)",
  "subscription": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": true,
    "startDate": "2026-02-17T10:00:00Z",
    "expiresAt": "2026-03-17T10:00:00Z",
    "price": 4.99,
    "billingCycle": "monthly",
    "purchaseMethod": "tokens"
  }
}
```

## Database Updates Needed

Update the Subscription model to include:

```javascript
{
  // ... existing fields ...
  tier: "premium",  // Now always "premium"
  purchaseMethod: {
    type: String,
    enum: ["cash", "tokens"],
    default: "cash"
  }
}
```

Update Purchase model to support donations:

```javascript
{
  purchaseType: {
    type: String,
    enum: ["chapter", "manga", "subscription", "donation"],
    default: "subscription"
  },
  // ... rest of fields ...
}
```

## Implementation Guide

### Feature Check in Upload Handler

```javascript
import { authMiddleware } from "../middleware/auth.js";
import { checkFeatureAccess } from "../controllers/subscriptionController.js";

router.post("/profile/upload-gif", authMiddleware, async (req, res) => {
  // Check if user has GIF feature
  const featureCheck = await checkFeatureAccess(req.user.uid, "gif_profile");

  if (!featureCheck.hasAccess) {
    return res.status(403).json({
      success: false,
      message: "Premium subscription required to upload GIFs",
    });
  }

  // Process GIF upload
});
```

### Set Auto-Reader Speed

```javascript
router.put("/settings/auto-reader-speed", authMiddleware, async (req, res) => {
  const { speed } = req.body; // speed in ms

  // Check access
  const subscription = await Subscription.findOne({
    userId: req.user.uid,
    isActive: true,
  });

  if (!subscription?.benefits?.autoReaderEnabled) {
    return res.status(403).json({
      success: false,
      message: "Auto-reader requires Premium subscription",
    });
  }

  // Update user settings
  await User.findByIdAndUpdate(req.user.uid, {
    "preferences.autoReaderSpeed": speed,
  });

  res.json({ success: true, message: "Auto-reader speed updated" });
});
```

## User Flow Examples

### Free User → Premium Subscriber (With Cash)

1. User clicks "Upgrade to Premium"
2. Presented with $4.99/month option
3. Payment processed via Stripe
4. Subscription created with `purchaseMethod: "cash"`
5. User gains access to all premium features

### Free User → Premium Subscriber (With Tokens)

1. User accumulates tokens through donations
2. When tokens ≥ 4.99 equivalent (approx 130 tokens for $4.99 donation):
   - POST `/api/subscription/subscribe-with-tokens`
   - 4.99 tokens deducted from balance
   - Subscription created with `purchaseMethod: "tokens"`
   - User gains access to premium features

### Free User → Donator

1. User views donation options
2. Selects a tier (e.g., "Donate $4.99")
3. Receives 130 tokens (+ 30 bonus)
4. Tokens stored in wallet
5. Can use for subscription or future features

## Best Practices

1. ✅ Always check subscription expiration
2. ✅ Create Purchase records for all transactions
3. ✅ Update wallets atomically
4. ✅ Validate token amounts before deducting
5. ✅ Track payment method (cash vs tokens)
6. ✅ Send renewal reminders 7 days before expiry
7. ✅ Log all subscription changes

## Future Enhancements

- [ ] Auto-renewal with Stripe billing
- [ ] Early renewal discounts
- [ ] Referral program (earn tokens)
- [ ] Subscription gift codes
- [ ] Family plans (shared features)
- [ ] Annual subscription option ($49.99)
- [ ] Premium badge on profiles
- [ ] Creator revenue sharing
- [ ] Monthly character limit for posts
- [ ] Custom profile themes
