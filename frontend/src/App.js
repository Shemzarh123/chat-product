import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import ChatWidget from './components/ChatWidget';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/" element={
          <div className="landing-page">
            <h1>RecoverFlow</h1>
            <p>Revenue Recovery Chat for Service Businesses</p>
            <ChatWidget />
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;