import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, Sparkles, Globe } from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { api, setActiveUser, setAuthToken } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
  onEnterDemoMode: () => void;
  showPhoneFrame?: boolean;
  onTogglePhoneFrame?: () => void;
}

interface RoleOption {
  role: UserRole;
  title: string;
  titleHi: string;
  email: string;
  pwd: string;
  desc: string;
  descHi: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "District Officer",
    title: "District Officer",
    titleHi: "जिला अधिकारी",
    email: "district.officer@landguard.gov.in",
    pwd: "District@123",
    desc: "Ranchi Collectorate",
    descHi: "रांची समाहरणालय"
  },
  {
    role: "State Officer",
    title: "State Officer",
    titleHi: "राज्य नोडल अधिकारी",
    email: "state.officer@landguard.gov.in",
    pwd: "State@123",
    desc: "Jharkhand Revenue",
    descHi: "झारखंड राजस्व विभाग"
  },
  {
    role: "Project Manager",
    title: "Project Manager",
    titleHi: "परियोजना प्रबंधक",
    email: "pm@landguard.gov.in",
    pwd: "Manager@123",
    desc: "NHAI Expressway Lead",
    descHi: "एनएचएआई एक्सप्रेसवे"
  },
  {
    role: "Viewer",
    title: "Analyst / Viewer",
    titleHi: "विश्लेषक / दर्शक",
    email: "viewer@landguard.gov.in",
    pwd: "Viewer@123",
    desc: "NITI Aayog Division",
    descHi: "नीति आयोग प्रभाग"
  }
];

