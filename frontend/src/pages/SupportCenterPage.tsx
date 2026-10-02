import React, { useState, useEffect } from 'react';
import {
  PhoneCall, Mail, Clock, Send, Search, CheckCircle2,
  HelpCircle, ShieldAlert, User, Phone, Tag,
  ChevronRight, RefreshCw, Edit3, Check, Copy, Settings,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { SupportConfig, SupportTicket, SupportCategory, SupportTicketStatus } from '../types';

interface SupportCenterPageProps {
  userRole?: string;
}

const CATEGORIES: SupportCategory[] = [
  'Land Records',
  'Property Ownership',
  'Document Problems',
  'Land Dispute',
  'Application Delay',
  'Technical Problem',
  'Other'
];

const STATUS_ORDER: SupportTicketStatus[] = [
  'Request Received',
  'Under Review',
  'Support Team Assigned',
  'Additional Information Required',
  'Resolved',
  'Closed'
];

export const SupportCenterPage: React.FC<SupportCenterPageProps> = ({ userRole }) => {
  const isAdmin = userRole === 'Administrator';

  // Config State
  const [config, setConfig] = useState<SupportConfig>({
    support_phone: '+91 XXXXX XXXXX',
    support_email: 'support@landguard.ai',
    support_hours: 'Monday–Saturday | 9:00 AM–6:00 PM'
  });
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    category: 'Land Records',
    subject: '',
    description: ''
  });
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [copiedTicketId, setCopiedTicketId] = useState<boolean>(false);

  // Status Check State
  const [searchTicketId, setSearchTicketId] = useState<string>('');
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [statusResult, setStatusResult] = useState<any | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Admin Section State
  const [adminTickets, setAdminTickets] = useState<SupportTicket[]>([]);
  const [loadingAdminTickets, setLoadingAdminTickets] = useState<boolean>(false);
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminResponseText, setAdminResponseText] = useState<string>('');
  const [adminStatusVal, setAdminStatusVal] = useState<string>('');
  const [adminAssignedVal, setAdminAssignedVal] = useState<string>('');
  const [adminSaving, setAdminSaving] = useState<boolean>(false);
  const [adminSaveSuccess, setAdminSaveSuccess] = useState<string | null>(null);

  // Admin Config Form State
  const [configPhone, setConfigPhone] = useState<string>('');
  const [configEmail, setConfigEmail] = useState<string>('');
  const [configHours, setConfigHours] = useState<string>('');
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState<boolean>(false);

  // Load initial support config
  useEffect(() => {
    fetchConfig();
    if (isAdmin) {
      fetchAdminTickets();
    }
  }, [isAdmin]);

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await api.getSupportConfig();
      setConfig(res);
      setConfigPhone(res.support_phone);
      setConfigEmail(res.support_email);
      setConfigHours(res.support_hours);
    } catch (err) {
      console.error('Failed to load support config', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchAdminTickets = async () => {
    try {
      setLoadingAdminTickets(true);
      const tickets = await api.getAdminTickets({
        search: adminSearch || undefined,
        category: adminCategoryFilter || undefined,
        status: adminStatusFilter || undefined
      });
      setAdminTickets(tickets);
    } catch (err) {
      console.error('Failed to load admin tickets', err);
    } finally {
      setLoadingAdminTickets(false);
    }
  };

  // Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!formData.fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formData.subject.trim()) {
      setFormError('Please enter a subject.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please describe your issue or concern.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.submitSupportTicket({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        category: formData.category,
        subject: formData.subject.trim(),
        description: formData.description.trim()
      });

      setSubmittedTicketId(res.ticket_id);
      setSearchTicketId(res.ticket_id);
      // Reset form fields
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        category: 'Land Records',
        subject: '',
        description: ''
      });

      if (isAdmin) {
        fetchAdminTickets();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit support request. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Status Check
  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicketId.trim()) return;

    setStatusError(null);
    setStatusResult(null);
    setCheckingStatus(true);

    try {
      const res = await api.checkTicketStatus(searchTicketId.trim());
      setStatusResult(res);
    } catch (err: any) {
      setStatusError(err.message || `No ticket found with ID "${searchTicketId}". Please check and try again.`);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Copy Ticket ID
  const handleCopyTicketId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTicketId(true);
    setTimeout(() => setCopiedTicketId(false), 2500);
  };

  // Open ticket modal in admin
  const handleOpenTicketModal = (t: SupportTicket) => {
    setSelectedTicket(t);
    setAdminResponseText(t.admin_response || '');
    setAdminStatusVal(t.status);
    setAdminAssignedVal(t.assigned_to || '');
    setAdminSaveSuccess(null);
  };

  // Save admin ticket update
  const handleSaveTicketUpdate = async () => {
    if (!selectedTicket) return;
    try {
      setAdminSaving(true);
      const updated = await api.updateAdminTicket(selectedTicket.ticket_id, {
        status: adminStatusVal,
        admin_response: adminResponseText.trim() || undefined,
        assigned_to: adminAssignedVal.trim() || undefined
      });
      setSelectedTicket(updated);
      setAdminSaveSuccess('Ticket updated successfully!');
      fetchAdminTickets();
      setTimeout(() => setAdminSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket');
    } finally {
      setAdminSaving(false);
    }
  };

  // Save admin config update
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const updated = await api.updateSupportConfig({
        support_phone: configPhone.trim(),
        support_email: configEmail.trim(),
        support_hours: configHours.trim()
      });
      setConfig(updated);
      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update support configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Request Received':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Support Team Assigned':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Additional Information Required':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ─── Hero Header ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-forest-900 via-forest-800 to-forest-950 text-white rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-forest-700/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-700/60 border border-forest-600/60 text-xs font-semibold uppercase tracking-wider text-forest-200 mb-4 backdrop-blur-sm">
            <HelpCircle className="w-3.5 h-3.5 text-forest-300" />
            LandGuard Support Center
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Need Help?
          </h1>
          <p className="text-forest-100/90 text-base md:text-lg leading-relaxed">
            Get help from our support team for land-related concerns. Our support center is here to assist you with land-related questions, technical issues, and general guidance.
          </p>
        </div>
      </div>

      {/* ─── Support Options: Two Primary Cards ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Call Support */}
        <div className="bg-white rounded-2xl p-6 border border-app-border shadow-card hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-forest-50 border border-forest-200/60 flex items-center justify-center text-forest-700 mb-4">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Call Our Support Team
            </h3>
            <p className="text-sm text-app-muted mb-6">
              Users can contact the LandGuard support team directly for assistance.
            </p>

            <div className="space-y-3 bg-app-bg/60 p-4 rounded-xl border border-app-border mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-app-muted flex items-center gap-2">
                  <Phone className="w-4 h-4 text-forest-600" /> Helpline Number:
                </span>
                <span className="font-semibold text-gray-900 font-mono">
                  {loadingConfig ? 'Loading...' : config.support_phone}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-app-border/60 pt-3">
                <span className="text-app-muted flex items-center gap-2">
                  <Clock className="w-4 h-4 text-forest-600" /> Available Hours:
                </span>
                <span className="font-medium text-gray-800 text-right">
                  {loadingConfig ? 'Loading...' : config.support_hours}
                </span>
              </div>
            </div>
          </div>

          <a
            href={`tel:${config.support_phone.replace(/\s+/g, '')}`}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-forest-900 hover:bg-forest-800 text-white font-semibold rounded-xl shadow-sm hover:shadow transition active:scale-[0.99]"
          >
            <PhoneCall className="w-4 h-4" />
            Call Now
          </a>
        </div>

        {/* Card 2: Email Support */}
        <div className="bg-white rounded-2xl p-6 border border-app-border shadow-card hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Email Support
            </h3>
            <p className="text-sm text-app-muted mb-6">
              Send your query to our support inbox. Our specialized team reviews every submission.
            </p>

            <div className="space-y-3 bg-app-bg/60 p-4 rounded-xl border border-app-border mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-app-muted flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" /> Support Email:
                </span>
                <span className="font-semibold text-gray-900 font-mono">
                  {loadingConfig ? 'Loading...' : config.support_email}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-app-border/60 pt-3">
                <span className="text-app-muted flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" /> Response Time:
                </span>
                <span className="font-medium text-gray-800">
                  Within 24–48 business hours
                </span>
              </div>
            </div>
          </div>

          <a
            href={`mailto:${config.support_email}?subject=LandGuard%20Support%20Inquiry`}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-forest-700 hover:bg-forest-600 text-white font-semibold rounded-xl shadow-sm hover:shadow transition active:scale-[0.99]"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </a>
        </div>
      </div>

      {/* ─── Contact Form & Status Checker Grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Send a Support Request Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 border border-app-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Send a Support Request
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-forest-50 text-forest-700 rounded-full border border-forest-200/60">
              Official Helpline
            </span>
          </div>
          <p className="text-sm text-app-muted mb-6">
            Fill out the details below to open an official inquiry with the LandGuard land advisory & technical desk.
          </p>

          {/* Success state */}
          {submittedTicketId ? (
            <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-950">
                    Support Request Submitted Successfully!
                  </h4>
                  <p className="text-sm text-emerald-800 mt-1">
                    Your request has been registered in the LandGuard Helpline system. Our support team will review your case and contact you soon.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Your Ticket ID
                  </span>
                  <div className="text-2xl font-black font-mono text-gray-900">
                    {submittedTicketId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyTicketId(submittedTicketId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-medium text-sm rounded-lg transition cursor-pointer"
                >
                  {copiedTicketId ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-emerald-700" />
                      Copy Ticket ID
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedTicketId(null);
                  }}
                  className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium text-sm rounded-xl transition cursor-pointer"
                >
                  Submit Another Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('ticket-status-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Track This Ticket Below
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-forest-50/30 border border-forest-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-forest-50/30 border border-forest-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone Number <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-forest-50/30 border border-forest-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Issue Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-forest-50/30 border border-forest-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your query or problem"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 bg-forest-50/30 border border-forest-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide all relevant details, including survey numbers, district/state, or application reference IDs if applicable..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-forest-50/30 border border-forest-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-forest-900 hover:bg-forest-800 text-white font-semibold rounded-xl shadow-sm hover:shadow transition disabled:opacity-60 cursor-pointer"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right 1 Col: Check Ticket Status Card */}
        <div id="ticket-status-section" className="bg-white rounded-2xl p-6 md:p-8 border border-app-border shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-lg bg-forest-50 border border-forest-200/60 flex items-center justify-center text-forest-800">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Check Ticket Status
              </h3>
            </div>
            <p className="text-xs text-app-muted mb-5">
              Enter your Ticket ID to view real-time status and response from the LandGuard support team.
            </p>

            <form onSubmit={handleCheckStatus} className="space-y-3 mb-6">
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. #LG-2026-0001"
                  value={searchTicketId}
                  onChange={(e) => setSearchTicketId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={checkingStatus || !searchTicketId.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-700 text-white font-semibold text-sm rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {checkingStatus ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Check Status
                  </>
                )}
              </button>
            </form>

            {/* Status Check Error */}
            {statusError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <span>{statusError}</span>
              </div>
            )}

            {/* Status Result Card */}
            {statusResult && (
              <div className="bg-forest-50/40 border border-forest-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-forest-100 pb-2.5">
                  <span className="font-mono text-xs font-bold text-gray-700">
                    {statusResult.ticket_id}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(statusResult.status)}`}>
                    {statusResult.status}
                  </span>
                </div>

                <div>
                  <h5 className="text-sm font-bold text-gray-900 line-clamp-1">
                    {statusResult.subject}
                  </h5>
                  <p className="text-xs text-app-muted mt-0.5">
                    Category: <span className="font-medium text-gray-700">{statusResult.category}</span>
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="pt-2 border-t border-forest-100">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase mb-2">
                    Resolution Lifecycle
                  </div>
                  <div className="space-y-1.5">
                    {STATUS_ORDER.slice(0, 5).map((step, idx) => {
                      const currentIdx = STATUS_ORDER.indexOf(statusResult.status as SupportTicketStatus);
                      const isCompleted = currentIdx >= idx;
                      const isCurrent = statusResult.status === step;

                      return (
                        <div key={step} className="flex items-center gap-2 text-xs">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isCurrent
                            ? 'bg-forest-700 text-white ring-2 ring-forest-300'
                            : isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                            }`}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span className={`${isCurrent ? 'font-bold text-forest-900' : isCompleted ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Admin Response Note */}
                {statusResult.admin_response ? (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-forest-200 text-xs">
                    <span className="font-semibold text-forest-900 block mb-1">
                      Support Team Response:
                    </span>
                    <p className="text-gray-700 leading-relaxed">
                      {statusResult.admin_response}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 italic mt-2">
                    Our team is currently reviewing your ticket. Updates will appear here.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-app-border text-xs text-app-muted text-center">
            Need urgent assistance? Call our direct helpline at{' '}
            <span className="font-semibold text-forest-800">{config.support_phone}</span>
          </div>
        </div>
      </div>

      {/* ─── Emergency & Legal Notice ────────────────────────────────── */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-950 mb-1">
              Important Legal & Operational Notice
            </h4>
            <p className="text-sm text-amber-900/90 leading-relaxed">
              LandGuard AI Support provides informational and analytical guidance based on machine learning predictions and registered land datasets. For active legal land disputes, civil court cases, mutation decrees, or official registration proceedings, please contact your respective District Revenue Department, Sub-Registrar Office, or legal counsel.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Admin Management Section (Administrator only) ───────────── */}
      {isAdmin && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-forest-200 shadow-card space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200 mb-2">
                <Settings className="w-3.5 h-3.5" />
                Administrator Console
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Helpline & Support Management
              </h3>
              <p className="text-sm text-app-muted mt-1">
                Manage contact numbers, view submitted inquiries, assign staff, and post official responses.
              </p>
            </div>

            <button
              onClick={fetchAdminTickets}
              disabled={loadingAdminTickets}
              className="inline-flex items-center gap-2 px-4 py-2 bg-app-bg hover:bg-gray-100 border border-app-border text-gray-700 text-sm font-medium rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAdminTickets ? 'animate-spin' : ''}`} />
              Refresh Tickets
            </button>
          </div>

          {/* Support Configuration Editor */}
          <div className="bg-app-bg/70 p-6 rounded-2xl border border-app-border">
            <h4 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-forest-700" />
              Support Contact Configuration
            </h4>
            <p className="text-xs text-app-muted mb-4">
              Changes made here are saved directly to the database and will update the public support cards.
            </p>

            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Support Phone Number
                </label>
                <input
                  type="text"
                  value={configPhone}
                  onChange={(e) => setConfigPhone(e.target.value)}
                  placeholder="+91 1800-XXX-XXXX"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={configEmail}
                  onChange={(e) => setConfigEmail(e.target.value)}
                  placeholder="support@landguard.ai"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={configHours}
                  onChange={(e) => setConfigHours(e.target.value)}
                  placeholder="Monday–Saturday | 9:00 AM–6:00 PM"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 flex items-center justify-between pt-2">
                <div>
                  {configSaveSuccess && (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Support contact info updated successfully!
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2 bg-forest-900 hover:bg-forest-800 text-white font-medium text-xs rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {savingConfig ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>

          {/* Tickets List & Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-gray-900">
                All Support Inquiries ({adminTickets.length})
              </h4>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchAdminTickets()}
                    className="w-full pl-9 pr-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                  />
                </div>

                <select
                  value={adminCategoryFilter}
                  onChange={(e) => {
                    setAdminCategoryFilter(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  value={adminStatusFilter}
                  onChange={(e) => {
                    setAdminStatusFilter(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button
                  type="button"
                  onClick={fetchAdminTickets}
                  className="px-3 py-1.5 bg-forest-800 text-white rounded-lg text-xs font-semibold hover:bg-forest-700 transition cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-app-border rounded-2xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-app-bg/90 border-b border-app-border text-gray-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Ticket ID</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned To</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {loadingAdminTickets ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest-700" />
                          Loading tickets...
                        </td>
                      </tr>
                    ) : adminTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          No support tickets found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      adminTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-forest-50/30 transition">
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">
                            {t.ticket_id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">{t.full_name}</div>
                            <div className="text-gray-400 text-[11px]">{t.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                              {t.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate font-medium text-gray-900">
                            {t.subject}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(t.status)}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {t.assigned_to || <span className="text-gray-400 italic">Unassigned</span>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenTicketModal(t)}
                              className="px-3 py-1 bg-forest-50 hover:bg-forest-100 text-forest-800 font-semibold rounded-lg border border-forest-200/80 transition cursor-pointer"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Admin Ticket Details Modal ─────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-app-border space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-start justify-between border-b border-app-border pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-forest-700">
                  {selectedTicket.ticket_id}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Submitter Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-app-bg/60 p-4 rounded-xl text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Submitter Name</span>
                <span className="font-semibold text-gray-900">{selectedTicket.full_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Email</span>
                <span className="font-semibold text-gray-900">{selectedTicket.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Phone</span>
                <span className="font-semibold text-gray-900">{selectedTicket.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Category</span>
                <span className="font-semibold text-gray-900">{selectedTicket.category}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Created Date</span>
                <span className="font-semibold text-gray-900">
                  {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <h5 className="text-xs font-bold uppercase text-gray-500 mb-1.5">
                Issue Description
              </h5>
              <div className="bg-app-bg p-4 rounded-xl text-sm text-gray-800 leading-relaxed border border-app-border/70">
                {selectedTicket.description}
              </div>
            </div>

            {/* Status & Assignment Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Update Ticket Status
                </label>
                <select
                  value={adminStatusVal}
                  onChange={(e) => setAdminStatusVal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign Officer / Desk
                </label>
                <input
                  type="text"
                  placeholder="e.g. Field Officer Verma"
                  value={adminAssignedVal}
                  onChange={(e) => setAdminAssignedVal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Response Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Official Response Notes (Visible to User)
              </label>
              <textarea
                rows={3}
                placeholder="Enter status update or resolution notes for the user to view..."
                value={adminResponseText}
                onChange={(e) => setAdminResponseText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-forest-600 focus:outline-none resize-none"
              />
            </div>

            {adminSaveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                {adminSaveSuccess}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-app-border">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveTicketUpdate}
                disabled={adminSaving}
                className="px-5 py-2 bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {adminSaving ? 'Saving Changes...' : 'Save & Update Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
