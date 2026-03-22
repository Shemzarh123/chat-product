import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SubscriptionPlans.css';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duration, setDuration] = useState('monthly');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [currency, setCurrency] = useState('ZAR');
  const [exchangeRates, setExchangeRates] = useState({});

  const currencies = [
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }
  ];

  useEffect(() => {
    fetchData();
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await axios.get('/api/exchange-rates');
      if (response.data.success) {
        setExchangeRates(response.data.rates);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Fallback exchange rates if API fails
      setExchangeRates({
        ZAR: 18.00,
        USD: 1.00,
        EUR: 0.92,
        GBP: 0.79,
        AUD: 1.52,
        CAD: 1.35
      });
    }
  };

  const fetchData = async () => {
    try {
      const [plansRes, subscriptionRes] = await Promise.all([
        axios.get('/api/subscription-plans'),
        axios.get('/api/user-subscription')
      ]);

      if (plansRes.data.success) {
        setPlans(plansRes.data.plans);
      }

      if (subscriptionRes.data.success) {
        setUserSubscription(subscriptionRes.data.subscription);
        if (subscriptionRes.data.subscription) {
          setSelectedPlan(subscriptionRes.data.subscription.plan_id);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Base currency is USD (as per Stripe)
    const usdAmount = fromCurrency === 'USD' ? amount : amount / exchangeRates[fromCurrency];
    return toCurrency === 'USD' ? usdAmount : usdAmount * exchangeRates[toCurrency];
  };

  const handleSubscribe = async (planId) => {
    setIsSubscribing(true);
    try {
      const response = await axios.post('/api/create-subscription', {
        planId,
        duration,
        currency
      });

      if (response.data.success) {
        setUserSubscription(response.data.subscription);
        setSelectedPlan(planId);
        alert('Subscription created successfully!');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create subscription. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await axios.put('/api/cancel-subscription');
      if (response.data.success) {
        setUserSubscription(null);
        setSelectedPlan(null);
        alert('Subscription canceled successfully');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  const formatPrice = (price, duration) => {
    const currencyInfo = currencies.find(c => c.code === currency);
    const convertedPrice = convertCurrency(price, 'USD', currency);
    
    if (duration === 'yearly') {
      const yearlyPrice = convertedPrice * 12 * 0.9; // 10% discount for yearly
      return `${currencyInfo.symbol}${yearlyPrice.toFixed(2)}/year`;
    }
    return `${currencyInfo.symbol}${convertedPrice.toFixed(2)}/month`;
  };

  const isPlanActive = (planId) => {
    return userSubscription && userSubscription.plan_id === planId && userSubscription.status === 'active';
  };

  if (loading) {
    return (
      <div className="subscription-plans">
        <div className="loading-screen">
          <div className="loader"></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-plans">
      <div className="subscription-header">
        <h1>Subscription Plans</h1>
        <p>Choose the plan that fits your business needs</p>
        <div className="subscription-controls">
          <div className="duration-toggle">
            <label className={`toggle-option ${duration === 'monthly' ? 'active' : ''}`}>
              <input
                type="radio"
                value="monthly"
                checked={duration === 'monthly'}
                onChange={(e) => setDuration(e.target.value)}
              />
              Monthly
            </label>
            <label className={`toggle-option ${duration === 'yearly' ? 'active' : ''}`}>
              <input
                type="radio"
                value="yearly"
                checked={duration === 'yearly'}
                onChange={(e) => setDuration(e.target.value)}
              />
              Yearly <span className="discount">-10%</span>
            </label>
          </div>
          <div className="currency-selector">
            <label>Currency:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${isPlanActive(plan.id) ? 'active' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <div className="plan-header">
              <h2>{plan.name}</h2>
              {plan.price === 0 && <span className="free-badge">FREE</span>}
            </div>

            <div className="plan-price">
              {formatPrice(plan.price, duration)}
            </div>

            <p className="plan-description">{plan.description}</p>

            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index} className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="plan-actions">
              {isPlanActive(plan.id) ? (
                <>
                  <button className="btn-cancel" onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </button>
                </>
              ) : (
                <button
                  className="btn-subscribe"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(plan.id);
                  }}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? 'Subscribing...' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
                  {isSubscribing ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                      </svg>
                      Subscribing...
                    </span>
                  ) : plan.price === 0 ? 'Get Started' : 'Subscribe'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {userSubscription && (
        <div className="current-subscription">
          <div className="subscription-card">
            <h3>Current Plan</h3>
            <div className="plan-info">
              <div className="plan-name">{userSubscription.plan_name}</div>
              <div className="plan-price">{formatPrice(userSubscription.price, duration)}</div>
              <div className="plan-status">
                <span className={`status-badge ${userSubscription.status}`}>{userSubscription.status}</span>
              </div>
            </div>

            <div className="subscription-details">
              <div className="detail-item">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">{new Date(userSubscription.start_date).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">End Date:</span>
                <span className="detail-value">{new Date(userSubscription.end_date).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Support Level:</span>
                <span className="detail-value">{userSubscription.support_level}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
