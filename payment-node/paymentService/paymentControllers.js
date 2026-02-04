import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Users from "../models/User.js";
import Subscription from "../models/Subscription.js";

// 🟢 Create Razorpay Order
export const createOrder = async (req, res) => {
  try {
    const { userId, plan } = req.body;

    // Example pricing
    const plans = {
      basic: 50000, // 500 INR
      pro: 150000,  // 1500 INR
      enterprise: 500000, // 5000 INR
    };

    const amount = plans[plan];
    if (!amount) return res.status(400).json({ error: "Invalid plan" });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      payment_capture: 1,
    });

    res.json({ orderId: order.id, amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Verify Payment & Activate Subscription
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature, payment verification failed" });
    }

    // ✅ Payment verified → Activate subscription
    const subscription = await Subscription.create({
      userId,
      plan,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      autoRenew: true,
      paymentProvider: "razorpay",
      subscriptionId: razorpay_payment_id,
      lastPaymentDate: new Date(),
    });

    await Users.findByIdAndUpdate(userId, { subscription: subscription._id });

    res.json({ success: true, subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
