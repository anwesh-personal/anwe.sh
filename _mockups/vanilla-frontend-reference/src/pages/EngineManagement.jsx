/**
 * Engine Management Page
 * Manage AI engines and their configurations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Settings, Trash2, Copy } from 'lucide-react';
import engineService from '../services/engineService.js';
import toast from 'react-hot-toast';

const EngineManagement = () => {
  const [engines, setEngines] = useState([]);
  const [availableEngines, setAvailableEngines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEngine, setNewEngine] = useState({
    name: '',
    description: '',
    executionMode: 'sequential',
    tier: 'free'
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadEngines();
    loadAvailableEngines();
  }, []);

  const loadEngines = async () => {
    try {
      setLoading(true);
      const data = await engineService.getEngines();
      setEngines(data);
    } catch (error) {
      toast.error('Failed to load engines');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableEngines = async () => {
    try {
      const data = await engineService.getAvailableEngines();
      setAvailableEngines(data);
    } catch (error) {
      // Silently fail - not critical
    }
  };

  const handleCreateEngine = async () => {
    if (!newEngine.name.trim()) {
      toast.error('Please enter an engine name');
      return;
    }

    try {
      setLoading(true);
      await engineService.deployEngine({
        ...newEngine,
        nodes: [],
        edges: [],
        models: [],
        flowConfig: {}
      });
      toast.success('Engine created successfully');
      setShowCreateModal(false);
      setNewEngine({ name: '', description: '', executionMode: 'sequential', tier: 'free' });
      await loadEngines();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create engine');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteEngine = async (engineId) => {
    try {
      setLoading(true);
      await engineService.executeEngine(engineId, {});
      toast.success('Engine execution started');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to execute engine');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEngine = async (engineId) => {
    try {
      setLoading(true);
      await engineService.createUserEngine(engineId);
      toast.success('Engine copied successfully');
      await loadEngines();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to copy engine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Engine
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6">Engine Management</h1>

        {/* Available Engines */}
        {availableEngines.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Available Engines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableEngines.map((engine) => (
                <div
                  key={engine.id}
                  className="bg-white rounded-lg shadow p-4"
                  style={{ backgroundColor: 'var(--color-background-secondary)' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{engine.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      engine.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {engine.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{engine.description}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExecuteEngine(engine.id)}
                      className="flex-1 flex items-center justify-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Execute
                    </button>
                    <button
                      onClick={() => handleCopyEngine(engine.id)}
                      className="flex-1 flex items-center justify-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Engines */}
        <div>
          <h2 className="text-lg font-semibold mb-4">All Engines</h2>
          {loading ? (
            <div className="text-center py-8">Loading engines...</div>
          ) : engines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No engines found. Create your first engine to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {engines.map((engine) => (
                <div
                  key={engine.id}
                  className="bg-white rounded-lg shadow p-4"
                  style={{ backgroundColor: 'var(--color-background-secondary)' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{engine.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      engine.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {engine.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{engine.description}</p>
                  <div className="text-xs text-gray-500 mb-4">
                    Mode: {engine.execution_mode} | Tier: {engine.tier}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExecuteEngine(engine.id)}
                      className="flex-1 flex items-center justify-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Execute
                    </button>
                    <button
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <h2 className="text-xl font-bold mb-4">Create New Engine</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newEngine.name}
                    onChange={(e) => setNewEngine({ ...newEngine, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newEngine.description}
                    onChange={(e) => setNewEngine({ ...newEngine, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Execution Mode</label>
                  <select
                    value={newEngine.executionMode}
                    onChange={(e) => setNewEngine({ ...newEngine, executionMode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <option value="sequential">Sequential</option>
                    <option value="parallel">Parallel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tier</label>
                  <select
                    value={newEngine.tier}
                    onChange={(e) => setNewEngine({ ...newEngine, tier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEngine}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngineManagement;
