import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import './SubscriptionPlans.css';

// Load Stripe once
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

const SubscriptionPlansContent = ({ plans, userSubscription, currency, duration, isPlanActive, formatPrice, convertCurrency, currencies }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayfastSubscribe = async (planId) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/payments/payfast/initiate', {
        planId,
        duration,
        returnUrl: window.location.origin + '/subscription?success=true'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      alert('Payment initiation failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeSubscribe = async (planId) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/payments/stripe/create-checkout', {
        planId,
        duration
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId: response.data.sessionId });
        if (error) alert(error.message);
      }
    } catch (error) {
      alert('Stripe checkout failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Cancel subscription?')) return;
    try {
      await axios.put('/api/user-subscription/cancel', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      window.location.reload();
    } catch (error) {
      alert('Cancel failed');
    }
  };

  const getPaymentMethod = () => currency === 'ZAR' ? 'PayFast (SA)' : 'Stripe';

  return (
    <div className="subscription-plans">
      <div className="subscription-header">
        <h1>Choose Your Plan</h1>
        <p>{getPaymentMethod()} Secure Payments • Instant Access</p>
        <div className="subscription-controls">
          <div className="duration-toggle">
            <label className={`toggle-option ${duration === 'monthly' ? 'active' : ''}`}>
              <input type="radio" value="monthly" checked={duration === 'monthly'} onChange={e => {/* handled parent */}} />
              Monthly
            </label>
            <label className={`toggle-option ${duration === 'yearly' ? 'active' : ''}`}>
              <input type="radio" value="yearly" checked={duration === 'yearly'} onChange={e => {/* handled parent */}} />
              Yearly <span className="discount">-10%</span>
            </label>
          </div>
          <div className="currency-selector">
            <select value={currency} onChange={e => {/* handled parent */}}>
              {currencies.map(c => <option key={c.code}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className={`plan-card ${isPlanActive(plan.id) ? 'active' : selectedPlan === plan.id ? 'selected' : ''}`} onClick={() => {/* handled parent */}}>
            <div className="plan-header">
              <h2>{plan.name}</h2>
            </div>
            <div className="plan-price">{formatPrice(plan.price, duration)}</div>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((f, i) => <li key={i}><span>✓</span> {f}</li>)}
            </ul>
            <div className="plan-actions">
              {isPlanActive(plan.id) ? (
                <button className="btn-cancel" onClick={handleCancelSubscription}>Manage Plan</button>
              ) : (
                <div>
                  <button 
                    className="btn-primary" 
                    onClick={e => {
                      e.stopPropagation();
                      if (currency === 'ZAR') handlePayfastSubscribe(plan.id);
                      else handleStripeSubscribe(plan.id);
                    }} 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Redirecting...' : `Subscribe ${getPaymentMethod()}`}
                  </button>
                  <small>Secure checkout • No setup fees</small>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {userSubscription && (
        <div className="current-subscription">
          <h3>Active: {userSubscription.plan_name} ({formatPrice(userSubscription.price, duration)})</h3>
          <button onClick={handleCancelSubscription}>Cancel</button>
        </div>
      )}
    </div>
  );
};

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duration, setDuration] = useState('monthly');
  const [currency, setCurrency] = useState('ZAR');
  const [exchangeRates, setExchangeRates] = useState({});

  const currencies = [
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.5 },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79 }
  ];

  useEffect(() => {
    fetchRates();
    fetchData();
  }, []);

  const fetchRates = async () => {
    try {
      // Mock rates - replace with API
      setExchangeRates({
        ZAR: 18.5,
        USD: 1.00,
        EUR: 0.92,
        GBP: 0.79
      });
    } catch {}
  };

  const fetchData = async () => {
    try {
      const [plansRes, subscriptionRes] = await Promise.all([
        axios.get('/api/subscription-plans', { headers: authHeader() }),
        axios.get('/api/user-subscription', { headers: authHeader() })
      ]);
      setPlans(plansRes.data.plans || []);
      setUserSubscription(subscriptionRes.data.subscription);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const convertCurrency = (amount, toCurrency) => {
    const rate = exchangeRates[toCurrency] || 1;
    return Math.round(amount * rate * 100) / 100;
  };

  const formatPrice = (price, duration) => {
    const converted = convertCurrency(price, currency);
    const info = currencies.find(c => c.code === currency);
    return duration === 'yearly' 
      ? `${info.symbol}${ (converted * 12 * 0.9).toFixed(0) }/yr`
      : `${info.symbol}${converted.toFixed(0)}/mo`;
  };

  const isPlanActive = (planId) => userSubscription?.plan_id === planId && userSubscription.status === 'active';

  if (loading) return <div className="loading">Loading plans...</div>;

  return (
    <Elements stripe={stripePromise}>
      <SubscriptionPlansContent 
        plans={plans}
        userSubscription={userSubscription}
        currency={currency}
        duration={duration}
        isPlanActive={isPlanActive}
        formatPrice={formatPrice}
        convertCurrency={convertCurrency}
        currencies={currencies}
      />
    </Elements>
  );
};

export default SubscriptionPlans;
