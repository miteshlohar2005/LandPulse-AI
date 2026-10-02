import React, { useState } from 'react';
import {
  Menu, Bell, Shield, X, Home, FolderGit2,
  AlertTriangle, MoreHorizontal, MapPin, Lightbulb,
  BarChart3, Cpu, LogOut, CheckCircle2, User as UserIcon,
  ChevronRight, Sparkles, ChevronDown, Plus, Smartphone,
  Maximize2, Minimize2, Headphones
} from 'lucide-react';
import { User, UserRole } from '../types';

interface MobileAppShellProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  unreadAlertCount: number;
  showPhoneFrame?: boolean;
  onTogglePhoneFrame?: () => void;
  children: React.ReactNode;
}

const ROLES: { role: UserRole; title: string; desc: string }[] = [
  { role: "District Officer", title: "District Officer", desc: "Ranchi Collectorate & CALA" },
  { role: "State Officer", title: "State Officer", desc: "Jharkhand Revenue Nodal" },
  { role: "Project Manager", title: "Project Manager", desc: "NHAI Project Lead" },
  { role: "Administrator", title: "Administrator", desc: "DoLR Joint Secretary" },
  { role: "Viewer", title: "Analyst / Viewer", desc: "NITI Aayog Read-only" },
];

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
  currentUser,
  currentPage,
  onNavigate,
  onRoleChange,
  onLogout,
  unreadAlertCount,
  showPhoneFrame = false,
  onTogglePhoneFrame,
  children
}) => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [roleSelectOpen, setRoleSelectOpen] = useState<boolean>(false);

  return (
    <div
      className={`min-h-screen font-sans antialiased selection:bg-forest-100 selection:text-forest-900 transition-colors duration-300 w-full ${
        showPhoneFrame
          ? 'bg-slate-950 sm:py-6 flex items-center justify-center'
          : 'bg-app-bg flex flex-col w-full'
      }`}
    >
      {/* Main App Container: Either centered 430px phone or 100% full screen view */}
      <div
        className={`w-full bg-app-bg flex flex-col relative transition-all duration-300 ${
          showPhoneFrame
            ? 'sm:max-w-[430px] min-h-screen sm:min-h-[880px] sm:max-h-[920px] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 shadow-2xl overflow-hidden'
            : 'min-h-screen rounded-none border-0 shadow-none w-full'
        }`}
      >
        {/* Status Bar / Speaker Notch Mock (Only shown when Phone Frame is ON) */}
        {showPhoneFrame && (
          <div className="hidden sm:flex justify-between items-center px-6 pt-3 pb-1 text-[11px] font-semibold text-slate-700 bg-white select-none shrink-0 border-b border-slate-100">
            <span>9:41</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto -mt-1" />
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* ====================================================
            APPLICATION HEADER (FULL WIDTH)
           ==================================================== */}
        <header className="bg-white border-b border-app-border px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs w-full">
          <div className="w-full flex items-center justify-between gap-4">
            {/* Menu Button & Brand */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 -ml-1 rounded-xl text-forest-900 hover:bg-forest-50 transition cursor-pointer"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-forest-900" />
              </button>

              <div
                onClick={() => onNavigate('dashboard')}
                className="flex items-center space-x-2 cursor-pointer select-none"
              >
                <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center text-white shadow-xs">
                  <Shield className="w-4.5 h-4.5 text-forest-100" />
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight text-forest-900">
                    LandGuard <span className="text-forest-600">AI</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links (Visible on wider screens when not in phone frame) */}
            {!showPhoneFrame && (
              <nav className="hidden xl:flex items-center space-x-1 py-0.5">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: Home },
                  { id: 'scan', label: 'Scan', icon: Plus },
                  { id: 'projects', label: 'Projects', icon: FolderGit2 },
                  { id: 'map', label: 'GIS Map', icon: MapPin },
                  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: unreadAlertCount },
                  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'model', label: 'ML Ops', icon: Cpu },
                  ...(currentUser.role === 'Administrator' ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
                  { id: 'support', label: 'Support', icon: Headphones },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentPage === tab.id || (tab.id === 'projects' && currentPage === 'project_detail');
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onNavigate(tab.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-forest-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-forest-900 hover:bg-forest-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {Boolean(tab.badge && tab.badge > 0) && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-red-600 text-white font-bold">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Header Right: Role Switcher, Frame Toggle & Notification Bell */}
            <div className="flex items-center space-x-2 shrink-0">
              {!showPhoneFrame && (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setRoleSelectOpen(!roleSelectOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-forest-200 bg-forest-50/70 hover:bg-forest-100 text-xs font-bold text-forest-950 transition cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-forest-700" />
                    <span>{currentUser.role}</span>
                    <ChevronDown className="w-3 h-3 text-forest-600" />
                  </button>
                  {roleSelectOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Role
                      </div>
                      {ROLES.map((r) => (
                        <button
                          key={r.role}
                          onClick={() => {
                            onRoleChange(r.role);
                            setRoleSelectOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex justify-between items-center cursor-pointer ${
                            currentUser.role === r.role
                              ? 'bg-forest-900 text-white font-bold'
                              : 'text-slate-700 hover:bg-forest-50'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{r.title}</p>
                            <p className={`text-[10px] ${currentUser.role === r.role ? 'text-forest-200' : 'text-slate-400'}`}>{r.desc}</p>
                          </div>
                          {currentUser.role === r.role && <CheckCircle2 className="w-3.5 h-3.5 text-forest-200 shrink-0 ml-1" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => onNavigate('alerts')}
                className="p-1.5 rounded-xl text-forest-900 hover:bg-forest-50 relative transition cursor-pointer"
                aria-label="View Alerts"
              >
                <Bell className="w-5 h-5 text-forest-900" />
                {unreadAlertCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-risk-high ring-2 ring-white animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ====================================================
            VERTICAL SCREEN CONTENT (FULL SCREEN FULL WIDE)
           ==================================================== */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 w-full ${!showPhoneFrame ? 'pb-16' : 'pb-28'}`}>
          {children}
        </main>

        {/* ====================================================
            BOTTOM NAVIGATION BAR (Visible on mobile/tablet)
           ==================================================== */}
        <nav
          className={`fixed sm:absolute bottom-0 left-0 right-0 bg-white border-t border-app-border px-3 py-2 z-30 shadow-nav flex justify-center ${
            showPhoneFrame ? 'sm:rounded-b-[32px]' : 'xl:hidden'
          }`}
        >
          <div className="w-full max-w-md flex justify-between items-center">
            {/* 1. Home */}
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition ${
                currentPage === 'dashboard' ? 'text-forest-900 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-1">Home</span>
            </button>

            {/* 2. Projects */}
            <button
              onClick={() => onNavigate('projects')}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition ${
                currentPage === 'projects' || currentPage === 'project_detail'
                  ? 'text-forest-900 font-extrabold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <FolderGit2 className="w-5 h-5" />
              <span className="text-[10px] mt-1">Projects</span>
            </button>

            {/* 3. Scan (Circular Green Action Button) */}
            <div className="flex-1 flex justify-center -mt-6">
              <button
                onClick={() => onNavigate('scan')}
                className="w-13 h-13 rounded-full bg-forest-900 border-4 border-white text-white flex items-center justify-center shadow-lg hover:bg-forest-800 transition transform active:scale-95 cursor-pointer group"
                aria-label="Scan & Inspect"
              >
                <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* 4. Alerts */}
            <button
              onClick={() => onNavigate('alerts')}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition relative ${
                currentPage === 'alerts' ? 'text-forest-900 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="text-[10px] mt-1">Alerts</span>
              {unreadAlertCount > 0 && (
                <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-risk-high" />
              )}
            </button>

            {/* 5. More */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition ${
                drawerOpen ? 'text-forest-900 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] mt-1">More</span>
            </button>
          </div>
        </nav>

        {/* ====================================================
            MOBILE SLIDE-OVER DRAWER (Extra Navigation)
           ==================================================== */}
        {drawerOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex"
            onClick={() => setDrawerOpen(false)}
          >
            <div
              className="w-4/5 max-w-xs h-full bg-white flex flex-col justify-between p-5 shadow-2xl animate-slideRight"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                {/* Drawer Header */}
                <div className="flex justify-between items-center pb-3 border-b border-app-border">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center text-white">
                      <Shield className="w-4 h-4 text-forest-100" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-forest-900">LandGuard AI</h3>
                      <p className="text-[10px] text-slate-500">DoLR • MoRD, Govt of India</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Phone Frame Toggle Switch inside Drawer */}
                {onTogglePhoneFrame && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-forest-700" />
                      <span className="text-xs font-bold text-slate-800">Phone Frame</span>
                    </div>
                    <button
                      onClick={onTogglePhoneFrame}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        showPhoneFrame ? 'bg-forest-900' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          showPhoneFrame ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* User Role Card & Switcher */}
                <div className="p-3 bg-forest-50/70 border border-forest-100 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest-800">Active Profile</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-forest-900 text-white font-semibold">Demo</span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-forest-950">{currentUser.full_name}</p>
                    <p className="text-[11px] text-forest-700 font-medium">{currentUser.role}</p>
                  </div>
                  <button
                    onClick={() => setRoleSelectOpen(!roleSelectOpen)}
                    className="w-full py-1.5 px-2 bg-white rounded-xl border border-forest-200 text-[11px] font-bold text-forest-900 flex items-center justify-between cursor-pointer"
                  >
                    <span>Switch Role</span>
                    <ChevronDown className="w-3.5 h-3.5 text-forest-700" />
                  </button>

                  {roleSelectOpen && (
                    <div className="pt-2 space-y-1 border-t border-forest-100">
                      {ROLES.map((r) => (
                        <button
                          key={r.role}
                          onClick={() => {
                            onRoleChange(r.role);
                            setRoleSelectOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] flex justify-between items-center cursor-pointer ${
                            currentUser.role === r.role
                              ? 'bg-forest-900 text-white font-bold'
                              : 'text-slate-700 hover:bg-forest-100'
                          }`}
                        >
                          <span>{r.title}</span>
                          {currentUser.role === r.role && <CheckCircle2 className="w-3 h-3 text-forest-200" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="space-y-1 text-xs font-semibold text-slate-700">
                  <button
                    onClick={() => { onNavigate('dashboard'); setDrawerOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                      currentPage === 'dashboard' ? 'bg-forest-900 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('scan'); setDrawerOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                      currentPage === 'scan' ? 'bg-forest-900 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Scan & Inspect</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('projects'); setDrawerOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                      currentPage === 'projects' ? 'bg-forest-900 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <FolderGit2 className="w-4 h-4" />
                    <span>Projects Registry</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('map'); setDrawerOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                      currentPage === 'map' ? 'bg-forest-900 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>GIS Map</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('recommendations'); setDrawerOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                      currentPage === 'recommendations' ? 'bg-forest-900 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Recommendations</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('analytics'); setDrawerOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                      currentPage === 'analytics' ? 'bg-forest-900 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('model'); setDrawerOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                      currentPage === 'model' ? 'bg-forest-900 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span>ML Operations</span>
                  </button>

                  {currentUser.role === 'Administrator' && (
                    <button
                      onClick={() => { onNavigate('admin'); setDrawerOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                        currentPage === 'admin' ? 'bg-forest-900 text-white' : 'hover:bg-slate-100'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Console</span>
                    </button>
                  )}

                  <button
                    onClick={() => { onNavigate('support'); setDrawerOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                      currentPage === 'support' ? 'bg-forest-900 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Headphones className="w-4 h-4" />
                    <span>Support Center</span>
                  </button>
                </div>
              </div>

              {/* Bottom Sign Out */}
              <button
                onClick={() => { setDrawerOpen(false); onLogout(); }}
                className="w-full py-2 px-3 rounded-xl border border-red-200 bg-red-50 text-risk-high text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
