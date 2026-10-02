import React, { useState } from 'react';
import {
  LayoutDashboard, FolderGit2, Scan, MapPin, AlertTriangle,
  Lightbulb, BarChart3, Cpu, ShieldCheck, User as UserIcon,
  Menu, X, Bell, LogOut, ChevronDown, CheckCircle2, Search,
  Compass, Shield
} from 'lucide-react';
import { User, UserRole } from '../types';

interface AppLayoutProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  unreadAlertCount: number;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scan', label: 'Scan & Inspect', icon: Scan, badge: 'AI Scan' },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'map', label: 'GIS Map', icon: MapPin },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, showBadge: true },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'model', label: 'Model Management', icon: Cpu },
  { id: 'admin', label: 'Administration', icon: ShieldCheck, adminOnly: true },
  { id: 'profile', label: 'Profile / Settings', icon: UserIcon },
];

const ROLES: { role: UserRole; title: string; desc: string }[] = [
  { role: "District Officer", title: "District Officer", desc: "Ranchi District Collectorate & LAO" },
  { role: "State Officer", title: "State Officer", desc: "Jharkhand State Nodal Officer" },
  { role: "Project Manager", title: "Project Manager", desc: "NHAI Expressway Project Lead" },
  { role: "Administrator", title: "Administrator", desc: "DoLR Joint Secretary / Full Access" },
  { role: "Viewer", title: "Analyst / Viewer", desc: "NITI Aayog Read-only Analyst" },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  currentPage,
  onNavigate,
  onRoleChange,
  onLogout,
  unreadAlertCount,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-warm-100 flex flex-col md:flex-row text-forest-950 selection:bg-forest-200 selection:text-forest-950">
      {/* ====================================================
          DESKTOP LEFT SIDEBAR
         ==================================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-forest-950 text-white shrink-0 border-r border-forest-900 justify-between sticky top-0 h-screen z-30 shadow-soft-lg">
        <div>
          {/* Logo & Identity */}
          <div className="p-5 border-b border-forest-900/80">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-forest-900 border border-forest-700/80 flex items-center justify-center shadow-inner">
                <Shield className="w-5 h-5 text-forest-300" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    LandGuard<span className="text-forest-400">AI</span>
                  </span>
                </div>
                <p className="text-[10px] text-forest-300 font-medium">
                  DoLR • Ministry of Rural Dev.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-none">
            {NAV_ITEMS.filter(item => !item.adminOnly || currentUser.role === 'Administrator').map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-forest-900 text-white border border-forest-700/80 shadow-soft-sm'
                      : 'text-forest-200/70 hover:text-white hover:bg-forest-900/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-forest-300' : 'text-forest-400/80'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-forest-800 text-forest-300 border border-forest-700">
                      {item.badge}
                    </span>
                  )}

                  {item.showBadge && unreadAlertCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-600 text-white animate-pulse">
                      {unreadAlertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Bottom */}
        <div className="p-3 border-t border-forest-900/80 bg-forest-950/80">
          <div className="p-2.5 rounded-xl bg-forest-900/60 border border-forest-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-forest-800 border border-forest-700 flex items-center justify-center text-xs font-bold text-forest-200 shrink-0">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser.full_name}</p>
                <p className="text-[10px] text-forest-300 truncate">{currentUser.role}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-forest-400 hover:text-red-400 hover:bg-forest-800 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ====================================================
          MAIN CONTENT VIEWPORT & TOP HEADER
         ==================================================== */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* Top Header */}
        <header className="bg-white border-b border-warm-200 sticky top-0 z-20 shadow-soft-sm px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            {/* Greeting & Title on Desktop */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-warm-700 hover:bg-warm-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-forest-950">
                  {getGreeting()}, {currentUser.full_name.split(' ')[0]} 👋
                </h2>
                <p className="text-[11px] text-warm-600 font-medium hidden sm:block">
                  Here's your project risk overview and AI decision intelligence.
                </p>
              </div>
            </div>

            {/* Right Tools: Role Selector + Alert Bell + Avatar */}
            <div className="flex items-center space-x-3">
              {/* Interactive Role Switcher for Hackathon Evaluation */}
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center space-x-2 bg-warm-100 hover:bg-warm-200/80 border border-warm-300 px-3 py-1.5 rounded-full text-xs font-bold text-forest-950 transition-colors cursor-pointer shadow-soft-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse shrink-0" />
                  <span>{currentUser.role}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-warm-500" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-warm-200 shadow-soft-lg py-2 z-50 animate-fadeIn">
                    <div className="px-3.5 py-1.5 border-b border-warm-100">
                      <p className="text-[10px] font-extrabold text-forest-800 uppercase tracking-wider">
                        Switch Demonstration Role
                      </p>
                    </div>
                    {ROLES.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          onRoleChange(r.role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-forest-50 transition-colors cursor-pointer ${
                          currentUser.role === r.role ? 'bg-forest-50 font-bold text-forest-900' : 'text-warm-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{r.title}</p>
                          <p className="text-[10px] text-warm-500">{r.desc}</p>
                        </div>
                        {currentUser.role === r.role && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => onNavigate('alerts')}
                className="relative p-2 rounded-full bg-warm-100 hover:bg-warm-200 text-warm-700 transition cursor-pointer"
                title="Alerts"
              >
                <Bell className="w-4 h-4 text-forest-900" />
                {unreadAlertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Slide-over Drawer for Extra Tabs */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-forest-950/60 backdrop-blur-xs z-40" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-forest-950 text-white w-64 h-full p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-3 border-b border-forest-900">
                <span className="font-bold text-sm text-white">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-4 h-4 text-forest-300" />
                </button>
              </div>
              <div className="space-y-1 text-xs font-semibold">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-forest-200 hover:bg-forest-900 hover:text-white"
                    >
                      <Icon className="w-4 h-4 text-forest-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Routed Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>

      {/* ====================================================
          MOBILE BOTTOM NAVIGATION (5 Icons + Prominent Scan)
         ==================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-warm-200 py-2 px-3 z-30 shadow-soft-lg flex justify-around items-center">
        {/* 1. Home */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            currentPage === 'dashboard' ? 'text-forest-900' : 'text-warm-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </button>

        {/* 2. Projects */}
        <button
          onClick={() => onNavigate('projects')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            currentPage === 'projects' ? 'text-forest-900' : 'text-warm-500'
          }`}
        >
          <FolderGit2 className="w-4 h-4 mb-0.5" />
          <span>Projects</span>
        </button>

        {/* 3. Scan & Inspect (Prominent Elevated Button) */}
        <button
          onClick={() => onNavigate('scan')}
          className="flex flex-col items-center -mt-5 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-forest-900 border-2 border-white flex items-center justify-center text-white shadow-soft-md hover:bg-forest-950 transition-transform active:scale-95">
            <Scan className="w-5 h-5 text-forest-200" />
          </div>
          <span className="text-[10px] font-bold text-forest-950 mt-0.5">Scan</span>
        </button>

        {/* 4. Alerts */}
        <button
          onClick={() => onNavigate('alerts')}
          className={`flex flex-col items-center text-[10px] font-bold relative ${
            currentPage === 'alerts' ? 'text-forest-900' : 'text-warm-500'
          }`}
        >
          <AlertTriangle className="w-4 h-4 mb-0.5" />
          <span>Alerts</span>
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-red-600" />
          )}
        </button>

        {/* 5. More / GIS */}
        <button
          onClick={() => onNavigate('map')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            currentPage === 'map' ? 'text-forest-900' : 'text-warm-500'
          }`}
        >
          <MapPin className="w-4 h-4 mb-0.5" />
          <span>GIS Map</span>
        </button>
      </nav>
    </div>
  );
};
