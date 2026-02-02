/**
 * Super Admin - System Settings
 * Platform-wide configuration
 */

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import api from '../../lib/api.js';

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: 'Vanilla SaaS Platform',
    maxFileSize: 10,
    defaultTokenAllocation: 1000,
    aiRateLimit: 60,
    maintenanceMode: false
  });

  const handleSave = async () => {
    try {
      // TODO: Implement backend endpoint
      // await api.put('/superadmin/settings', settings);
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>
            System Settings
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
            Configure platform-wide settings
          </p>
        </div>

        <div
          className="rounded-lg p-6 space-y-6"
          style={{
            backgroundColor: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
              Platform Name
            </label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
              Max File Size (MB)
            </label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
              Default Token Allocation
            </label>
            <input
              type="number"
              value={settings.defaultTokenAllocation}
              onChange={(e) => setSettings({ ...settings, defaultTokenAllocation: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-foreground)' }}>
              AI Rate Limit (per minute)
            </label>
            <input
              type="number"
              value={settings.aiRateLimit}
              onChange={(e) => setSettings({ ...settings, aiRateLimit: parseInt(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)'
              }}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              Maintenance Mode
            </label>
          </div>

          <button
            onClick={handleSave}
            className="w-full px-4 py-2 rounded-lg font-medium"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-background)'
            }}
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
