import mongoose , { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";


// ----------------------
// Subscription Subschema
// ----------------------
const subscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["inactive", "active", "cancelled", "expired"],
      default: "inactive",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    autoRenew: { type: Boolean, default: false },
    paymentProvider: { type: String, enum: ["razorpay", "stripe", "paypal", null], default: null },
    subscriptionId: { type: String, index: true }, // provider's subscription ID
    lastPaymentDate: { type: Date },
  },
  { _id: false } // prevents auto _id inside subdocument
);
const userSchema = new Schema(
  {
    name: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    avatar: { type: String },
    password: { type: String, sparse: true },
    role: {
      type: String,
      required: true,
      enum: ["admin", "user", "campus-admin", "campus-superadmin"],
      default: "user",
    },
    isPasswordChanged: {type:Boolean , default:false},
    isBlocked: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },

    attemptId:{type:mongoose.Schema.Types.ObjectId , ref:"Group"} , // for campus test

    yearOfGraduation: { type: String },
    specialisation: { type: String },
    program: { type: String },
    university: { type: String },
    semester: { type: String },
    phone: {
      type: String,
      default: "",
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },

    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },

    otp : { type: String, sparse: true }, 
    otpExpires: { type: Date, sparse: true },

    googleId: { type: String, index: true },
    subscription: { type: subscriptionSchema, default: () => ({}) },

    coins: {type:Number,default:100}
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err)
  }
});

// Remove sensitive fields from JSON output
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.otp;
    delete ret.otpExpires;
    return ret;
  },
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};




// Activate subscription
userSchema.methods.activateSubscription = function (plan, durationInDays, provider, subscriptionId) {
  const now = new Date();
  this.subscription = {
    plan,
    status: "active",
    startDate: now,
    endDate: new Date(now.getTime() + durationInDays * 24 * 60 * 60 * 1000),
    autoRenew: true,
    paymentProvider: provider,
    subscriptionId,
    lastPaymentDate: now,
  };
  return this.save();
};

// Cancel subscription
userSchema.methods.cancelSubscription = function () {
  this.subscription.status = "cancelled";
  this.subscription.autoRenew = false;
  return this.save();
};

// Check if user has active subscription
userSchema.methods.hasActiveSubscription = function () {
  return (
    this.subscription.status === "active" &&
    this.subscription.endDate &&
    this.subscription.endDate > new Date()
  );
};


const Users = model("Users", userSchema);
export default Users;
