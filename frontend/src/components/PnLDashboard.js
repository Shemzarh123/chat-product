import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Shield, DollarSign } from 'lucide-react';
import { usePnL } from '../context/PnLContext';
import { useAuth } from '../context/AuthContext';

const PnLDashboard = () => {
  const { pnlData, refetch } = usePnL();
  const { user } = useAuth();

  const riskColor = pnlData.riskLevel === 'high' ? '#ef4444' : pnlData.riskLevel === 'medium' ? '#f59e0b' : '#10b981';
  const chartData = pnlData.logs.slice(-30).map(log => ({
    date: new Date(log.created_at).toLocaleTimeString(),
    profit: log.type === 'profit' ? log.amount : 0,
    loss: log.type === 'loss' ? -log.amount : 0
  }));

  if (pnlData.loading) return <div className="p-4 text-center">Loading PnL...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6" /> Real-time PnL Dashboard
      </h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Total Profit</span>
          </div>
          <div className="text-2xl font-bold text-green-600">${pnlData.totalProfit.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span>Total Loss</span>
          </div>
          <div className="text-2xl font-bold text-red-600">${pnlData.totalLoss.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span>Ratio</span>
          </div>
          <div className={`text-2xl font-bold ${pnlData.pnlRatio > 1 ? 'text-green-600' : 'text-red-600'}`}>
            {pnlData.pnlRatio.toFixed(2)}
          </div>
        </div>
        <div className="p-4 bg-gray-50 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-5 h-5 ${riskColor}`} />
            <span>Risk Level</span>
          </div>
          <div className={`text-xl font-bold ${riskColor}`}>
            {pnlData.riskLevel.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">PnL Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" />
              <Line type="monotone" dataKey="loss" stroke="#ef4444" name="Loss" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">Companies Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pnlData.companies}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="capital_allocated" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Logs */}
      <div>
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {pnlData.logs.slice(0, 5).map((log) => (
            <div key={log.id} className={`p-3 rounded-lg flex justify-between items-center ${
              log.type === 'profit' ? 'bg-green-50 border-l-4 border-green-400' :
              log.type === 'loss' ? 'bg-red-50 border-l-4 border-red-400' : 'bg-blue-50 border-l-4 border-blue-400'
            }`}>
              <span>{log.description}</span>
              <span className={`font-bold ${
                log.type === 'profit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {log.type === 'profit' ? '+' : ''}${Math.abs(log.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={refetch}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh
      </button>
    </div>
  );
};

export default PnLDashboard;

