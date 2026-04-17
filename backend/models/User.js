const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
role: { type: String, enum: ['user', 'host', 'admin', 'business'], default: 'user' },
  businessDetails: {
    business_name: String,
    phone_number: String,
    industry: String,
    address: String,
    website: String,
    description: String
  },
  subscriptionPlan: { type: String, default: 'free' },
  joiningFeePaid: { type: Boolean, default: false },
  currency: { type: String, default: 'ZAR' },
  subscriptionStatus: { type: String, default: 'trial' },
  subscriptionStart: Date,
  subscriptionEnd: Date,
  createdAt: { type: Date, default: Date.now },
lastSeen: { type: Date, default: Date.now },
  status: { type: String, enum: ['online', 'busy', 'offline', 'away'], default: 'offline' },
  timezone: { type: String, default: 'UTC' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  backupToken: String, // For recovery
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  payfastPaymentId: String,
  payfastMerchantId: String,
  twoFactorSecret: String,
  twoFactorEnabled: { type: Boolean, default: false },
  lastLoginIP: String,
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: Date
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.generate2FASecret = function() {
  const secret = speakeasy.generateSecret({ length: 20 });
  this.twoFactorSecret = secret.base32;
  return secret.otpauth_url;
};

userSchema.methods.verify2FAToken = function(token) {
  return speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    token: token
  });
};
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
