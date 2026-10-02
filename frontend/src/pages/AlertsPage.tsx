import React, { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, CheckCircle2, ArrowRight, Check,
  Clock, ShieldAlert, Filter, Eye, Search, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Alert } from '../types';

interface AlertsPageProps {
  onSelectProject: (projectId: string) => void;
  userRole?: string;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onSelectProject }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'All' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('All');

  const fetchLiveAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts(filterCategory === 'All' ? undefined : filterCategory);
      setAlerts(res || []);
    } catch (err) {
      console.error('Failed to fetch alerts from API', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAlerts();
  }, [filterCategory]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: true } : a));
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
      // Optimistic update
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: true } : a));
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return a.project_id.toLowerCase().includes(q) ||
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.message && a.message.toLowerCase().includes(q)) ||
      (a.primary_factor && a.primary_factor.toLowerCase().includes(q));
  });

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-forest-950 tracking-tight">System Alerts</h1>
            <span className="bg-red-100 text-red-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-red-200">
              {alerts.length} Total Alerts
            </span>
          </div>
          <p className="text-xs text-warm-600 font-medium mt-0.5">
            Real-time threshold breaches, statutory delay alerts, and risk escalations across all infrastructure projects.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-warm-200 shadow-soft-sm text-xs font-bold">
          {(['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-forest-900 text-white shadow-soft-sm'
                  : 'text-warm-600 hover:text-forest-950'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-warm-200 shadow-soft-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-warm-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by Project ID (e.g. LA-JH-2026-0042) or keyword..."
            className="w-full pl-9 pr-4 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs font-medium text-warm-900 focus:outline-hidden focus:border-forest-700 focus:bg-white transition"
          />
        </div>

        <div className="text-xs font-semibold text-warm-600 self-end sm:self-auto flex items-center space-x-2">
          {loading ? (
            <span className="flex items-center text-forest-700">
              <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
              Loading real alerts...
            </span>
          ) : (
            <span>Showing <strong>{filteredAlerts.length}</strong> of {alerts.length} alerts</span>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 && !loading && (
          <div className="bg-white rounded-3xl p-12 text-center border border-warm-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-base text-forest-950">No alerts found</h3>
            <p className="text-xs text-warm-500 mt-1">Try resetting the search query or selecting "All".</p>
          </div>
        )}

        {filteredAlerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isHigh = alert.severity === 'HIGH';
          const badgeColor = isCritical
            ? 'bg-red-100 text-red-800 border-red-300'
            : isHigh
            ? 'bg-orange-100 text-orange-800 border-orange-300'
            : 'bg-amber-100 text-amber-800 border-amber-300';

          return (
            <div
              key={alert.id}
              className={`bg-white rounded-3xl p-6 border shadow-soft-sm transition-all space-y-4 ${
                alert.is_acknowledged ? 'border-warm-200 opacity-80' : 'border-orange-300 shadow-soft-md'
              }`}
            >
              {/* Alert Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl shrink-0 ${isCritical ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeColor}`}>
                        {alert.severity} RISK ALERT
                      </span>
                      <button
                        onClick={() => onSelectProject(alert.project_id)}
                        className="font-mono text-xs font-bold text-forest-900 bg-warm-100 hover:bg-forest-100 px-2 py-0.5 rounded border border-warm-200 transition cursor-pointer"
                        title="Click to view project dossier"
                      >
                        {alert.project_id}
                      </button>
                    </div>
                    <h3 className="font-bold text-base text-forest-950 mt-1">{alert.title}</h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-warm-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Just now'}</span>
                </div>
              </div>

              {/* Alert Body */}
              <div className="p-4 bg-warm-50 rounded-2xl border border-warm-200 space-y-2 text-xs">
                <p className="text-forest-950 font-semibold text-sm">
                  "{alert.message}"
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-warm-500 block">Primary Reason</span>
                    <span className="font-semibold text-warm-800">{alert.primary_factor || 'Disbursement Delay / Pending Statutory Clearance'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-warm-500 block">Recommended Action</span>
                    <span className="font-semibold text-forest-900">{alert.recommended_action || 'Review corridor bottlenecks and expedite nodal approvals.'}</span>
                  </div>
                </div>
              </div>

              {/* Actions: Acknowledge alert, View project */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={alert.is_acknowledged}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      alert.is_acknowledged
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-warm-100 hover:bg-warm-200 text-forest-950'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{alert.is_acknowledged ? 'Acknowledged' : 'Acknowledge Alert'}</span>
                  </button>
                </div>

                <button
                  onClick={() => onSelectProject(alert.project_id)}
                  className="px-4 py-2 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-soft cursor-pointer"
                >
                  <span>Open Project Dossier ({alert.project_id})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
