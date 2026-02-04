import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import crypto from "crypto";
import {configDotenv} from 'dotenv'
import Transaction from '../models/core/Transactions.js';
import User from '../models/core/User.js';
import mongoose from "mongoose";
const app = express();
app.use(cors());
app.use(express.json());

configDotenv();

mongoose.connect(process.env.URI)
.then((data) => {console.log("Connected")})
.catch((e) => console.log(e.message));
// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

app.get('/' , (req,res) => {res.send("Payment Node healthy")})

app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json({
      success: true,
      orderId: order.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating order");
  }
});

app.post("/verify-payment", (req, res) => {
  const { orderId, paymentId, razorpaySignature } =
    req.body;

  const sign = orderId + "|" + paymentId;

  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(sign)
    .digest("hex");

  if (expectedSign === razorpaySignature) {
    console.log("Signature matched")
    return res.json({ success: true });
  } else {
    console.log("Signature mismatch")
    return res.json({ success: false });
  }
});

// Your static coin pack list
const coinPacks = {
  1: { price: 99, coins: 300 },
  2: { price: 199, coins: 650 },
  3: { price: 299, coins: 1000 }
};
app.post("/web-hook/coinf", async (req, res) => {
  try {
    const secret = process.env.RAZOR_PAY_WEBHOOK;

    const shasum = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (shasum !== req.headers["x-razorpay-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;

      const userId = payment.notes.userId;
      const coinPackId = Number(payment.notes.coinPackId);
      const coinsFromClient = Number(payment.notes.coins);
      const email = payment.notes.email;

      const amount = payment.amount / 100;
      const paymentId = payment.id;
      const orderId = payment.order_id;

      // 1️⃣ VALIDATION CHECK
      const pack = coinPacks[coinPackId];

      if (!pack) {
        console.log("Invalid pack id:", coinPackId);
        return res.json({ status: "invalid-pack" });
      }

      const packCoins = pack.coins;
      const packPrice = pack.price;

      if (packCoins !== coinsFromClient || packPrice !== amount) {
        console.log("❌ Fraud attempt / tampering detected");

        await Transaction.findOneAndUpdate(
          { orderId },
          {
            userId,
            coinPackId,
            coins: coinsFromClient,
            amount,
            email,
            paymentId,
            status: "FAILED"
          },
          { upsert: true }
        );

        return res.json({ status: "mismatch" });
      }

      // 2️⃣ SAFE TRANSACTION CREATION HERE
      const transaction = await Transaction.findOneAndUpdate(
        { orderId },
        {
          userId,
          coinPackId,
          coins: packCoins,
          amount: packPrice,
          email,
          paymentId,
          status: "SUCCESS"
        },
        { upsert: true, new: true }
      );

      console.log("Transaction updated/created:", transaction._id);

      // 3️⃣ CREDIT COINS ONLY IF SUCCESS
      await User.findByIdAndUpdate(userId, {
        $inc: { coins: packCoins }
      });

      console.log(`Coins added: ${packCoins} → User: ${userId}`);
    }

    return res.json({ status: "ok" });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



const PORT =  5007;
app.listen(PORT, () => console.log(`Payment node running`));
