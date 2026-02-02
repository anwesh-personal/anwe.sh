/**
 * Main App Component
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { TokenWalletProvider } from './contexts/TokenWalletContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import AIStudio from './pages/AIStudio.jsx';
import ThemeShowcase from './pages/ThemeShowcase.jsx';
import SuperAdmin from './pages/SuperAdmin/index.jsx';
import WorkflowBuilder from './pages/WorkflowBuilder.jsx';
import EngineManagement from './pages/EngineManagement.jsx';
import Analytics from './pages/Analytics.jsx';
import WorkerMonitoring from './pages/WorkerMonitoring.jsx';
import BrandKitMockups from './pages/BrandKitMockups.jsx';
import SaasBuilder from './pages/SaasBuilder.jsx';
import Landing from './pages/Landing.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import ThemeSwitcher from './components/ThemeSwitcher.jsx';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TokenWalletProvider>
          <Router>
            <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
              {/* Theme Switcher - Fixed position */}
              <div className="fixed top-4 right-4 z-50">
                <ThemeSwitcher />
              </div>
              
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/showcase" element={<ThemeShowcase />} />
                <Route path="/brand-kits" element={<BrandKitMockups />} />
                <Route path="/builder" element={<SaasBuilder />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ai"
                  element={
                    <PrivateRoute>
                      <AIStudio />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/workflows"
                  element={
                    <PrivateRoute>
                      <WorkflowBuilder />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/engines"
                  element={
                    <PrivateRoute>
                      <EngineManagement />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <PrivateRoute>
                      <Analytics />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/workers"
                  element={
                    <PrivateRoute>
                      <WorkerMonitoring />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/superadmin/*"
                  element={
                    <PrivateRoute>
                      <SuperAdmin />
                    </PrivateRoute>
                  }
                />
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              <Toaster 
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'var(--color-background-secondary)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-border)',
                  },
                }}
              />
            </div>
          </Router>
        </TokenWalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
