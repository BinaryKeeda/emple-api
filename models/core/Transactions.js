import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  coinPackId: { type: Number, required: true },
  coins: { type: Number, required: true },

  amount: { type: Number, required: true }, // in rupees

  paymentId: { type: String }, // Razorpay payment ID
  orderId: { type: String },   // Razorpay order ID

  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING"
  },

  email: { type: String },

  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
