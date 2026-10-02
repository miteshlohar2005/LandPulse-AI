import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Search, SlidersHorizontal, AlertTriangle,
  CheckCircle2, MapPin, ChevronRight, X, LayoutGrid,
  Table as TableIcon, ChevronLeft, RefreshCw, Building2,
  TrendingUp, Layers, Compass
} from 'lucide-react';
import { api } from '../services/api';
import { Project } from '../types';
import { DEMO_PROJECTS, ProjectItem } from '../data/demoData';

interface ProjectsPageProps {
  onSelectProject: (projectId: string) => void;
  onBack?: () => void;
  userRole?: string;
}

const SECTORS = [
  'All',
  'Highways & Expressways',
  'Railways & Freight',
  'Industrial Corridors & SEZ',
  'Renewable Energy & Solar Parks',
  'Irrigation & Water Reservoirs',
  'Urban Metros & Smart Cities',
  'Mining & Coal Exploration'
];

const STATES = [
  'All States',
  'Andhra Pradesh',
  'Bihar',
  'Gujarat',
  'Jharkhand',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Rajasthan',
  'Uttar Pradesh',
  'West Bengal'
];

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onSelectProject, onBack }) => {
  // Filter States
  const [selectedRiskTab, setSelectedRiskTab] = useState<'All' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Pagination & Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch projects from backend database
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProjects({
        search: debouncedSearch || undefined,
        risk_category: selectedRiskTab !== 'All' ? selectedRiskTab : undefined,
        project_type: selectedSector !== 'All' ? selectedSector : undefined,
        state: selectedState !== 'All States' ? selectedState : undefined,
        page: currentPage,
        page_size: pageSize
      });

      if (res && Array.isArray(res.items)) {
        setProjects(res.items);
        setTotalProjects(res.total);
        setTotalPages(res.total_pages || Math.ceil(res.total / pageSize) || 1);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (err: any) {
      console.warn('Backend API project fetch failed, utilizing fallback dataset:', err);
      // Client-side fallback to DEMO_PROJECTS
      const filtered = DEMO_PROJECTS.filter((p) => {
        const matchesSearch = !debouncedSearch ||
          p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.district.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.state.toLowerCase().includes(debouncedSearch.toLowerCase());

        let matchesRisk = true;
        if (selectedRiskTab !== 'All') {
          matchesRisk = p.risk_category === selectedRiskTab;
        }

        let matchesSector = true;
        if (selectedSector !== 'All') {
          matchesSector = p.project_type === selectedSector;
        }

        let matchesState = true;
        if (selectedState !== 'All States') {
          matchesState = p.state === selectedState;
        }

        return matchesSearch && matchesRisk && matchesSector && matchesState;
      });

      // Map demo projects to Project format
      const mapped: Project[] = filtered.map(d => ({
        id: d.id,
        name: d.name,
        state: d.state,
        district: d.district,
        project_type: d.project_type,
        land_area_hectares: d.land_area_hectares,
        affected_families: d.affected_families,
        compensation_budget_cr: d.compensation_budget_cr,
        compensation_disbursed_cr: d.compensation_disbursed_cr,
        compensation_percentage: d.compensation_percentage,
        approval_delay_days: d.approval_delay_days,
        legal_disputes_count: d.legal_disputes_count,
        documentation_complete: d.documentation_complete,
        notification_complete: d.notification_complete,
        possession_percentage: d.possession_percentage,
        rehabilitation_percentage: d.rehabilitation_percentage,
        stakeholder_responsiveness: d.stakeholder_responsiveness,
        historical_district_delay_score: 5.0,
        current_stage: d.current_stage,
        latitude: d.latitude,
        longitude: d.longitude,
        dataset_type: "Demonstration",
        latest_prediction: {
          project_id: d.id,
          delay_probability: d.delay_probability,
          risk_score: d.risk_score,
          risk_category: d.risk_category,
          predicted_delay_days: d.predicted_delay_days,
          confidence_score: d.confidence_score,
          risk_30d: 0.1,
          risk_60d: 0.3,
          risk_90d: 0.5,
          model_version: "v1.0.0-rf"
        }
      }));

      setProjects(mapped);
      setTotalProjects(mapped.length);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedRiskTab, selectedSector, selectedState, currentPage, pageSize]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset page when filters change
  const handleRiskTabChange = (tab: 'All' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    setSelectedRiskTab(tab);
    setCurrentPage(1);
  };

  const handleSectorChange = (sec: string) => {
    setSelectedSector(sec);
    setCurrentPage(1);
  };

  const handleStateChange = (st: string) => {
    setSelectedState(st);
    setCurrentPage(1);
  };

  return (
    <div className="w-full space-y-5 animate-fadeIn pb-12">
      {/* ====================================================
          TOP TOOLBAR: Page Title, Total Counter & View Toggles
         ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-forest-900 hover:bg-forest-50 rounded-xl transition cursor-pointer"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-forest-950 tracking-tight">
                National Projects Registry
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-forest-100 text-forest-800 border border-forest-200">
                {totalProjects > 0 ? `${totalProjects.toLocaleString()} Projects` : 'Loading...'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live RFCTLARR statutory acquisition progress, ML delay risk forecasting, and milestone monitoring.
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Refresh Button */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-forest-950 shadow-xs'
                  : 'text-slate-600 hover:text-forest-950'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-forest-950 shadow-xs'
                  : 'text-slate-600 hover:text-forest-950'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={() => fetchProjects()}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh Projects"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-forest-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* ====================================================
          FILTERS & SEARCH BAR
         ==================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-app-border shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by project name, ID (e.g. LA-AN-2026), district, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-forest-700 focus:bg-white shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sector Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedSector}
              onChange={(e) => handleSectorChange(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-forest-700 cursor-pointer"
            >
              {SECTORS.map(sec => (
                <option key={sec} value={sec}>
                  Sector: {sec}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-forest-700 cursor-pointer"
            >
              {STATES.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Risk Filter Tabs & Page Size */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Risk Filter:
            </span>
            {(['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((tab) => {
              const isSelected = selectedRiskTab === tab;
              const badgeStyle = tab === 'CRITICAL'
                ? (isSelected ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200')
                : tab === 'HIGH'
                ? (isSelected ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200')
                : tab === 'MEDIUM'
                ? (isSelected ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200')
                : tab === 'LOW'
                ? (isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200')
                : (isSelected ? 'bg-forest-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200');

              return (
                <button
                  key={tab}
                  onClick={() => handleRiskTabChange(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${badgeStyle}`}
                >
                  {tab === 'All' ? 'All Risks' : `${tab} Risk`}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
            </select>
          </div>
        </div>
      </div>

      {/* ====================================================
          PROJECTS LIST: GRID VIEW
         ==================================================== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
              <div className="h-5 w-4/5 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-200 rounded" />
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-9 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => {
            const riskCat = project.latest_prediction?.risk_category || (project as any).risk_category || 'LOW';
            const riskScore = project.latest_prediction?.risk_score ?? (project as any).risk_score ?? 0;
            const delayProb = project.latest_prediction?.delay_probability ?? (project as any).delay_probability ?? 0;

            const isHigh = riskCat === 'HIGH' || riskCat === 'CRITICAL';
            const isCritical = riskCat === 'CRITICAL';
            const isMedium = riskCat === 'MEDIUM';

            const badgeColor = isCritical
              ? 'bg-red-100 text-red-800 border-red-300'
              : riskCat === 'HIGH'
              ? 'bg-orange-100 text-orange-800 border-orange-200'
              : isMedium
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-card hover:border-forest-600 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2.5">
                  {/* Card Header: ID & Risk Badge */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-xs ${isHigh ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {isHigh ? '⚠' : isMedium ? '●' : '✓'}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {project.id}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${badgeColor}`}>
                      {riskCat} RISK
                    </span>
                  </div>

                  {/* Project Title & Sector */}
                  <div>
                    <h3 className="font-bold text-sm text-forest-950 leading-snug group-hover:text-forest-700 transition-colors line-clamp-2">
                      {project.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center truncate">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        {project.state} • {project.district}
                      </span>
                    </div>
                  </div>

                  {/* Sector Tag */}
                  <div className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold truncate max-w-full">
                    {project.project_type}
                  </div>

                  {/* 2x2 Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Risk Score</span>
                      <span className="font-mono font-extrabold text-forest-950 text-xs">
                        {riskScore.toFixed(1)} / 10
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Delay Prob.</span>
                      <span className="font-mono font-extrabold text-forest-950 text-xs">
                        {Math.round(delayProb * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Compensation</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {project.compensation_percentage ? `${project.compensation_percentage.toFixed(0)}%` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Current Stage</span>
                      <span className="font-semibold text-slate-700 text-[10px] truncate block" title={project.current_stage}>
                        {project.current_stage || 'Notification'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <button
                  onClick={() => onSelectProject(project.id)}
                  className="w-full py-2 px-3 bg-forest-50 hover:bg-forest-900 text-forest-900 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                >
                  <span>View Project Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* ====================================================
            PROJECTS LIST: FULL WIDE TABLE VIEW
           ==================================================== */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Project ID</th>
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">State & District</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4 text-right">Area (Ha)</th>
                  <th className="py-3 px-4 text-right">Families</th>
                  <th className="py-3 px-4 text-right">Disbursed</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4 text-center">Risk Level</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {projects.map((project) => {
                  const riskCat = project.latest_prediction?.risk_category || (project as any).risk_category || 'LOW';
                  const riskScore = project.latest_prediction?.risk_score ?? (project as any).risk_score ?? 0;
                  const delayProb = project.latest_prediction?.delay_probability ?? (project as any).delay_probability ?? 0;

                  const badgeColor = riskCat === 'CRITICAL'
                    ? 'bg-red-100 text-red-800'
                    : riskCat === 'HIGH'
                    ? 'bg-orange-100 text-orange-800'
                    : riskCat === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800';

                  return (
                    <tr key={project.id} className="hover:bg-forest-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {project.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-forest-950 max-w-xs truncate" title={project.name}>
                        {project.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {project.state}, {project.district}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px]">
                          {project.project_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {project.land_area_hectares ? project.land_area_hectares.toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {project.affected_families ? project.affected_families.toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {project.compensation_percentage ? `${project.compensation_percentage.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 text-[11px]">
                        {project.current_stage || 'Notification'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${badgeColor}`}>
                          {riskCat} ({riskScore.toFixed(1)})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectProject(project.id)}
                          className="px-3 py-1 bg-forest-900 hover:bg-forest-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl p-8 border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No projects matched your criteria "{debouncedSearch || selectedRiskTab}". Try clearing filters or searching for another term.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRiskTab('All');
              setSelectedSector('All');
              setSelectedState('All States');
            }}
            className="px-4 py-2 bg-forest-900 text-white rounded-xl text-xs font-bold hover:bg-forest-800 transition cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* ====================================================
          PAGINATION BAR
         ==================================================== */}
      {totalProjects > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, totalProjects)}</span> of{' '}
            <span className="font-bold text-slate-800">{totalProjects.toLocaleString()}</span> Projects
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center space-x-1 text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Quick Page Jump */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pNum: number;
                if (totalPages <= 5) {
                  pNum = idx + 1;
                } else if (currentPage <= 3) {
                  pNum = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pNum = totalPages - 4 + idx;
                } else {
                  pNum = currentPage - 2 + idx;
                }

                const isActive = pNum === currentPage;
                return (
                  <button
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-forest-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center space-x-1 text-xs font-bold"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
