import React, { useState, useEffect } from 'react';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { MobileAppShell } from './components/MobileAppShell';
import { LandGuardChatbot } from './components/LandGuardChatbot';
import { DashboardPage } from './pages/DashboardPage';
import { ScanInspect } from './pages/ScanInspect';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { MapPage } from './pages/MapPage';
import { AlertsPage } from './pages/AlertsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelPage } from './pages/ModelPage';
import { AdminPage } from './pages/AdminPage';
import { SupportCenterPage } from './pages/SupportCenterPage';
import { User, UserRole } from './types';
import { getActiveUser, setActiveUser, api } from './services/api';
import { DEMO_ALERTS } from './data/demoData';

export function App() {
  // Navigation & Session State
  const [sessionState, setSessionState] = useState<'onboarding' | 'login' | 'app'>('onboarding');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('LA-JH-2026-0042');
  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(DEMO_ALERTS.filter(a => !a.is_read).length);
  const [showPhoneFrame, setShowPhoneFrame] = useState<boolean>(() => {
    const saved = localStorage.getItem('landguard_phone_frame');
    return saved === 'true';
  });

  const togglePhoneFrame = () => {
    setShowPhoneFrame(prev => {
      const nextVal = !prev;
      localStorage.setItem('landguard_phone_frame', String(nextVal));
      return nextVal;
    });
  };

  useEffect(() => {
    const cached = getActiveUser();
    if (cached) {
      setCurrentUser(cached);
      setSessionState('app');
    }

    // Fetch real unread alert count from backend
    api.getAlerts(undefined, false)
      .then(alerts => {
        if (alerts && alerts.length >= 0) {
          setUnreadAlertCount(alerts.length);
        }
      })
      .catch(() => {});
  }, []);

  const handleRoleChange = (role: UserRole) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      role: role,
      full_name: role === "District Officer"
        ? "Demo Officer (Ranchi Collectorate)"
        : role === "State Officer"
        ? "Dr. Shailesh Kumar, IAS"
        : role === "Project Manager"
        ? "Sanjay Tripathy, CE (NHAI)"
        : role === "Administrator"
        ? "Rajesh Sharma, IAS (DoLR)"
        : "Sunita Rao (NITI Aayog)"
    };
    setActiveUser(updated);
    setCurrentUser(updated);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('project_detail');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    localStorage.removeItem('landguard_active_user');
    localStorage.removeItem('landguard_access_token');
    setCurrentUser(null);
    setSessionState('login');
  };

  const handleEnterDemoMode = () => {
    const demoOfficer: User = {
      id: 1,
      email: "district.officer@landguard.gov.in",
      full_name: "Demo Officer",
      role: "District Officer",
      state: "Jharkhand",
      district: "Ranchi",
      department: "District Land Acquisition Office",
      is_active: true
    };
    setActiveUser(demoOfficer);
    setCurrentUser(demoOfficer);
    setSessionState('app');
    setCurrentPage('dashboard');
  };

  // 1. Pre-Login Onboarding Experience (4 Mobile Screens)
  if (sessionState === 'onboarding') {
    return (
      <Onboarding
        onComplete={() => setSessionState('login')}
        showPhoneFrame={showPhoneFrame}
        onTogglePhoneFrame={togglePhoneFrame}
      />
    );
  }

  // 2. Mobile Login Screen
  if (sessionState === 'login' || !currentUser) {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setSessionState('app');
          setCurrentPage('dashboard');
        }}
        onEnterDemoMode={handleEnterDemoMode}
        showPhoneFrame={showPhoneFrame}
        onTogglePhoneFrame={togglePhoneFrame}
      />
    );
  }

  // 3. Post-Login Mobile Application Shell (max-w 430px centered)
  return (
    <>
      <MobileAppShell
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onRoleChange={handleRoleChange}
        onLogout={handleLogout}
        unreadAlertCount={unreadAlertCount}
        showPhoneFrame={showPhoneFrame}
        onTogglePhoneFrame={togglePhoneFrame}
      >
        {/* 1. Dashboard */}
        {currentPage === 'dashboard' && (
          <DashboardPage
            onSelectProject={handleSelectProject}
            onNavigate={handleNavigate}
            userRole={currentUser.role}
          />
        )}

        {/* 2. Scan & Inspect */}
        {currentPage === 'scan' && (
          <ScanInspect
            onSelectProject={handleSelectProject}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('dashboard')}
          />
        )}

        {/* 3. Projects Listing */}
        {currentPage === 'projects' && (
          <ProjectsPage
            onSelectProject={handleSelectProject}
            onBack={() => handleNavigate('dashboard')}
            userRole={currentUser.role}
          />
        )}

        {/* 4. Project Details Dossier */}
        {currentPage === 'project_detail' && (
          <ProjectDetailPage
            projectId={selectedProjectId}
            onBack={() => handleNavigate('projects')}
            onNavigate={handleNavigate}
            userRole={currentUser.role}
          />
        )}

        {/* 5. GIS Map */}
        {currentPage === 'map' && (
          <MapPage
            onSelectProject={handleSelectProject}
          />
        )}

        {/* 6. Alerts */}
        {currentPage === 'alerts' && (
          <AlertsPage
            onSelectProject={handleSelectProject}
            userRole={currentUser.role}
          />
        )}

        {/* 7. Recommendations */}
        {currentPage === 'recommendations' && (
          <RecommendationsPage
            onSelectProject={handleSelectProject}
            userRole={currentUser.role}
          />
        )}

        {/* 8. Analytics */}
        {currentPage === 'analytics' && (
          <AnalyticsPage />
        )}

        {/* 9. Model Management */}
        {currentPage === 'model' && (
          <ModelPage
            userRole={currentUser.role}
          />
        )}

        {/* 10. Admin Console */}
        {currentPage === 'admin' && (
          <AdminPage />
        )}

        {/* 11. Helpline & Support Center */}
        {currentPage === 'support' && (
          <SupportCenterPage
            userRole={currentUser.role}
          />
        )}
      </MobileAppShell>

      {/* 🤖 AI Chatbot — floats on all pages */}
      <LandGuardChatbot showPhoneFrame={showPhoneFrame} />
    </>
  );
}

export default App;
