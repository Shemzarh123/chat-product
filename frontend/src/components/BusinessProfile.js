import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BusinessProfile.css';

const BusinessProfile = () => {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    featured: false
  });
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

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Base currency is USD (as per Stripe)
    const usdAmount = fromCurrency === 'USD' ? amount : amount / exchangeRates[fromCurrency];
    return toCurrency === 'USD' ? usdAmount : usdAmount * exchangeRates[toCurrency];
  };

  const fetchData = async () => {
    try {
      const [profileRes, productsRes] = await Promise.all([
        axios.get('/api/user/profile'),
        axios.get('/api/products')
      ]);
      
      setProfile(profileRes.data.user.business_profile);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put('/api/business/profile', profile);
      setProfile(res.data);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/products', newProduct);
      setProducts([...products, res.data]);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        featured: false
      });
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleProductDelete = async (productId) => {
    try {
      await axios.delete(`/api/products/${productId}`);
      setProducts(products.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleBuyNow = async (product) => {
    try {
      const convertedPrice = convertCurrency(product.price, 'USD', currency);
      const res = await axios.post('/api/create-payment-request', {
        amount: convertedPrice,
        description: product.name,
        leadId: null,
        currency: currency
      });
      
      if (res.data.success) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Error creating payment request:', error);
    }
  };

  const handleBookAppointment = () => {
    // Open appointment booking interface
    console.log('Book appointment');
  };

  const handleRequestQuote = () => {
    // Open quote request interface
    console.log('Request quote');
  };

  if (loading) {
    return (
      <div className="business-profile">
        <div className="loading-screen">
          <div className="loader"></div>
          <p>Loading your business profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-profile">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-info">
            <div className="business-avatar-large">
              {profile.business_name.charAt(0)}
            </div>
            <h1 className="hero-title">{profile.business_name}</h1>
            <p className="hero-description">{profile.description}</p>
            <div className="hero-meta">
              <span className="business-phone">{profile.phone_number}</span>
              <span className="business-industry">{profile.industry}</span>
              {profile.verified && <span className="verified-badge-large">Verified</span>}
            </div>
          </div>
          <button className="btn-edit-large" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </section>

      {/* Storefront CTA Buttons */}
      <section className="storefront-cta">
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
        <button className="btn-primary btn-buy" onClick={() => alert('Choose a product to buy')}>
          <span className="btn-icon">🛒</span>
          Buy Now
        </button>
        <button className="btn-secondary btn-book" onClick={handleBookAppointment}>
          <span className="btn-icon">📅</span>
          Book Appointment
        </button>
        <button className="btn-secondary btn-quote" onClick={handleRequestQuote}>
          <span className="btn-icon">📄</span>
          Request Invoice
        </button>
      </section>

      {editing && (
        <section className="profile-form">
          <h2>Edit Business Profile</h2>
          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label>Business Name</label>
              <input
                type="text"
                value={profile.business_name}
                onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                value={profile.phone_number}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input
                type="text"
                value={profile.industry}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Save Changes</button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {/* Featured Products */}
      {products.some(p => p.featured) && (
        <section className="featured-products">
          <div className="section-header">
            <h2>⭐ Featured Products</h2>
          </div>
          <div className="featured-grid">
            {products.filter(p => p.featured).map((product) => (
              <div key={product.id} className="featured-product-card">
                {product.image_url && (
                  <div className="featured-product-image">
                    <img src={product.image_url} alt={product.name} />
                  </div>
                )}
                <div className="featured-product-info">
                  <h3>{product.name}</h3>
                  <p className="featured-product-description">{product.description}</p>
                  <div className="featured-product-footer">
                    <span className="featured-product-price">
                      {currencies.find(c => c.code === currency).symbol}
                      {convertCurrency(product.price, 'USD', currency).toFixed(2)}
                    </span>
                    {product.category && <span className="featured-product-category">{product.category}</span>}
                    <button className="btn-buy-now-large" onClick={() => handleBuyNow(product)}>
                      <span className="btn-icon">🛒</span>
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="products-section">
        <div className="section-header">
          <h2>All Products & Services</h2>
          <button className="btn-add" onClick={() => setNewProduct({ ...newProduct, showForm: true })}>
            + Add Product
          </button>
        </div>

        {newProduct.showForm && (
          <div className="product-form">
            <h3>Add New Product</h3>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Featured</label>
                <input
                  type="checkbox"
                  checked={newProduct.featured}
                  onChange={(e) => setNewProduct({ ...newProduct, featured: e.target.checked })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Add Product</button>
                <button type="button" className="btn-secondary" onClick={() => setNewProduct({ ...newProduct, showForm: false })}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              {product.image_url && (
                <div className="product-image">
                  <img src={product.image_url} alt={product.name} />
                </div>
              )}
              <div className="product-info">
                <div className="product-header">
                  <h3>{product.name}</h3>
                  {product.featured && <span className="featured-badge">Featured</span>}
                </div>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                  <span className="product-price">
                    {currencies.find(c => c.code === currency).symbol}
                    {convertCurrency(product.price, 'USD', currency).toFixed(2)}
                  </span>
                  {product.category && <span className="product-category">{product.category}</span>}
                  <div className="product-actions">
                    <button className="btn-buy-now" onClick={() => handleBuyNow(product)}>
                      <span className="btn-icon">🛒</span>
                      Buy Now
                    </button>
                    <button className="btn-delete" onClick={() => handleProductDelete(product.id)}>
                      <span className="btn-icon">🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !newProduct.showForm && (
          <div className="empty-state">
            <p>No products added yet</p>
            <span>Add your first product to start selling</span>
          </div>
        )}
      </section>
    </div>
  );
};

export default BusinessProfile;
