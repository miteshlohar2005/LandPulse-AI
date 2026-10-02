import React from 'react';
import { RiskFactor } from '../types';
import { TrendingUp, TrendingDown, HelpCircle, AlertCircle } from 'lucide-react';

interface XAIWaterfallChartProps {
  factors: RiskFactor[];
  predictedProbability: number;
}

export const XAIWaterfallChart: React.FC<XAIWaterfallChartProps> = ({ factors, predictedProbability }) => {
  const maxImpact = Math.max(...factors.map(f => Math.abs(f.impact_percentage)), 30);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Explainable AI (XAI) Attribution</h3>
            <p className="text-xs text-slate-500">
              Quantified Feature Impact on Delay Probability ({Math.round(predictedProbability * 100)}%)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center text-rose-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5"></span>
            + Delay Driver
          </span>
          <span className="flex items-center text-emerald-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span>
            - Risk Mitigator
          </span>
        </div>
      </div>

      <div className="space-y-3.5 my-4">
        {factors.map((factor, idx) => {
          const isPositive = factor.impact_direction === 'positive' || factor.impact_percentage > 0;
          const absVal = Math.abs(factor.impact_percentage);
          const barWidth = Math.min((absVal / maxImpact) * 100, 100);

          return (
            <div key={idx} className="group">
              <div className="flex justify-between items-center text-xs mb-1">
                <div className="flex items-center space-x-2">
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-800">{factor.factor_name}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {factor.category}
                  </span>
                </div>
                <span className={`font-mono font-bold text-xs ${isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isPositive ? `+${absVal.toFixed(1)}%` : `-${absVal.toFixed(1)}%`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                {isPositive ? (
                  <div
                    className="bg-gradient-to-r from-rose-500 to-rose-600 h-2.5 rounded-full transition-all duration-500 shadow-inner"
                    style={{ width: `${barWidth}%` }}
                  ></div>
                ) : (
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500 shadow-inner"
                    style={{ width: `${barWidth}%` }}
                  ></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start space-x-2">
        <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p>
          <span className="font-semibold text-slate-800">Interpretability Note:</span> Feature attribution computed via tree contribution decomposition calibrated against the historical acquisition baseline. Positive values (+%) indicate factors creating delay friction, while negative values (-%) indicate proactive mitigating factors.
        </p>
      </div>
    </div>
  );
};
