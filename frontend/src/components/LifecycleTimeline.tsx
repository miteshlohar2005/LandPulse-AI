import React from 'react';
import { ProjectStage } from '../types';
import { CheckCircle, AlertCircle, Clock, AlertTriangle } from 'lucide-react';

interface LifecycleTimelineProps {
  stages: ProjectStage[];
}

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({ stages }) => {
  const sortedStages = [...stages].sort((a, b) => a.stage_number - b.stage_number);

  const getStatusBadge = (status: ProjectStage['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> Completed
          </span>
        );
      case 'Delayed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 mr-1 text-rose-600" /> Delayed
          </span>
        );
      case 'At Risk':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" /> At Risk
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-100 text-sky-800 border border-sky-300">
            <Clock className="w-3 h-3 mr-1 text-sky-600" /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Pending
          </span>
        );
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 75) return 'text-rose-600 font-bold';
    if (risk >= 50) return 'text-amber-600 font-semibold';
    if (risk >= 25) return 'text-sky-600 font-medium';
    return 'text-emerald-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">RFCTLARR Statutory Acquisition Lifecycle</h3>
          <p className="text-xs text-slate-500">9 Mandated Stages under the 2013 Land Acquisition Act</p>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-500">
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span>Completed</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 mr-1.5"></span>In Progress</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span>At Risk</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5"></span>Delayed</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold text-left">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Statutory Stage</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Duration (Exp / Act)</th>
              <th className="py-2.5 px-3">Delay Risk</th>
              <th className="py-2.5 px-3">Primary Bottleneck Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedStages.map((stage) => (
              <tr
                key={stage.stage_number}
                className={`hover:bg-slate-50/80 transition-colors ${
                  stage.status === 'Delayed' ? 'bg-rose-50/30' : stage.status === 'At Risk' ? 'bg-amber-50/20' : ''
                }`}
              >
                <td className="py-2.5 px-3 font-semibold text-slate-500">{stage.stage_number}</td>
                <td className="py-2.5 px-3 font-medium text-slate-900">{stage.stage_name}</td>
                <td className="py-2.5 px-3">{getStatusBadge(stage.status)}</td>
                <td className="py-2.5 px-3 text-slate-600">
                  <span className="font-semibold">{stage.expected_duration_days}d</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className={stage.actual_duration_days > stage.expected_duration_days ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                    {stage.actual_duration_days > 0 ? `${stage.actual_duration_days}d` : '—'}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={getRiskColor(stage.stage_risk)}>
                    {stage.stage_risk.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-700">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                    stage.bottleneck.includes('Pending') || stage.bottleneck.includes('court') || stage.bottleneck.includes('lag')
                      ? 'bg-rose-50 text-rose-700 font-medium border border-rose-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {stage.bottleneck}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
