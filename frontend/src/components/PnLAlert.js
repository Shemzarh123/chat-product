import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { usePnL } from '../context/PnLContext';

const PnLAlert = () => {
  const { pnlData } = usePnL();

  if (pnlData.pnlRatio > 0.8 && pnlData.riskLevel !== 'high') return null;

  const getAlertMessage = () => {
    if (pnlData.riskLevel === 'high') {
      return `⚠️ High Risk: Losses exceeding profits by ${(1 - pnlData.pnlRatio) * 100}%! Review capital allocation.`;
    }
    if (pnlData.pnlRatio < 1.2) {
      return `📊 Monitor: PnL ratio at ${pnlData.pnlRatio.toFixed(2)}. Consider risk minimization strategies.`;
    }
    return '';
  };

  return (
    <div className={`p-4 rounded-lg border-l-8 mb-4 flex items-center gap-3 shadow-md ${
      pnlData.riskLevel === 'high' ? 'bg-red-50 border-red-500 text-red-800' :
      'bg-yellow-50 border-yellow-500 text-yellow-800'
    }`}>
      <AlertTriangle className="w-6 h-6 flex-shrink-0" />
      <div>
        <p className="font-semibold">{getAlertMessage()}</p>
        <p className="text-sm opacity-75 mt-1">
          Profit: ${pnlData.totalProfit.toFixed(2)} | Loss: ${pnlData.totalLoss.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default PnLAlert;

