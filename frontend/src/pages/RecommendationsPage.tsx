import React, { useState, useEffect } from 'react';
import { Lightbulb, Building, CheckCircle, RefreshCw, Eye, Filter, Search, ArrowRight } from 'lucide-react';
import { Recommendation, UserRole } from '../types';
import { api } from '../services/api';

interface RecommendationsPageProps {
  onSelectProject: (projectId: string) => void;
  userRole?: UserRole;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ onSelectProject, userRole }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const data = await api.getRecommendations(undefined, statusFilter || undefined);
      setRecommendations(data || []);
    } catch (e) {
      console.error('Failed to load recommendations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, [statusFilter]);

  const handleStatusChange = async (recId: number, status: string) => {
    try {
      await api.updateRecommendationStatus(recId, status);
      fetchRecs();
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const filtered = recommendations.filter(r => {
    const matchesSeverity = !severityFilter || r.severity === severityFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      r.project_id.toLowerCase().includes(q) ||
      (r.problem && r.problem.toLowerCase().includes(q)) ||
      (r.recommended_action && r.recommended_action.toLowerCase().includes(q)) ||
      (r.responsible_department && r.responsible_department.toLowerCase().includes(q));

    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
              Statutory Corrective Action Directives
            </h2>
            <span className="bg-amber-100 text-amber-900 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
              {recommendations.length} Active Directives
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule + AI recommendations mapped to bottleneck nodes for Revenue, PWD, NHAI, and District Collectorates.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Implemented">Implemented</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-soft-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search directives by Project ID (e.g. LA-JH-2026-0042) or keyword..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-forest-700 focus:bg-white transition"
          />
        </div>

        <div className="text-xs font-semibold text-slate-600 self-end sm:self-auto">
          Showing <strong>{filtered.length}</strong> of {recommendations.length} directives
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-6 h-6 text-sky-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Compiling corrective directives across all projects...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No recommendations found</p>
          <p className="text-xs text-slate-500 mt-1">Try relaxing filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition space-y-2.5 text-xs"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rec.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {rec.severity}
                  </span>
                  <button
                    onClick={() => onSelectProject(rec.project_id)}
                    className="font-mono font-bold text-sky-700 hover:underline cursor-pointer"
                  >
                    {rec.project_id}
                  </button>
                  <span className="font-bold text-slate-900 text-sm">{rec.problem}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {rec.priority}
                  </span>
                  <select
                    value={rec.status}
                    disabled={userRole === 'Viewer'}
                    onChange={(e) => handleStatusChange(rec.id, e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Implemented">Implemented</option>
                    <option value="Dismissed">Dismissed</option>
                  </select>
                  <button
                    onClick={() => onSelectProject(rec.project_id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-forest-900 text-white hover:bg-forest-950 rounded text-xs font-semibold transition cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Project Dossier</span>
                  </button>
                </div>
              </div>

              <p className="text-slate-800 font-medium text-xs sm:text-sm pl-2 border-l-2 border-amber-500">
                {rec.recommended_action}
              </p>

              <div className="flex flex-wrap justify-between items-center pt-2 border-t border-slate-100 text-[11px] text-slate-500 gap-2">
                <span className="flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Responsible Unit: <strong className="text-slate-800 ml-1">{rec.responsible_department}</strong>
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {rec.expected_impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
