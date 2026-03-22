import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy">
      <div className="container">
        <div className="header">
          <Link to="/whatsapp-register" className="back-link">← Back to Sign Up</Link>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: March 19, 2026</p>
        </div>
        
        <div className="content">
          <section>
            <h2>1. Information We Collect</h2>
            <p>
              We collect several types of information from and about users of our service, including:
            </p>
            <ul>
              <li>Personal identification information (Name, email address, phone number, etc.)</li>
              <li>Account credentials (Username and password)</li>
              <li>Usage data (How you interact with our service)</li>
              <li>Communication data (Messages sent and received through our chat system)</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect in various ways, including to:
            </p>
            <ul>
              <li>Provide, operate, and maintain our service</li>
              <li>Improve, personalize, and expand our service</li>
              <li>Understand and analyze how you use our service</li>
              <li>Develop new products, services, features, and functionality</li>
              <li>Communicate with you, either directly or through one of our partners</li>
              <li>Process your transactions and manage your orders</li>
              <li>Send you emails</li>
              <li>Find and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2>3. Information Sharing and Disclosure</h2>
            <p>
              We may share personal information that we collect, or you provide:
            </p>
            <ul>
              <li>With service providers, to monitor and analyze the use of our service</li>
              <li>For business transfers, if we were to merge with or acquire another company</li>
              <li>With your consent</li>
              <li>To comply with legal process</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Security</h2>
            <p>
              We have implemented appropriate security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our service.
            </p>
          </section>

          <section>
            <h2>5. Your Data Protection Rights</h2>
            <p>
              Depending on your location, you may have certain data protection rights. These may include:
            </p>
            <ul>
              <li>The right to access, update, or delete the information we have on you</li>
              <li>The right of rectification</li>
              <li>The right to object</li>
              <li>The right of restriction</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2>6. Changes to Our Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
