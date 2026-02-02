/**
 * Super Admin - AI Provider Management
 * Configure AI providers and models
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/api.js';

const SuperAdminAIProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      // TODO: Implement backend endpoint
      // Mock data
      setProviders([
        { id: '1', name: 'OpenAI', type: 'openai', status: 'active', models: 5, apiKeySet: true },
        { id: '2', name: 'Anthropic', type: 'anthropic', status: 'active', models: 3, apiKeySet: true },
        { id: '3', name: 'Google AI', type: 'google', status: 'inactive', models: 2, apiKeySet: false },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>
              AI Provider Management
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
              Configure AI providers and models
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
            Add Provider
          </button>
        </div>

        {/* Providers List */}
        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="rounded-lg p-6"
              style={{
                backgroundColor: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--color-foreground)' }}>
                      {provider.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                      {provider.type} • {provider.models} models
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {provider.apiKeySet ? (
                      <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <XCircle className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
                    )}
                    <span
                      className="px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor: provider.status === 'active' ? 'var(--color-success)' : 'var(--color-error)',
                        color: 'var(--color-background)'
                      }}
                    >
                      {provider.status}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="px-4 py-2 rounded-lg border"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-foreground)'
                    }}
                  >
                    <Edit className="w-4 h-4 inline mr-2" />
                    Edit
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-error)',
                      color: 'var(--color-background)'
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAIProviders;
