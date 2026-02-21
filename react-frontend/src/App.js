import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import ContentGenerator from './pages/ContentGenerator';
import ContentHistory from './pages/ContentHistory';
import Analytics from './pages/Analytics';
import Templates from './pages/Templates';
import PromptTemplates from './pages/PromptTemplates';
import Settings from './pages/Settings';
import QualityAnalysis from './pages/QualityAnalysis';
import BatchProcessing from './pages/BatchProcessing';
import ABTestHistory from './pages/ABTestHistory';
import LandingPage from './pages/LandingPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { ContentProvider } from './contexts/ContentContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BatchProvider } from './contexts/BatchContext';

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// App Layout Component
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen stars-bg bg-cosmic-gradient">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <TopNavbar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Page Content */}
        <main className="p-6">
          <ErrorBoundary>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/generator" element={<ContentGenerator />} />
              <Route path="/history" element={<ContentHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/prompt-templates" element={<PromptTemplates />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/quality-analysis" element={<QualityAnalysis />} />
              <Route path="/batch" element={<BatchProcessing />} />
              <Route path="/ab-test-history" element={<ABTestHistory />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(139, 92, 246, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <UserProvider>
          <NotificationProvider>
            <ContentProvider>
              <BatchProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/*" element={<AppLayout />} />
                  </Routes>
                </Router>
              </BatchProvider>
            </ContentProvider>
          </NotificationProvider>
        </UserProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;