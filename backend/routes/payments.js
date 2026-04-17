const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PayFast = require('payfast'); // npm i payfast

// Auth middleware (reuse from server)
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// PayFast config (SA preferred)
const payfast = new PayFast({
  sandbox: process.env.PAYFAST_SANDBOX === 'true',
  key: process.env.PAYFAST_MERCHANT_KEY,
  passphrase: process.env.PAYFAST_MERCHANT_PASSPHRASE,
  liveUrl: process.env.PAYFAST_LIVE_URL
});

// ===== STRIPE CREATION =====
// Create Stripe customer & subscription
router.post('/stripe/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { planId, duration = 'monthly' } = req.body;
    const prices = {
      joining_fee: 'price_joining_99', // Create in Stripe dashboard
      starter: duration === 'yearly' ? 'price_starter_yearly' : 'price_starter_monthly',
      pro: duration === 'yearly' ? 'price_pro_yearly' : 'price_pro_monthly'
    };
    const priceId = prices[planId];
    if (!priceId) return res.status(400).json({ error: 'Invalid plan' });

    const user = await User.findById(req.user.id);
    let customer;

    if (!user.stripeCustomerId) {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() }
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    } else {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/subscription?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription?cancel=true`,
      metadata: { userId: req.user.id, planId }
    });

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stripe webhook
router.post('/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;
    const user = await User.findById(userId);
    if (user && planId !== 'joining_fee') {
      user.subscriptionPlan = planId;
      user.subscriptionStatus = 'active';
      user.subscriptionStart = new Date();
      user.stripeSubscriptionId = session.subscription;
      await user.save();
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const user = await User.findOne({ stripeCustomerId: sub.customer });
    if (user) {
      user.subscriptionStatus = 'canceled';
      await user.save();
    }
  }

  res.json({received: true});
});

// ===== PAYFAST ENDPOINTS =====
router.post('/payfast/initiate', authMiddleware, async (req, res) => {
  try {
    const { planId, returnUrl = `${process.env.FRONTEND_URL}/subscription` } = req.body;
    const prices = {
      joining_fee: 99,
      starter: 199,
      pro: 499
    };
    const amount = prices[planId];

    const user = await User.findById(req.user.id);
    const orderId = `ORD_${user._id}_${Date.now()}`;

    const pfParams = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: returnUrl,
      cancel_url: `${returnUrl}?cancel=true`,
      notify_url: `${process.env.BACKEND_URL}/api/payments/payfast/notify`,
      name_first: user.name.split(' ')[0],
      name_last: user.name.split(' ').slice(1).join(' '),
      email_address: user.email,
      m_payment_id: orderId,
      amount: amount,
      item_name: `Subscription: ${planId}`,
      item_description: `Chat Product ${planId} plan`,
      custom_str1: user._id.toString(),
      custom_str2: planId
    };

    // Generate signature
    const signature = payfast.signature.generate(pfParams);
    pfParams.signature = signature;

    const pfUrl = payfast.live ? 'https://www.payfast.co.za/eng/process' : 'https://sandbox.payfast.co.za/eng/process';
    res.json({ success: true, url: `${pfUrl}?${new URLSearchParams(pfParams).toString()}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PayFast notify (ITN)
router.post('/payfast/notify', express.raw({type: 'application/x-www-form-urlencoded'}), (req, res) => {
  let postData = req.body.toString();

  // Validate PayFast notify
  if (!payfast.validate.notify(postData, req.headers)) {
    console.error('PayFast notify validation failed');
    return res.status(400).send('Invalid notify');
  }

  const formFields = new URLSearchParams(postData);
  const userId = formFields.get('custom_str1');
  const planId = formFields.get('custom_str2');
  const paymentStatus = formFields.get('payment_status');
  const pfPaymentId = formFields.get('m_payment_id');

  if (paymentStatus === 'COMPLETE' && userId && planId) {
    User.findById(userId).then(user => {
      if (user) {
        user.subscriptionPlan = planId;
        user.subscriptionStatus = 'active';
        user.payfastPaymentId = pfPaymentId;
        if (planId === 'joining_fee') user.joiningFeePaid = true;
        user.save();
      }
    }).catch(console.error);
  }

  res.send('OK'); // Required for PayFast
});

module.exports = router;
