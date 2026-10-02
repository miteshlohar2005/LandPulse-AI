import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Share2, MapPin, AlertTriangle, CheckCircle2,
  Clock, Scale, FileText, Users, Building, Shield, ChevronRight,
  Sparkles, RefreshCw, X, ArrowRight, Check
} from 'lucide-react';
import { DEMO_PROJECTS, ProjectItem } from '../data/demoData';
import { api } from '../services/api';

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
  onNavigate?: (page: string) => void;
  userRole?: string;
}

interface StageCircle {
  id: number;
  name: string;
  shortName: string;
  status: 'Completed' | 'In Progress' | 'Delayed' | 'Pending';
  icon: string;
  days: string;
  bottleneck?: string;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  onBack,
  onNavigate
}) => {
  const initial = DEMO_PROJECTS.find(p => p.id === projectId) || DEMO_PROJECTS[0];
  const [project, setProject] = useState<ProjectItem>(initial);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<StageCircle | null>(null);
  const [showRecalcModal, setShowRecalcModal] = useState<boolean>(false);

  // Load project details dynamically from database
  useEffect(() => {
    let isMounted = true;
    const loadDetail = async () => {
      try {
        const res = await api.getProjectDetail(projectId);
        if (isMounted && res) {
          const mapped: ProjectItem = {
            id: res.id,
            name: res.name,
            state: res.state,
            district: res.district,
            project_type: res.project_type,
            land_area_hectares: res.land_area_hectares,
            affected_families: res.affected_families,
            compensation_percentage: res.compensation_percentage,
            compensation_budget_cr: res.compensation_budget_cr,
            compensation_disbursed_cr: res.compensation_disbursed_cr,
            approval_delay_days: res.approval_delay_days,
            legal_disputes_count: res.legal_disputes_count,
            documentation_complete: res.documentation_complete,
            notification_complete: res.notification_complete,
            possession_percentage: res.possession_percentage,
            rehabilitation_percentage: res.rehabilitation_percentage,
            stakeholder_responsiveness: res.stakeholder_responsiveness,
            current_stage: res.current_stage,
            risk_score: res.latest_prediction?.risk_score ?? (res as any).risk_score ?? 5.0,
            delay_probability: res.latest_prediction?.delay_probability ?? (res as any).delay_probability ?? 0.5,
            risk_category: res.latest_prediction?.risk_category ?? (res as any).risk_category ?? 'LOW',
            predicted_delay_days: res.latest_prediction?.predicted_delay_days ?? (res as any).predicted_delay_days ?? 30,
            confidence_score: res.latest_prediction?.confidence_score ?? (res as any).confidence_score ?? 0.85,
            last_updated: "Active Database",
            latitude: res.latitude,
            longitude: res.longitude,
            bottleneck: res.recommendations?.[0]?.problem || "Statutory RFCTLARR review active"
          };
          setProject(mapped);
          setCompDisbursed(res.compensation_disbursed_cr);
          setLegalCount(res.legal_disputes_count);
        }
      } catch {
        // Fallback to local demo data
      }
    };
    loadDetail();
    return () => { isMounted = false; };
  }, [projectId]);

  // Recalculation Form Fields
  const [compDisbursed, setCompDisbursed] = useState<number>(project.compensation_disbursed_cr);
  const [legalCount, setLegalCount] = useState<number>(project.legal_disputes_count);
  const [recalculating, setRecalculating] = useState<boolean>(false);

  const stages: StageCircle[] = [
    { id: 1, name: "Investigation", shortName: "Invest.", status: "Completed", icon: "🔍", days: "45d" },
    { id: 2, name: "Notification", shortName: "Notif.", status: "Completed", icon: "📢", days: "28d" },
    { id: 3, name: "Survey", shortName: "Survey", status: "Completed", icon: "📐", days: "58d" },
    { id: 4, name: "Legal Review", shortName: "Legal", status: "In Progress", icon: "⚖️", days: "75d", bottleneck: "4 title disputes pending" },
    { id: 5, name: "Compensation", shortName: "Comp.", status: "Delayed", icon: "💰", days: "145d", bottleneck: "Only 29.0% compensation disbursed" },
    { id: 6, name: "R&R", shortName: "R&R", status: "In Progress", icon: "🏘️", days: "40d" },
    { id: 7, name: "Possession", shortName: "Possess.", status: "Pending", icon: "🚩", days: "0d" },
    { id: 8, name: "Acquisition", shortName: "Acq.", status: "Pending", icon: "📜", days: "0d" },
  ];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setRecalculating(true);

    setTimeout(() => {
      const compPct = Math.min(100, Math.round((compDisbursed / project.compensation_budget_cr) * 100));
      const isResolved = compPct >= 80 && legalCount === 0;

      setProject({
        ...project,
        compensation_disbursed_cr: compDisbursed,
        compensation_percentage: compPct,
        legal_disputes_count: legalCount,
        risk_score: isResolved ? 2.1 : 5.4,
        delay_probability: isResolved ? 0.19 : 0.52,
        predicted_delay_days: isResolved ? 12 : 36,
        risk_category: isResolved ? 'LOW' : 'MEDIUM',
        last_updated: "Just now"
      });

      setRecalculating(false);
      setShowRecalcModal(false);
    }, 1200);
  };

  const isHighRisk = project.risk_category === 'HIGH' || project.risk_category === 'CRITICAL';

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* ====================================================
          HEADER: [←] Project Details [Share Icon]
         ==================================================== */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-forest-900 hover:bg-forest-50 rounded-lg transition cursor-pointer"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-sm font-extrabold text-forest-900 uppercase tracking-wider">
          Project Details
        </h1>

        <button
          onClick={handleShare}
          className="p-1.5 -mr-1 text-slate-500 hover:text-forest-900 transition cursor-pointer"
          aria-label="Share Project"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {copied && (
        <div className="p-2 bg-forest-900 text-white text-[11px] font-bold rounded-xl text-center animate-fadeIn">
          Link copied to clipboard!
        </div>
      )}

      {/* ====================================================
          PROJECT IMAGE: Wide image at top with rounded corners
          & HIGH RISK badge on image
         ==================================================== */}
      <div className="relative rounded-3xl overflow-hidden aspect-16/9 bg-gradient-to-br from-[#0F382A] via-[#123D30] to-[#0A261E] border border-app-border shadow-card flex items-center justify-center text-white p-4">
        {/* Topography overlay */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4ADE80_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Vector road highway illustration */}
        <svg viewBox="0 0 280 140" className="w-full h-full opacity-60">
          <path d="M 20 120 Q 140 30 260 90" stroke="#F59E0B" strokeWidth="18" fill="none" strokeLinecap="round" />
          <path d="M 20 120 Q 140 30 260 90" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="8 8" fill="none" />
          <circle cx="140" cy="55" r="7" fill="#E53935" stroke="#FFFFFF" strokeWidth="2" />
        </svg>

        {/* High Risk Badge on top right of the image */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border shadow-md ${
            isHighRisk ? 'bg-red-500 text-white border-red-400' : 'bg-forest-600 text-white border-forest-400'
          }`}>
            {project.risk_category} RISK
          </span>
        </div>

        {/* Project Type Badge on bottom left */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-1 text-[10px] font-bold bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full text-white">
          <MapPin className="w-3 h-3 text-forest-300" />
          <span>{project.project_type}</span>
        </div>
      </div>

      {/* ====================================================
          PROJECT INFORMATION:
          Ranchi Infrastructure Project, LA-JH-2026-0042, 📍 Jharkhand • Ranchi
         ==================================================== */}
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <h2 className="text-lg font-extrabold text-forest-950 leading-tight">
            {project.name}
          </h2>
          <button
            onClick={() => setShowRecalcModal(true)}
            className="text-[11px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-lg border border-forest-200 shrink-0 ml-2"
          >
            Update
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
            {project.id}
          </span>
          <span className="text-slate-500 flex items-center">
            <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
            {project.state} • {project.district}
          </span>
        </div>
      </div>

      {/* ====================================================
          RISK METRICS: 2 x 2 compact grid + multi-color risk indicator
         ==================================================== */}
      <div className="bg-white rounded-3xl p-4 border border-app-border shadow-card space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Risk Score</span>
            <span className="text-lg font-extrabold font-mono text-forest-950 mt-0.5 block">
              {project.risk_score} / 10
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Delay Probability</span>
            <span className="text-lg font-extrabold font-mono text-risk-high mt-0.5 block">
              {Math.round(project.delay_probability * 100)}%
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Predicted Delay</span>
            <span className="text-lg font-extrabold font-mono text-forest-950 mt-0.5 block">
              +{project.predicted_delay_days} Days
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence</span>
            <span className="text-lg font-extrabold font-mono text-forest-950 mt-0.5 block">
              {Math.round(project.confidence_score * 100)}%
            </span>
          </div>
        </div>

        {/* Multi-Color Risk Indicator Bar */}
        <div className="space-y-1 pt-1">
          <div className="h-2.5 w-full rounded-full bg-slate-200 flex overflow-hidden">
            <div className="w-1/4 bg-risk-low" title="Low" />
            <div className="w-1/4 bg-risk-medium" title="Medium" />
            <div className="w-1/4 bg-orange-500" title="High" />
            <div className="w-1/4 bg-risk-critical" title="Critical" />
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* ====================================================
          LAND ACQUISITION STAGES
          Compact grid of circular icons for 8 statutory stages
          Green: Completed, Orange: In Progress, Red: Delayed (Compensation), Grey: Pending
         ==================================================== */}
      <div className="bg-white rounded-3xl p-4 border border-app-border shadow-card space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider">
            Land Acquisition Stages
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">8 Statutory Milestones</span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 text-center">
          {stages.map((st) => {
            const isComp = st.name === "Compensation";
            const isDelayed = st.status === "Delayed";
            const isCompleted = st.status === "Completed";
            const isInProg = st.status === "In Progress";

            const circleColor = isDelayed || isComp
              ? 'bg-red-500 text-white ring-4 ring-red-100 shadow-xs'
              : isCompleted
              ? 'bg-forest-800 text-white'
              : isInProg
              ? 'bg-amber-500 text-white'
              : 'bg-slate-200 text-slate-500';

            return (
              <div
                key={st.id}
                onClick={() => setActiveStage(st)}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-transform group-hover:scale-105 ${circleColor}`}>
                  {st.icon}
                </div>
                <span className={`text-[10px] font-bold mt-1.5 leading-tight ${isDelayed ? 'text-red-600' : 'text-slate-700'}`}>
                  {st.shortName}
                </span>
                <span className="text-[9px] text-slate-400">{st.days}</span>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Drawer */}
        {activeStage && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 animate-fadeIn">
            <div className="flex justify-between items-center">
              <span className="font-bold text-forest-950">
                Stage {activeStage.id}: {activeStage.name}
              </span>
              <button
                onClick={() => setActiveStage(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                &times;
              </button>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="font-semibold text-slate-600">Status:</span>
              <span className={`font-bold ${activeStage.status === 'Delayed' ? 'text-risk-high' : 'text-forest-800'}`}>
                {activeStage.status} ({activeStage.days})
              </span>
            </div>
            {activeStage.bottleneck && (
              <p className="text-red-600 text-[11px] font-bold bg-red-50 p-1.5 rounded-lg border border-red-200">
                ⚠️ {activeStage.bottleneck}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ====================================================
          WHY IS THIS PROJECT AT RISK?
          Compact horizontal progress bars
         ==================================================== */}
      <div className="bg-white rounded-3xl p-4 border border-app-border shadow-card space-y-3">
        <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Why is this project at risk?
        </h3>

        <div className="space-y-2">
          {[
            { name: "Compensation Delay", pct: 27, color: "bg-risk-high" },
            { name: "Legal Dispute", pct: 21, color: "bg-orange-500" },
            { name: "Approval Delay", pct: 17, color: "bg-risk-medium" },
            { name: "Incomplete Docs", pct: 11, color: "bg-amber-400" },
            { name: "Stakeholder Response", pct: -5, color: "bg-forest-600", mitigator: true }
          ].map((item, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-medium text-[11px]">{item.name}</span>
                <span className={`font-mono font-bold text-[11px] ${item.mitigator ? 'text-forest-700' : 'text-slate-900'}`}>
                  {item.mitigator ? '-5%' : `${item.pct}%`}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${Math.abs(item.pct) * 3.3}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ====================================================
          AI RECOMMENDATION
          Compact recommendation card: AI Recommendation, HIGH PRIORITY,
          Compensation Verification, Problem, Recommended Action, Button
         ==================================================== */}
      <div className="bg-white rounded-3xl p-4 border border-app-border shadow-card space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-forest-600" />
            AI Recommendation
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-red-100 text-risk-high border border-red-200">
            HIGH PRIORITY
          </span>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-xs text-forest-950">
            Compensation Verification
          </h4>
          <p className="text-[11px] text-slate-600">
            <strong className="text-slate-800">Problem:</strong> Compensation processing is delayed.
          </p>
          <p className="text-[11px] text-forest-950 font-medium">
            <strong className="text-forest-800">Recommended Action:</strong> Prioritize verification and disbursement review.
          </p>
        </div>

        <button
          onClick={onNavigate ? () => onNavigate('recommendations') : undefined}
          className="w-full py-2 bg-slate-50 hover:bg-forest-50 text-forest-900 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
        >
          <span>View All Recommendations</span>
          <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>

      {/* Interactive Live Recalculation Modal */}
      {showRecalcModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-forest-950 flex items-center">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-forest-700" />
                Live AI Risk Recalculator
              </h3>
              <button
                onClick={() => setShowRecalcModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRecalculate} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-0.5">
                  Compensation Disbursed (Budget: ₹380 Cr)
                </label>
                <input
                  type="number"
                  value={compDisbursed}
                  onChange={(e) => setCompDisbursed(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Set to ₹350 Cr to simulate full disbursement!</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-0.5">
                  Active Legal Disputes
                </label>
                <input
                  type="number"
                  value={legalCount}
                  onChange={(e) => setLegalCount(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400">Set to 0 to resolve court injunctions</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecalcModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recalculating}
                  className="px-4 py-1.5 bg-forest-900 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
                >
                  {recalculating ? <span>Recalculating...</span> : <span>Recalculate Risk →</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
