import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  MapPin,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: UserRole;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, userRole }) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects Registry', icon: FolderGit2 },
    { id: 'map', label: 'GIS Map Explorer', icon: MapPin },
    { id: 'analytics', label: 'Delay Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alert Center', icon: AlertTriangle },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'model', label: 'ML Operations', icon: Cpu },
  ];

  if (userRole === 'Administrator') {
    navItems.push({ id: 'admin', label: 'Admin Console', icon: ShieldCheck });
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
