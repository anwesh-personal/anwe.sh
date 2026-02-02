/**
 * Workflow Builder Page
 * Visual workflow builder for creating and editing workflows
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Play, Plus, Trash2 } from 'lucide-react';
import workflowService from '../services/workflowService.js';
import toast from 'react-hot-toast';

const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedWorkflow(null);
    setWorkflowName('');
    setWorkflowDescription('');
    setNodes([]);
    setConnections([]);
  };

  const handleSelectWorkflow = async (workflowId) => {
    try {
      const workflow = await workflowService.getWorkflow(workflowId);
      setSelectedWorkflow(workflow);
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      setNodes(workflow.nodes || []);
      setConnections(workflow.connections || []);
    } catch (error) {
      toast.error('Failed to load workflow');
    }
  };

  const handleAddNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'ai_model',
      label: 'New Node',
      position: { x: 100 + nodes.length * 150, y: 100 },
      config: {}
    };
    setNodes([...nodes, newNode]);
  };

  const handleDeleteNode = (nodeId) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.source !== nodeId && c.target !== nodeId));
  };

  const handleSave = async () => {
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    try {
      setSaving(true);
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        nodes,
        connections
      };

      if (selectedWorkflow) {
        await workflowService.updateWorkflow(selectedWorkflow.id, workflowData);
        toast.success('Workflow updated successfully');
      } else {
        await workflowService.createWorkflow(workflowData);
        toast.success('Workflow created successfully');
        await loadWorkflows();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedWorkflow) {
      toast.error('Please save the workflow first');
      return;
    }

    try {
      setLoading(true);
      await workflowService.executeWorkflow(selectedWorkflow.id, {});
      toast.success('Workflow execution started');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to execute workflow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Workflows</h2>
                <button
                  onClick={handleCreateNew}
                  className="p-2 rounded hover:bg-gray-100"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="text-gray-600">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => handleSelectWorkflow(workflow.id)}
                      className={`w-full text-left p-2 rounded ${
                        selectedWorkflow?.id === workflow.id
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{workflow.name}</div>
                      <div className="text-xs text-gray-500">
                        {workflow.nodes?.length || 0} nodes
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="mb-6">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Workflow Name"
                  className="w-full px-3 py-2 border rounded-md mb-2"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>

              {/* Canvas Area */}
              <div
                className="border-2 border-dashed rounded-lg p-8 min-h-[400px] relative"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {nodes.length === 0 ? (
                  <div className="text-center text-gray-500 py-20">
                    <p className="mb-4">No nodes yet. Click "Add Node" to start building.</p>
                    <button
                      onClick={handleAddNode}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add Node
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nodes.map((node) => (
                      <div
                        key={node.id}
                        className="bg-white border rounded-lg p-4 flex justify-between items-center"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <div>
                          <div className="font-medium">{node.label}</div>
                          <div className="text-sm text-gray-500">{node.type}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddNode}
                      className="w-full py-2 border-2 border-dashed rounded-lg hover:bg-gray-50"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <Plus className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Workflow'}
                </button>
                {selectedWorkflow && (
                  <button
                    onClick={handleExecute}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Execute
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
