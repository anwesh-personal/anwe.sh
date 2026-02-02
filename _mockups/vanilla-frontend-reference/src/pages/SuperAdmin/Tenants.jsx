/**
 * Super Admin - Tenant Management
 * Manage all tenants and their subscriptions
 */

import React, { useState, useEffect } from 'react';
import { Search, Building2, Plus, Edit, Trash2, Eye } from 'lucide-react';
import api from '../../lib/api.js';

const SuperAdminTenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      // TODO: Implement backend endpoint
      // Mock data
      setTenants([
        { id: '1', name: 'Acme Corp', slug: 'acme', tier: 'enterprise', status: 'active', users: 25, createdAt: '2024-01-10' },
        { id: '2', name: 'Tech Inc', slug: 'tech', tier: 'professional', status: 'active', users: 15, createdAt: '2024-01-15' },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>
              Tenant Management
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
              Manage all tenants and subscriptions
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-lg font-medium"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-background)'
            }}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Tenant
          </button>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="rounded-lg p-6"
              style={{
                backgroundColor: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Building2 className="w-5 h-5" style={{ color: 'var(--color-background)' }} />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--color-foreground)' }}>
                      {tenant.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                      {tenant.slug}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                    Tier:
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {tenant.tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                    Users:
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {tenant.users}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                    Status:
                  </span>
                  <span
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: tenant.status === 'active' ? 'var(--color-success)' : 'var(--color-error)',
                      color: 'var(--color-background)'
                    }}
                  >
                    {tenant.status}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  className="flex-1 px-3 py-2 text-sm rounded-lg border"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)'
                  }}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  View
                </button>
                <button
                  className="px-3 py-2 text-sm rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-background)'
                  }}
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminTenants;
