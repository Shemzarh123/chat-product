import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';  // or useToast hook

const PnLContext = createContext();

export const usePnL = () => {
  const context = useContext(PnLContext);
  if (!context) {
    throw new Error('usePnL must be used within PnLProvider');
  }
  return context;
};

export const PnLProvider = ({ children }) => {
  const [pnlData, setPnlData] = useState({
    totalProfit: 0,
    totalLoss: 0,
    pnlRatio: 1,
    riskLevel: 'low',
    companies: [],
    logs: [],
    loading: true
  });
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  const fetchPnL = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/pnl/${user.id}`);
      const data = await res.json();
      setPnlData(prev => ({ ...prev, ...data, loading: false }));
    } catch (err) {
      toast.error('Failed to fetch PnL data');
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchPnL();
      const newSocket = io('http://localhost:3001');  // backend port
      newSocket.on('connect', () => {
        newSocket.emit('join-pnl', user.id);
      });
      newSocket.on('pnlUpdate', (update) => {
        setPnlData(prev => ({ ...prev, ...update }));
        if (update.riskLevel === 'high') {
          toast.error(`High risk alert: PnL ratio ${update.pnlRatio.toFixed(2)}`);
        }
      });
      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user?.id, fetchPnL]);

  const logPnL = async (type, amount, companyId, description) => {
    await fetch('/api/pnl/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, type, amount, companyId, description })
    });
  };

  return (
    <PnLContext.Provider value={{ pnlData, logPnL, refetch: fetchPnL }}>
      {children}
    </PnLContext.Provider>
  );
};

