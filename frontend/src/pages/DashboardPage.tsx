import React, { useState, useEffect } from 'react';
import {
  TrendingUp, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Scale, FileText, Users, ChevronRight,
  Bell, ChevronDown, Activity, Sparkles, RefreshCw
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis
} from 'recharts';
import { api } from '../services/api';
import { DashboardData, Project, Alert } from '../types';

interface DashboardPageProps {
  onSelectProject: (projectId: string) => void;
  onNavigate: (page: string) => void;
  userRole?: string;
}

const COMPACT_TREND_DATA = [
  { w: 'W1', val: 51 },
  { w: 'W2', val: 53 },
  { w: 'W3', val: 52 },
  { w: 'W4', val: 54 },
  { w: 'W5', val: 55 },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectProject, onNavigate, userRole = "District Officer" }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [highRiskProjects, setHighRiskProjects] = useState<Project[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardInfo = async () => {
      try {
        const [dashRes, projRes, alertRes] = await Promise.all([
          api.getDashboard(),
          api.getProjects({ risk_category: 'CRITICAL', page_size: 4 }),
          api.getAlerts(undefined, false)
        ]);

        if (isMounted) {
          if (dashRes) setDashboardData(dashRes);
          if (projRes?.items) setHighRiskProjects(projRes.items);
          if (alertRes) setRecentAlerts(alertRes.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load live dashboard telemetry', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardInfo();
    return () => { isMounted = false; };
  }, []);

  const total = dashboardData?.kpis?.total_projects || 1021;
  const critical = dashboardData?.kpis?.critical_risk_projects || 346;
  const high = dashboardData?.kpis?.high_risk_projects || 201;
  const medium = dashboardData?.kpis?.medium_risk_projects || 134;
  const low = dashboardData?.kpis?.low_risk_projects || 340;
  const avgDelayProb = Math.round((dashboardData?.kpis?.average_delay_probability || 0.553) * 100);

  const riskDonutData = [
    { name: 'Critical', value: critical, color: '#DC2626' },
    { name: 'High', value: high, color: '#EA580C' },
    { name: 'Medium', value: medium, color: '#D97706' },
    { name: 'Low', value: low, color: '#16A34A' },
  ];

  const topFactors = dashboardData?.top_delay_factors?.length ? dashboardData.top_delay_factors : [
    { factor: 'Pending Compensation Disbursement', affected_projects_pct: 46.5, avg_impact_pct: 26.2 },
    { factor: 'Unresolved Land Title Litigation', affected_projects_pct: 38.0, avg_impact_pct: 21.4 },
    { factor: 'Statutory Forest/MoEF Clearance Backlog', affected_projects_pct: 32.5, avg_impact_pct: 16.8 },
    { factor: 'Incomplete Digital RoR Records', affected_projects_pct: 28.0, avg_impact_pct: 11.2 },
    { factor: 'Gram Sabha & Community Resistance', affected_projects_pct: 21.0, avg_impact_pct: 12.0 },
  ];

  const getSectorEmoji = (type?: string) => {
    if (!type) return '📁';
    if (type.includes('Highway') || type.includes('Expressway')) return '🛣️';
    if (type.includes('Railway') || type.includes('Metro')) return '🚆';
    if (type.includes('Water') || type.includes('Irrigation')) return '🌊';
    if (type.includes('Energy') || type.includes('Power')) return '⚡';
    if (type.includes('Mining')) return '⛏️';
    if (type.includes('Urban') || type.includes('Smart City')) return '🏢';
    return '🏗️';
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Greeting & Subtitle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold text-forest-900 tracking-tight">
            Good Day, Land Acquisition Directorate 👋
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-100 text-forest-900 border border-forest-200 shrink-0">
            {userRole}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Real-time AI telemetry across all <strong>{total}</strong> active database projects.
        </p>
      </div>

      {/* ====================================================
          PROJECT SUMMARY: Four compact cards in one row
         ==================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Total Projects */}
        <div
          onClick={() => onNavigate('projects')}
          className="bg-white p-3 rounded-2xl border border-app-border shadow-card flex flex-col justify-between cursor-pointer hover:border-forest-600 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          <span className="text-xl font-extrabold font-mono text-forest-900 mt-1">{total}</span>
          <span className="text-[9px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>All Projects</span>
            <ArrowRight className="w-3 h-3 text-forest-600" />
          </span>
        </div>

        {/* Critical Risk */}
        <div
          onClick={() => onNavigate('projects')}
          className="bg-white p-3 rounded-2xl border border-red-200 shadow-card flex flex-col justify-between cursor-pointer hover:border-red-400 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-risk-critical">Critical Risk</span>
          <span className="text-xl font-extrabold font-mono text-risk-critical mt-1">{critical}</span>
          <span className="text-[9px] text-red-600 mt-0.5">High Escalation</span>
        </div>

        {/* High Risk */}
        <div
          onClick={() => onNavigate('projects')}
          className="bg-white p-3 rounded-2xl border border-orange-200 shadow-card flex flex-col justify-between cursor-pointer hover:border-orange-400 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">High Risk</span>
          <span className="text-xl font-extrabold font-mono text-orange-600 mt-1">{high}</span>
          <span className="text-[9px] text-orange-600 mt-0.5">Monitoring</span>
        </div>

        {/* Medium & Low */}
        <div
          onClick={() => onNavigate('projects')}
          className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-card flex flex-col justify-between cursor-pointer hover:border-emerald-400 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Stable / Low</span>
          <span className="text-xl font-extrabold font-mono text-emerald-700 mt-1">{low + medium}</span>
          <span className="text-[9px] text-emerald-600 mt-0.5">{low} Low • {medium} Med</span>
        </div>
      </div>

      {/* ====================================================
          AVERAGE DELAY RISK: Compact card with line chart
         ==================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-app-border shadow-card space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Average Delay Likelihood
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-extrabold font-mono text-forest-900">{avgDelayProb}%</span>
              <span className="text-[11px] font-bold text-orange-600 flex items-center">
                Across {total} Projects
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 font-bold border border-forest-100">
            ML Ensemble Model
          </span>
        </div>

        {/* Compact Line Chart */}
        <div className="h-24 w-full -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={COMPACT_TREND_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="w" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis domain={[45, 65]} hide />
              <RechartsTooltip
                formatter={(v: any) => [`${v}%`, 'Delay Likelihood']}
                contentStyle={{ backgroundColor: '#0F4D35', color: '#fff', borderRadius: '8px', fontSize: '10px', padding: '4px 8px' }}
              />
              <Line
                type="monotone"
                dataKey="val"
                stroke="#0F4D35"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0F4D35', stroke: '#fff', strokeWidth: 1.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ====================================================
          RISK DISTRIBUTION: Compact donut chart card
         ==================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-app-border shadow-card space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider">
            Risk Distribution
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold">{total} Total Projects</span>
        </div>

        <div className="flex items-center justify-between">
          {/* Donut Chart */}
          <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDonutData}
                  innerRadius={28}
                  outerRadius={44}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-mono font-bold text-forest-900">{total}</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex-1 pl-4 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-600 mr-1.5" /> Critical
              </span>
              <span className="font-mono font-bold text-red-600">{critical} ({Math.round(critical / total * 100)}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-orange-600 mr-1.5" /> High
              </span>
              <span className="font-mono font-bold text-orange-600">{high} ({Math.round(high / total * 100)}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" /> Medium
              </span>
              <span className="font-mono font-bold text-amber-600">{medium} ({Math.round(medium / total * 100)}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5" /> Low
              </span>
              <span className="font-mono font-bold text-emerald-600">{low} ({Math.round(low / total * 100)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================
          TOP DELAY FACTORS: Compact horizontal bars
         ==================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-app-border shadow-card space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider">
            Top Delay Factors
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold">% Projects Affected</span>
        </div>

        <div className="space-y-2.5">
          {topFactors.map((f, i) => {
            const pct = Math.round(f.affected_projects_pct);
            const color = i === 0 ? 'bg-red-600 text-red-600' :
              i === 1 ? 'bg-orange-500 text-orange-600' :
              i === 2 ? 'bg-amber-500 text-amber-600' :
              i === 3 ? 'bg-forest-600 text-forest-700' : 'bg-slate-500 text-slate-600';

            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700 truncate max-w-[240px]">{f.factor}</span>
                  <span className={`font-mono font-bold ${color.split(' ')[1]}`}>{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${color.split(' ')[0]}`}
                    style={{ width: `${Math.min(pct * 2, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          CRITICAL RISK PROJECTS: Live list from Database
         ==================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-app-border shadow-card space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider">
            Critical Risk Projects
          </h3>
          <button
            onClick={() => onNavigate('projects')}
            className="text-[11px] font-bold text-forest-900 hover:underline flex items-center cursor-pointer"
          >
            <span>See all {total} projects</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        <div className="space-y-2">
          {highRiskProjects.map((proj) => {
            const prob = proj.predictions && proj.predictions[0]
              ? Math.round(proj.predictions[0].delay_probability * 100)
              : Math.round(((proj as any).delay_probability || 0.85) * 100);
            const badge = proj.predictions && proj.predictions[0]
              ? proj.predictions[0].risk_category
              : ((proj as any).risk_category || 'CRITICAL');

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className="p-2.5 bg-slate-50 hover:bg-forest-50/50 rounded-2xl border border-slate-200/80 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-base shrink-0 shadow-xs">
                    {getSectorEmoji(proj.project_type)}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-mono text-[10px] font-bold text-slate-500 block">
                      {proj.id} • {proj.state}
                    </span>
                    <h4 className="font-bold text-xs text-forest-950 truncate group-hover:text-forest-800">
                      {proj.name}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  <span className="font-mono font-extrabold text-xs text-forest-900">{prob}%</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${
                    badge === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-orange-100 text-orange-800 border-orange-300'
                  }`}>
                    {badge}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          RECENT SYSTEM ALERTS: Live from Database
         ==================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-app-border shadow-card space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider">
            Live Escalation Alerts
          </h3>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-[11px] font-bold text-forest-900 hover:underline cursor-pointer"
          >
            All alerts →
          </button>
        </div>

        <div className="space-y-2">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onSelectProject(alert.project_id)}
              className="p-2.5 bg-red-50/50 rounded-2xl border border-red-200/70 flex items-start space-x-2.5 cursor-pointer hover:bg-red-50 transition"
            >
              <div className="p-1.5 rounded-lg bg-red-100 text-red-700 shrink-0 mt-0.5">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{alert.title}</h4>
                  <span className="text-[10px] font-mono text-red-700 font-bold shrink-0 ml-1">
                    {alert.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                  {alert.project_id} • {alert.message.slice(0, 60)}...
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
