import React, { useState, useEffect } from 'react';
import {
  MapPin, Filter, Layers, Eye, ArrowRight,
  AlertTriangle, CheckCircle2, SlidersHorizontal,
  Search, RefreshCw
} from 'lucide-react';
import { DEMO_PROJECTS } from '../data/demoData';
import { ProjectMapLeaflet } from '../components/ProjectMapLeaflet';
import { api } from '../services/api';

interface MapPageProps {
  onSelectProject: (projectId: string) => void;
}

export const MapPage: React.FC<MapPageProps> = ({ onSelectProject }) => {
  const [allProjects, setAllProjects] = useState<any[]>(DEMO_PROJECTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<any | null>(DEMO_PROJECTS[0]);

  // Fetch all 1,021 projects from the GIS map endpoint on mount
  useEffect(() => {
    let isMounted = true;
    const loadMapData = async () => {
      setLoading(true);
      try {
        const res = await api.getMapProjects();
        if (isMounted && res && res.features && res.features.length > 0) {
          setAllProjects(res.features);
          setActiveProject(res.features[0]);
        }
      } catch (err) {
        console.error('Failed to load GIS map projects, fallback to demo', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMapData();
    return () => { isMounted = false; };
  }, []);

  const filteredProjects = allProjects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.state && p.state.toLowerCase().includes(q));

    const matchesState = selectedState === 'All' || p.state === selectedState;
    const matchesRisk = selectedRisk === 'All' || p.risk_category === selectedRisk;
    const matchesSector = selectedSector === 'All' || p.project_type === selectedSector;
    const matchesStage = selectedStage === 'All' || p.current_stage === selectedStage;
    return matchesSearch && matchesState && matchesRisk && matchesSector && matchesStage;
  });

  const states = Array.from(new Set(allProjects.map(p => p.state).filter(Boolean))).sort();
  const sectors = Array.from(new Set(allProjects.map(p => p.project_type).filter(Boolean))).sort();
  const stages = Array.from(new Set(allProjects.map(p => p.current_stage).filter(Boolean))).sort();

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-forest-950 tracking-tight">GIS Geo-Spatial Explorer</h1>
            <span className="bg-forest-100 text-forest-800 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-forest-200">
              {allProjects.length} Projects Total
            </span>
          </div>
          <p className="text-xs text-warm-600 font-medium mt-0.5">
            Interactive multi-district acquisition risk mapping and corridor visualization across all states.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-2xl border border-warm-200 text-xs font-bold shadow-soft-sm">
          <span className="flex items-center text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1" /> Low
          </span>
          <span className="flex items-center text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1" /> Medium
          </span>
          <span className="flex items-center text-orange-700">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1" /> High
          </span>
          <span className="flex items-center text-red-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 mr-1" /> Critical
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-warm-200 shadow-soft-sm space-y-3">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-warm-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all 1,021 projects by name, ID, district, or state..."
              className="w-full pl-9 pr-4 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs font-medium text-warm-900 focus:outline-hidden focus:border-forest-700 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-warm-600 font-bold self-end sm:self-auto">
            {loading ? (
              <span className="flex items-center text-forest-700">
                <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                Loading GIS markers...
              </span>
            ) : (
              <span>Displaying <strong>{filteredProjects.length}</strong> of {allProjects.length} projects</span>
            )}
          </div>
        </div>

        {/* Multi-Filter dropdowns: State, Risk Level, Project Type, Current Stage */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-warm-100 pt-3">
          {/* State Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-warm-500 mb-1">State ({states.length})</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full p-2 bg-warm-50 border border-warm-200 rounded-xl text-warm-900 font-semibold focus:outline-hidden"
            >
              <option value="All">All States ({allProjects.length})</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-warm-500 mb-1">Risk Level</label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full p-2 bg-warm-50 border border-warm-200 rounded-xl text-warm-900 font-semibold focus:outline-hidden"
            >
              <option value="All">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Project Sector Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-warm-500 mb-1">Project Type ({sectors.length})</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full p-2 bg-warm-50 border border-warm-200 rounded-xl text-warm-900 font-semibold focus:outline-hidden"
            >
              <option value="All">All Sectors</option>
              {sectors.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>

          {/* Current Stage Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-warm-500 mb-1">Current Stage ({stages.length})</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full p-2 bg-warm-50 border border-warm-200 rounded-xl text-warm-900 font-semibold focus:outline-hidden"
            >
              <option value="All">All Stages</option>
              {stages.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Map + Side Detail Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Interactive Map View (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-3 border border-warm-200 shadow-soft-md h-[580px] overflow-hidden relative">
          <ProjectMapLeaflet
            projects={filteredProjects as any}
            onSelectProject={(projectId) => {
              const found = allProjects.find(p => p.id === projectId);
              if (found) {
                setActiveProject(found);
              }
            }}
          />
        </div>

        {/* Project Detail Card on Map Click (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-soft-sm flex flex-col justify-between space-y-4">
          {activeProject ? (
            <div className="space-y-4">
              <div className="border-b border-warm-100 pb-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-forest-900 bg-warm-100 px-2.5 py-0.5 rounded border border-warm-200">
                    {activeProject.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    activeProject.risk_category === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : activeProject.risk_category === 'HIGH'
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {activeProject.risk_category} RISK
                  </span>
                </div>
                <h3 className="font-bold text-base text-forest-950 mt-2">
                  {activeProject.name}
                </h3>
                <p className="text-xs text-warm-500 mt-0.5 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-warm-400" />
                  {activeProject.state} • {activeProject.district}
                </p>
                <p className="text-[11px] text-warm-600 font-medium mt-1">
                  Type: <strong>{activeProject.project_type}</strong>
                </p>
              </div>

              {/* Metrics Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-warm-50 rounded-2xl border border-warm-200">
                  <span className="text-[10px] uppercase font-bold text-warm-500 block">Risk Score</span>
                  <span className="text-lg font-extrabold font-mono text-forest-950">{activeProject.risk_score} / 10</span>
                </div>
                <div className="p-3 bg-warm-50 rounded-2xl border border-warm-200">
                  <span className="text-[10px] uppercase font-bold text-warm-500 block">Delay Prob</span>
                  <span className="text-lg font-extrabold font-mono text-orange-600">
                    {Math.round((activeProject.delay_probability || 0.5) * 100)}%
                  </span>
                </div>
                <div className="p-3 bg-warm-50 rounded-2xl border border-warm-200">
                  <span className="text-[10px] uppercase font-bold text-warm-500 block">Current Stage</span>
                  <span className="font-bold text-forest-900 block truncate">{activeProject.current_stage}</span>
                </div>
                <div className="p-3 bg-warm-50 rounded-2xl border border-warm-200">
                  <span className="text-[10px] uppercase font-bold text-warm-500 block">Predicted Delay</span>
                  <span className="font-bold text-forest-950">+{activeProject.predicted_delay_days || 45} Days</span>
                </div>
              </div>

              {/* Area & Compensation */}
              <div className="p-3 bg-warm-50 rounded-2xl border border-warm-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-warm-500 block">Land Area</span>
                  <p className="text-forest-950 font-bold mt-0.5">{activeProject.land_area_hectares} Ha</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-warm-500 block">Compensation</span>
                  <p className="text-forest-950 font-bold mt-0.5">{activeProject.compensation_percentage}% Paid</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-warm-400 text-xs">
              Click any map marker or search above to view detailed corridor telemetry.
            </div>
          )}

          {activeProject && (
            <button
              onClick={() => onSelectProject(activeProject.id)}
              className="w-full py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-soft cursor-pointer"
            >
              <span>Inspect Full Project Dossier ({activeProject.id})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
