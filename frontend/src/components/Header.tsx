import React, { useState, useEffect } from 'react';
import { Shield, Bell, User as UserIcon, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';
import { User, UserRole } from '../types';
import { api, getActiveUser, setActiveUser, removeAuthToken } from '../services/api';

interface HeaderProps {
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  onNavigate: (page: string) => void;
}

const ROLES: { role: UserRole; name: string; email: string; desc: string }[] = [
  { role: "Administrator", name: "Rajesh Sharma, IAS", email: "admin@landguard.gov.in", desc: "Full System & Model Control" },
  { role: "State Officer", name: "Dr. Anita Soren", email: "state.officer@landguard.gov.in", desc: "Jharkhand State Nodal Officer" },
  { role: "District Officer", name: "Vikramaditya Verma", email: "district.officer@landguard.gov.in", desc: "Ranchi District Collectorate" },
  { role: "Project Manager", name: "Sanjay Kulkarni", email: "pm@landguard.gov.in", desc: "NHAI Expressway Project Lead" },
  { role: "Viewer", name: "Pooja Sen", email: "viewer@landguard.gov.in", desc: "NITI Aayog Read-Only Analyst" },
];

export const Header: React.FC<HeaderProps> = ({ currentUser, onUserChange, onNavigate }) => {
  const [alertCount, setAlertCount] = useState<number>(0);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alerts = await api.getAlerts(undefined, false);
        setAlertCount(alerts.length);
      } catch (err) {
        // silent fallback
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 20000);
    return () => clearInterval(interval);
  }, []);

  const switchRole = async (targetRole: typeof ROLES[0]) => {
    try {
      // In demo mode, log in automatically as the target role
      const passwords: Record<string, string> = {
        "admin@landguard.gov.in": "Admin@123",
        "state.officer@landguard.gov.in": "State@123",
        "district.officer@landguard.gov.in": "District@123",
        "pm@landguard.gov.in": "Manager@123",
        "viewer@landguard.gov.in": "Viewer@123"
      };
      const res = await api.login(targetRole.email, passwords[targetRole.email] || "Admin@123");
      localStorage.setItem('landguard_token', res.access_token);
      setActiveUser(res.user);
      onUserChange(res.user);
      setRoleDropdownOpen(false);
    } catch (e) {
      console.error("Role switch failed", e);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('landguard_user');
    onUserChange(null);
    onNavigate('login');
  };

  return (
    <header className="bg-gov-navy text-white shadow-md sticky top-0 z-40">
      {/* Tricolor National Accent Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Government Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gov-blue border border-sky-400/40 flex items-center justify-center shadow-inner">
              <Shield className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-white">LandGuard<span className="text-sky-400">AI</span></span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300">
                  Demo Dataset
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium tracking-wide">
                Ministry of Rural Development • Department of Land Resources (DoLR)
              </p>
            </div>
          </div>

          {/* Quick Role Switcher for Hackathon Judges & Profile */}
          <div className="flex items-center space-x-4">
            {/* Quick Role Selector Box */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-700/90 text-xs px-3 py-2 rounded-lg border border-slate-700 transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Demo Role</p>
                  <p className="font-medium text-white">{currentUser ? currentUser.role : "Select Role"}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-800">
                    <p className="text-[11px] font-semibold uppercase text-sky-400 tracking-wider">
                      Switch Role (Evaluation Mode)
                    </p>
                    <p className="text-[10px] text-slate-400">Test different permissions instantly</p>
                  </div>
                  {ROLES.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => switchRole(r)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition flex items-start space-x-2 ${
                        currentUser?.role === r.role ? 'bg-slate-800/80 text-sky-300' : 'text-slate-200'
                      }`}
                    >
                      <div className="mt-0.5">
                        {currentUser?.role === r.role ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{r.role}</span>
                          <span className="text-[10px] text-slate-400">{r.email.split('@')[0]}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => onNavigate('alerts')}
              className="relative p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
              title="View Delayed Project Alerts"
            >
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>

            {/* Logout */}
            {currentUser && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-800/90 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition border border-slate-700"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
