import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { User, UserRole } from '../types';
import { api, setActiveUser, setAuthToken } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

const DEMO_ACCOUNTS = [
  { role: "Administrator" as UserRole, name: "Rajesh Sharma, IAS", email: "admin@landguard.gov.in", pwd: "Admin@123", desc: "Full administrative & ML retraining access" },
  { role: "State Officer" as UserRole, name: "Dr. Anita Soren", email: "state.officer@landguard.gov.in", pwd: "State@123", desc: "State-level monitoring for Jharkhand" },
  { role: "District Officer" as UserRole, name: "Vikramaditya Verma", email: "district.officer@landguard.gov.in", pwd: "District@123", desc: "Ranchi District Land Acquisition Officer" },
  { role: "Project Manager" as UserRole, name: "Sanjay Kulkarni", email: "pm@landguard.gov.in", pwd: "Manager@123", desc: "NHAI Project Manager (Ranchi Expressway)" },
  { role: "Viewer" as UserRole, name: "Pooja Sen", email: "viewer@landguard.gov.in", pwd: "Viewer@123", desc: "NITI Aayog Read-only Infrastructure Analyst" },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('admin@landguard.gov.in');
  const [password, setPassword] = useState<string>('Admin@123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email, password);
      setAuthToken(res.access_token);
      setActiveUser(res.user);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.pwd);
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(acc.email, acc.pwd);
      setAuthToken(res.access_token);
      setActiveUser(res.user);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F7F2] via-[#F9FAF7] to-[#EDF3EC] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Emblem & Portal Identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-forest-900 text-white shadow-xl mb-2">
            <Shield className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-forest-950 bg-transparent">
            LandGuard <span className="text-forest-700">AI</span>
          </h1>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-widest bg-transparent">
            Ministry of Rural Development • Department of Land Resources (DoLR)
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-7 space-y-5 border border-slate-200">
          <div>
            <h2 className="text-lg font-extrabold text-forest-950 bg-transparent">Official Portal Login</h2>
            <p className="text-xs text-slate-600 bg-transparent">Enter authorized government email and security credentials</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1 bg-transparent">Official Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-forest-700 focus:border-forest-700 focus:outline-none text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 bg-transparent">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-forest-700 focus:border-forest-700 focus:outline-none text-xs font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center bg-transparent">
              ⚡ Quick Demo Login
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-forest-50/60 border border-slate-200 hover:border-forest-600/40 transition flex items-center justify-between text-xs group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900 group-hover:text-forest-900 bg-transparent">{acc.role}</span>
                      <span className="text-[10px] text-slate-500 bg-transparent">• {acc.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 bg-transparent">{acc.desc}</p>
                  </div>
                  <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-forest-700" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-World Honesty Notice */}
        <p className="text-center text-[11px] text-slate-500 max-w-sm mx-auto bg-transparent">
          Demonstration Dataset: Predictions are for presentation purposes.
        </p>
      </div>
    </div>
  );
};
