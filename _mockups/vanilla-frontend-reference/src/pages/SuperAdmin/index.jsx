/**
 * Super Admin Layout
 * Main layout wrapper for all super admin pages
 */

import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Brain, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Dashboard from './Dashboard.jsx';
import UsersPage from './Users.jsx';
import TenantsPage from './Tenants.jsx';
import AIProvidersPage from './AIProviders.jsx';
import SettingsPage from './Settings.jsx';

const SuperAdmin = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/superadmin/users', icon: Users, label: 'Users' },
    { path: '/superadmin/tenants', icon: Building2, label: 'Tenants' },
    { path: '/superadmin/ai-providers', icon: Brain, label: 'AI Providers' },
    { path: '/superadmin/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => {
    if (path === '/superadmin') {
      return location.pathname === '/superadmin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 min-h-screen p-6"
        style={{
          backgroundColor: 'var(--color-background-secondary)',
          borderRight: '1px solid var(--color-border)'
        }}
      >
        <div className="mb-8">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Super Admin
          </h2>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  active ? 'font-medium' : ''
                }`}
                style={{
                  backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? 'var(--color-background)' : 'var(--color-foreground)'
                }}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full transition-colors"
            style={{
              color: 'var(--color-error)'
            }}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/ai-providers" element={<AIProvidersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default SuperAdmin;