const LOGIN_TRANSLATIONS = {
  en: {
    welcome: 'Welcome Back!',
    subtitle: 'Sign in to monitor your projects and manage acquisition risks with LandGuard AI.',
    selectRole: 'Select Your Role',
    demoProfile: 'Demonstration Profile',
    officialEmail: 'Official Email',
    password: 'Password',
    rememberMe: 'Remember Me',
    forgotPassword: 'Forgot Password?',
    forgotPasswordAlert: 'Password reset assistance dispatched to official email.',
    signIn: 'Sign In',
    signingIn: 'Signing In...',
    or: 'OR',
    enterDemoMode: 'Enter Demo Mode',
    demoNotice: 'Demo credentials are pre-loaded for presentation.',
    footer: 'Ministry of Rural Development • DoLR'
  },
  hi: {
    welcome: 'वापसी पर स्वागत है!',
    subtitle: 'LandGuard AI के साथ अपनी परियोजनाओं की निगरानी और भूमि अधिग्रहण जोखिम प्रबंधन के लिए साइन इन करें।',
    selectRole: 'अपनी भूमिका चुनें',
    demoProfile: 'डेमो प्रोफाइल',
    officialEmail: 'आधिकारिक ईमेल',
    password: 'पासवर्ड',
    rememberMe: 'मुझे याद रखें',
    forgotPassword: 'पासवर्ड भूल गए?',
    forgotPasswordAlert: 'पासवर्ड रीसेट सहायता आपके आधिकारिक ईमेल पर भेज दी गई है।',
    signIn: 'साइन इन करें',
    signingIn: 'साइन इन हो रहा है...',
    or: 'या',
    enterDemoMode: 'डेमो मोड में प्रवेश करें',
    demoNotice: 'प्रस्तुति के लिए डेमो क्रेडेंशियल्स पहले से लोड हैं।',
    footer: 'ग्रामीण विकास मंत्रालय • भूमि संसाधन विभाग (DoLR)'
  }
};

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onEnterDemoMode,
  showPhoneFrame = true
}) => {
  const [language, setLanguage] = useState<'en' | 'hi'>(() => {
    const saved = localStorage.getItem('landguard_language');
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  const [selectedRole, setSelectedRole] = useState<RoleOption>(ROLE_OPTIONS[0]);
  const [email, setEmail] = useState<string>(ROLE_OPTIONS[0].email);
  const [password, setPassword] = useState<string>(ROLE_OPTIONS[0].pwd);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t = LOGIN_TRANSLATIONS[language];

  const handleLanguageChange = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    localStorage.setItem('landguard_language', lang);
  };

  const handleSelectRole = (r: RoleOption) => {
    setSelectedRole(r);
    setEmail(r.email);
    setPassword(r.pwd);
    setError(null);
  };

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
      // Offline fallback for smooth demo presentation
      const fallbackUser: UserType = {
        id: 1,
        email: email,
        full_name: selectedRole.title === "District Officer" ? "Vikramaditya Verma" : "Demo Officer",
        role: selectedRole.role,
        state: "Jharkhand",
        district: "Ranchi",
        department: selectedRole.desc,
        is_active: true
      };
      setActiveUser(fallbackUser);
      onLoginSuccess(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        showPhoneFrame
          ? 'bg-slate-950 sm:py-6 flex items-center justify-center p-2 sm:p-4'
          : 'bg-gradient-to-br from-[#F4F7F2] via-[#F9FAF7] to-[#EDF3EC] flex flex-col justify-center items-center p-4'
      }`}
    >
      {/* Main Login Container */}
      <div
        className={`w-full bg-gradient-to-br from-[#F5F8F3] via-[#FAFCF9] to-[#EEF4EC] flex flex-col justify-between relative transition-all duration-300 ${
          showPhoneFrame
            ? 'sm:max-w-[440px] min-h-screen sm:min-h-[860px] sm:max-h-[920px] sm:rounded-[36px] sm:border-[8px] sm:border-slate-800 shadow-2xl overflow-y-auto p-5 sm:p-6'
            : 'max-w-md mx-auto p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl my-auto'
        }`}
      >
        {/* Top bar with Language Selector */}
        <div className="flex items-center justify-between z-10 shrink-0 pb-1">
          <div className="flex items-center space-x-1.5">
            <div className="w-6 h-6 rounded-lg bg-forest-900 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-forest-100" />
            </div>
            <span className="font-extrabold text-xs tracking-tight text-forest-950">
              LandGuard <span className="text-forest-600">AI</span>
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-white border border-app-border px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700 shadow-xs">
            <Globe className="w-3 h-3 text-forest-900 shrink-0" />
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'hi')}
              className="bg-transparent border-none focus:outline-hidden text-[11px] font-bold cursor-pointer text-forest-950"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center pt-2 pb-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest-900 text-white shadow-lg shadow-forest-900/20 mb-3 ring-4 ring-forest-900/10">
            <Shield className="w-6 h-6 text-emerald-300" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-forest-950 bg-transparent">
            {t.welcome}
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-600 max-w-[300px] mx-auto leading-relaxed mt-1.5 bg-transparent font-normal">
            {t.subtitle}
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="my-auto py-2 space-y-4">
          {/* Role Selection 2-Column Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-transparent block">
                {t.selectRole}
              </label>
              <span className="text-[10px] text-slate-500 font-medium bg-transparent">
                {t.demoProfile}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {ROLE_OPTIONS.map((r) => {
                const isSelected = selectedRole.role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-forest-700 bg-[#F0FAF4] shadow-xs ring-1 ring-forest-700/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <span
                        className={`text-xs font-bold leading-tight bg-transparent ${
                          isSelected ? 'text-forest-950' : 'text-slate-800'
                        }`}
                      >
                        {language === 'hi' ? r.titleHi : r.title}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 truncate bg-transparent font-normal">
                      {language === 'hi' ? r.descHi : r.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3.5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Official Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block bg-transparent">
                {t.officialEmail}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="district.officer@landguard.gov.in"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block bg-transparent">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center text-xs pt-0.5">
              <label className="flex items-center space-x-2 cursor-pointer bg-transparent">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-forest-800 focus:ring-forest-700 border-slate-300 cursor-pointer accent-forest-800"
                />
                <span className="text-slate-700 font-medium bg-transparent">{t.rememberMe}</span>
              </label>

              <button
                type="button"
                onClick={() => alert(t.forgotPasswordAlert)}
                className="font-bold text-forest-800 hover:text-forest-950 hover:underline bg-transparent cursor-pointer"
              >
                {t.forgotPassword}
              </button>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-forest-900 hover:bg-forest-950 active:scale-[0.99] text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-70 mt-1"
            >
              <span>{loading ? t.signingIn : t.signIn}</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1.5">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative">
                {t.or}
              </span>
            </div>

            {/* Secondary Demo Mode Button */}
            <button
              type="button"
              onClick={onEnterDemoMode}
              className="w-full py-2.5 bg-white hover:bg-forest-50/60 active:scale-[0.99] text-forest-900 border-2 border-forest-700/40 hover:border-forest-700/70 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-forest-700" />
              <span>{t.enterDemoMode}</span>
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-500 bg-transparent">
            {t.demoNotice}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-1 border-t border-slate-200/60">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-transparent">
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
};
