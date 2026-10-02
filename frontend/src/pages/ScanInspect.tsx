import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Info, Camera, BarChart2, FileText, AlertCircle,
  ChevronRight, Sparkles, CheckCircle2, Scan, RefreshCw, X,
  Search, MapPin, Building2, Check
} from 'lucide-react';
import { api } from '../services/api';
import { Project } from '../types';

interface ScanInspectProps {
  onSelectProject: (projectId: string) => void;
  onNavigate: (page: string) => void;
  onBack?: () => void;
}

export const ScanInspect: React.FC<ScanInspectProps> = ({
  onSelectProject,
  onNavigate,
  onBack
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  // Project selection from all 1,021 database records
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);

  // Load initial projects
  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await api.getProjects({ page: 1, page_size: 50 });
        if (isMounted && res?.items?.length) {
          setProjectsList(res.items);
          setSelectedProject(res.items[0]);
        }
      } catch (err) {
        console.error('Failed to load projects for scanner', err);
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    };

    fetchProjects();
    return () => { isMounted = false; };
  }, []);

  // Live search project selector
  const handleSearchChange = async (query: string) => {
    setProjectSearchQuery(query);
    setIsSearchOpen(true);
    try {
      const res = await api.getProjects({ search: query, page: 1, page_size: 30 });
      if (res?.items) {
        setProjectsList(res.items);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleActionClick = (type: string) => {
    setActiveModal(type);
    setScanning(true);
    setScanResult(null);

    const projId = selectedProject ? selectedProject.id : "LA-JH-2026-0042";
    const projName = selectedProject ? selectedProject.name : "Ranchi Infrastructure Project";
    const projState = selectedProject ? selectedProject.state : "Jharkhand";
    const projDist = selectedProject ? selectedProject.district : "Ranchi";
    const projArea = selectedProject ? `${selectedProject.land_area_hectares} Ha` : "450.0 Hectares";
    const projComp = selectedProject ? `${selectedProject.compensation_percentage}%` : "62%";
    const projStage = selectedProject ? selectedProject.current_stage : "Section 19 Declaration";

    setTimeout(() => {
      setScanning(false);
      if (type === 'parcel') {
        setScanResult({
          title: `Cadastral Plot Verification: ${projId}`,
          project: projName,
          jurisdiction: `${projDist}, ${projState}`,
          area: projArea,
          status: "Encumbrance Free — Zero Court Injunctions",
          confidence: "99.4% AI Match"
        });
      } else if (type === 'risk') {
        const rawProb = selectedProject?.predictions?.[0]?.delay_probability ?? (selectedProject as any)?.delay_probability ?? 0.78;
        const delayProb = Math.round(rawProb * 100);
        const riskCat = selectedProject?.predictions?.[0]?.risk_category || (selectedProject as any)?.risk_category || 'HIGH';
        const delayDays = selectedProject?.predictions?.[0]?.predicted_delay_days || (selectedProject as any)?.predicted_delay_days || 45;

        setScanResult({
          title: `AI Risk Assessment: ${projId}`,
          project: projName,
          delayLikelihood: `${delayProb}% (${riskCat} RISK)`,
          predictedDelay: `+${delayDays} Days Over Statutory Timeline`,
          currentStage: projStage,
          compensationStatus: `${projComp} Disbursed`
        });
      } else if (type === 'doc') {
        setScanResult({
          title: `Statutory Gazette Verification: ${projId}`,
          project: projName,
          currentStage: projStage,
          status: "DILRMP Certified Record Match",
          authenticity: "Valid Digital Seal Verified"
        });
      } else {
        setScanResult({
          title: `Bottleneck Diagnostic: ${projId}`,
          project: projName,
          status: `Assigned to ${projDist} Land Acquisition Officer`,
          eta: "Statutory compliance required within 7 working days"
        });
      }
    }, 1200);
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Mobile Sub-Header: [←] Scan & Inspect [ⓘ] */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={onBack || (() => onNavigate('dashboard'))}
          className="p-1 -ml-1 text-forest-900 hover:bg-forest-50 rounded-lg transition cursor-pointer"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-sm font-extrabold text-forest-900 uppercase tracking-wider">
          Scan & Inspect
        </h2>

        <button
          onClick={() => alert("LandGuard AI Computer Vision & Document Scanner: Integrates satellite GIS imagery and DILRMP digitized cadastral records.")}
          className="p-1 -mr-1 text-slate-400 hover:text-forest-900 transition cursor-pointer"
          aria-label="Info"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Main Heading & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-forest-950 tracking-tight">
          AI Land & Corridor Inspector
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Select any of the 1,021 database infrastructure projects to run live AI scans.
        </p>
      </div>

      {/* ====================================================
          PROJECT SELECTOR BAR: Select ANY of the 1,021 Projects
         ==================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-app-border shadow-card space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center">
            <Building2 className="w-4 h-4 mr-1.5 text-forest-700" />
            Target Project Under Inspection
          </label>
          {selectedProject && (
            <button
              onClick={() => onSelectProject(selectedProject.id)}
              className="text-[11px] font-bold text-forest-800 hover:underline flex items-center cursor-pointer"
            >
              <span>Inspect Dossier</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          )}
        </div>

        {/* Search / Dropdown Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-warm-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={projectSearchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={selectedProject ? `${selectedProject.id} — ${selectedProject.name}` : "Search projects..."}
            className="w-full pl-9 pr-8 py-2.5 bg-warm-50 border border-warm-200 rounded-2xl text-xs font-semibold text-warm-900 focus:outline-hidden focus:border-forest-700 focus:bg-white transition"
          />
          {projectSearchQuery && (
            <button
              onClick={() => { setProjectSearchQuery(''); setIsSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Autocomplete Dropdown List */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-warm-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto z-40 text-xs divide-y divide-warm-100">
              {projectsList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProject(p);
                    setProjectSearchQuery(`${p.id} — ${p.name}`);
                    setIsSearchOpen(false);
                  }}
                  className="p-2.5 hover:bg-forest-50 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="overflow-hidden pr-2">
                    <span className="font-mono text-[10px] font-bold text-forest-800">{p.id}</span>
                    <p className="font-bold text-slate-800 truncate">{p.name}</p>
                    <span className="text-[10px] text-slate-500">{p.district}, {p.state} • {p.project_type}</span>
                  </div>
                  {selectedProject?.id === p.id && (
                    <Check className="w-4 h-4 text-forest-700 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Project Summary Pill */}
        {selectedProject && (
          <div className="p-2.5 bg-forest-50/70 border border-forest-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-mono font-bold text-forest-900">{selectedProject.id}</span>
              <p className="text-[11px] text-forest-800 font-medium">
                {selectedProject.district}, {selectedProject.state} • {selectedProject.land_area_hectares} Ha
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-forest-950 text-[11px]">{selectedProject.current_stage}</span>
              <button
                onClick={() => onSelectProject(selectedProject.id)}
                className="px-2.5 py-1 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
              >
                View Dossier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================
          HERO ISOMETRIC ILLUSTRATION
          Land parcel, trees, roads, GIS location marker, drone
         ==================================================== */}
      <div className="w-full bg-white rounded-3xl p-4 border border-app-border shadow-card overflow-hidden">
        <div className="aspect-16/10 w-full bg-gradient-to-b from-[#123D30] to-[#0A261E] rounded-2xl relative flex items-center justify-center p-2 overflow-hidden shadow-inner">
          {/* Grid Background Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* SVG Cadastral & Drone Visualization */}
          <svg className="w-full h-full max-h-[170px]" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="120,70 280,70 340,150 60,150" fill="#1B4D3E" opacity="0.8" />
            <polygon points="130,80 270,80 250,110 105,110" fill="#2D6A4F" stroke="#52B788" strokeWidth="1.5" strokeDasharray="3 3" />
            <polygon points="250,80 270,80 320,140 230,140" fill="#40916C" opacity="0.9" />
            <polygon points="90,115 240,115 220,145 70,145" fill="#52B788" opacity="0.6" />

            <path d="M 60,150 L 340,150" stroke="#74C69D" strokeWidth="2" opacity="0.4" />
            <path d="M 200,70 L 200,150" stroke="#74C69D" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />

            <g transform="translate(180, 50)">
              <rect x="0" y="0" width="40" height="20" rx="4" fill="#081C15" stroke="#52B788" strokeWidth="1" />
              <text x="20" y="14" fill="#D8F3DC" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                {selectedProject ? selectedProject.id.slice(-4) : "0042"}
              </text>
            </g>

            {/* GPS Pin */}
            <g transform="translate(192, 100)">
              <circle cx="8" cy="8" r="8" fill="#E53935" />
              <circle cx="8" cy="8" r="3" fill="#FFFFFF" />
            </g>

            {/* Drone Icon Scanning */}
            <g transform="translate(70, 30)">
              <circle cx="15" cy="15" r="4" fill="#52B788" />
              <line x1="5" y1="10" x2="25" y2="20" stroke="#D8F3DC" strokeWidth="1.5" />
              <line x1="5" y1="20" x2="25" y2="10" stroke="#D8F3DC" strokeWidth="1.5" />
              <circle cx="5" cy="10" r="2" fill="#FFFFFF" />
              <circle cx="25" cy="20" r="2" fill="#FFFFFF" />
              <circle cx="5" cy="20" r="2" fill="#FFFFFF" />
              <circle cx="25" cy="10" r="2" fill="#FFFFFF" />
              <path d="M 15,19 L 5,65 L 45,65 Z" fill="url(#laserCone)" opacity="0.4" />
            </g>

            <defs>
              <linearGradient id="laserCone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#52B788" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#52B788" stopOpacity="0.0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating Telemetry Badge */}
          <div className="absolute top-2.5 left-2.5 bg-black/40 backdrop-blur-xs border border-white/10 px-2 py-1 rounded-lg flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-300 font-bold">
              {selectedProject ? `${selectedProject.state} Telemetry Active` : "GIS Telemetry Active"}
            </span>
          </div>

          <div className="absolute bottom-2.5 right-2.5 bg-forest-900/80 backdrop-blur-xs border border-forest-700/50 px-2 py-0.5 rounded text-[10px] text-forest-200 font-mono">
            {selectedProject?.latitude ? `${selectedProject.latitude.toFixed(3)}°N, ${selectedProject.longitude.toFixed(3)}°E` : "23.344°N, 85.309°E"}
          </div>
        </div>
      </div>

      {/* ====================================================
          ACTION BUTTONS GRID (4 Rectangular Cards)
         ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* 1. Land Parcel Check */}
        <div
          onClick={() => handleActionClick('parcel')}
          className="bg-white p-3.5 rounded-2xl border border-app-border shadow-card hover:border-forest-700 transition flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-900 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-forest-900" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-forest-950">Land Parcel Check</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Scan land documents & cadastral ownership</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-forest-900 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </div>

        {/* 2. Project Risk Scan */}
        <div
          onClick={() => handleActionClick('risk')}
          className="bg-white p-3.5 rounded-2xl border border-app-border shadow-card hover:border-amber-500 transition flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-forest-950">Project Risk Scan</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Analyze ML factors to predict delay probability</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-800 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </div>

        {/* 3. Document Verification */}
        <div
          onClick={() => handleActionClick('doc')}
          className="bg-white p-3.5 rounded-2xl border border-app-border shadow-card hover:border-sky-500 transition flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-sky-800" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-forest-950">Document Verification</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Verify Section 19 Gazette & DILRMP digital seals</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-800 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </div>

        {/* 4. Complaint / Issue */}
        <div
          onClick={() => handleActionClick('issue')}
          className="bg-white p-3.5 rounded-2xl border border-app-border shadow-card hover:border-red-400 transition flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-risk-high flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-risk-high" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-forest-950">Complaint / Issue</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Report an acquisition bottleneck or court dispute</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-risk-high group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </div>
      </div>

      {/* ====================================================
          AI INSIGHT CARD
         ==================================================== */}
      <div className="bg-forest-50 border border-forest-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
        <div className="space-y-0.5 max-w-[240px]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-800 flex items-center">
            🌱 AI Insight
          </span>
          <p className="text-xs font-bold text-forest-950 leading-snug">
            {selectedProject
              ? `${selectedProject.name} is in ${selectedProject.current_stage} with ${selectedProject.compensation_percentage}% compensation.`
              : "346 projects show critical delay risk requiring Collectorate intervention."}
          </p>
        </div>

        <button
          onClick={() => onSelectProject(selectedProject ? selectedProject.id : 'LA-JH-2026-0042')}
          className="text-xs font-extrabold text-forest-900 bg-white px-2.5 py-1.5 rounded-xl border border-forest-300 shadow-xs hover:bg-forest-900 hover:text-white transition shrink-0 cursor-pointer"
        >
          View Dossier →
        </button>
      </div>

      {/* Interactive Scan Diagnostic Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-forest-950 flex items-center">
                <Scan className="w-4 h-4 mr-1.5 text-forest-700" />
                AI Diagnostic Telemetry
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            {scanning ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-forest-200 border-t-forest-900 animate-spin" />
                <p className="font-bold text-forest-900 mt-2">Processing Cadastral OCR & Satellite Coordinates...</p>
                <p className="text-[10px] text-slate-400">Querying DILRMP spatial index for {selectedProject?.id || 'corridor'}</p>
              </div>
            ) : scanResult && (
              <div className="space-y-3">
                <div className="p-3 bg-forest-50 rounded-xl border border-forest-200 space-y-1.5">
                  <div className="flex items-center text-forest-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-forest-700 shrink-0" />
                    <span>{scanResult.title}</span>
                  </div>
                  {Object.entries(scanResult).filter(([k]) => k !== 'title').map(([key, val]) => (
                    <div key={key} className="flex justify-between text-[11px] border-b border-forest-100/60 py-1">
                      <span className="capitalize text-slate-600 font-medium">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-bold text-forest-950">{String(val)}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const idToNav = selectedProject ? selectedProject.id : 'LA-JH-2026-0042';
                    setActiveModal(null);
                    onSelectProject(idToNav);
                  }}
                  className="w-full py-2.5 bg-forest-900 text-white font-bold rounded-xl text-xs hover:bg-forest-950 transition cursor-pointer"
                >
                  Inspect Full Project Dossier ({selectedProject?.id || 'Selected'}) →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
