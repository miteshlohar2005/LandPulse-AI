import React, { useState } from 'react';
import {
  User, Shield, Key, Bell, Database, Cpu, CheckCircle2,
  RefreshCw, LogOut, FileText, Lock
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';

interface ProfileSettingsProps {
  currentUser: UserType;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  currentUser,
  onRoleChange,
  onLogout
}) => {
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [smsAlerts, setSmsAlerts] = useState<boolean>(true);
  const [weeklyDigest, setWeeklyDigest] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-forest-950 tracking-tight">Profile & Administrative Settings</h1>
        <p className="text-xs text-warm-600 font-medium">
          Manage your departmental credentials, notification frequencies, and access controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-soft-sm text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-forest-900 border-4 border-forest-200 text-forest-200 flex items-center justify-center mx-auto text-2xl font-bold shadow-soft">
            {currentUser.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-base text-forest-950">{currentUser.full_name}</h3>
            <p className="text-xs text-warm-500">{currentUser.email}</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-forest-100 text-forest-800 border border-forest-200 mt-2">
              {currentUser.role}
            </span>
          </div>

          <div className="pt-3 border-t border-warm-100 text-left text-xs space-y-2 text-warm-600">
            <div>
              <span className="text-[10px] uppercase font-bold text-warm-400 block">Department</span>
              <p className="font-semibold text-forest-950">{currentUser.department}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-warm-400 block">Jurisdiction</span>
              <p className="font-semibold text-forest-950">{currentUser.state || "National"} • {currentUser.district || "All Districts"}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Preferences & Notification Settings (2 Cols) */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-warm-200 shadow-soft-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* Notification Channel Toggles */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-forest-950 flex items-center border-b border-warm-100 pb-2">
                <Bell className="w-4 h-4 mr-1.5 text-forest-700" />
                Notification Preferences
              </h3>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 bg-warm-50 rounded-2xl border border-warm-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-forest-950 block">Critical Delay Alert Emails</span>
                    <span className="text-[11px] text-warm-500">Dispatch instant email alerts when project delay probability breaches 80%.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 text-forest-700 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-warm-50 rounded-2xl border border-warm-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-forest-950 block">SMS Milestone Escalations</span>
                    <span className="text-[11px] text-warm-500">Dispatch urgent SMS alerts to Nodal Officer phone for court stay orders.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="w-4 h-4 text-forest-700 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-warm-50 rounded-2xl border border-warm-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-forest-950 block">Weekly District Revenue Digest</span>
                    <span className="text-[11px] text-warm-500">Consolidated Monday summary of compensation disbursements.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    className="w-4 h-4 text-forest-700 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Demonstration Notice */}
            <div className="p-4 bg-forest-50 border border-forest-200 rounded-2xl space-y-1">
              <span className="font-bold text-forest-950 block">Sandbox Demonstration Notice</span>
              <p className="text-forest-800 text-[11px] leading-relaxed">
                You are currently running LandGuard AI in demonstration sandbox mode. Changes to demonstration credentials and mock settings are stored locally in application session storage.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-emerald-700 font-bold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Preferences updated successfully!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl font-bold transition shadow-soft cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
