/**
 * Worker Monitoring Page
 * Monitor and manage workers
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import workerService from '../services/workerService.js';
import toast from 'react-hot-toast';

const WorkerMonitoring = () => {
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [workersData, statsData, eventsData] = await Promise.all([
        workerService.getWorkers(),
        workerService.getWorkerStats(),
        workerService.getEvents({ limit: 50 })
      ]);
      setWorkers(workersData);
      setStats(statsData);
      setEvents(eventsData);
    } catch (error) {
      toast.error('Failed to load worker data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      case 'maintenance':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-gray-600">Loading workers...</div>
      </div>
    );
  }

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
            onClick={loadData}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6">Worker Monitoring</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Workers</p>
                  <p className="text-2xl font-bold">{stats.total_workers || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_workers || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Health</p>
                  <p className={`text-2xl font-bold ${getHealthColor(stats.avg_health_score || 0)}`}>
                    {Math.round(stats.avg_health_score || 0)}%
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Load</p>
                  <p className="text-2xl font-bold">
                    {stats.total_load || 0} / {stats.total_capacity || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Workers List */}
        <div className="bg-white rounded-lg shadow p-6 mb-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
          <h2 className="text-lg font-semibold mb-4">Workers</h2>
          {workers.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No workers registered</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="text-left py-2">Worker ID</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Health</th>
                    <th className="text-right py-2">Load</th>
                    <th className="text-right py-2">Capacity</th>
                    <th className="text-left py-2">Last Heartbeat</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="border-b cursor-pointer hover:bg-gray-50"
                      style={{ borderColor: 'var(--color-border)' }}
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <td className="py-2 font-mono text-sm">{worker.worker_id}</td>
                      <td className="py-2">{worker.worker_type}</td>
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(worker.status)}
                          <span className="capitalize">{worker.status}</span>
                        </div>
                      </td>
                      <td className={`text-right py-2 font-semibold ${getHealthColor(worker.health_score)}`}>
                        {worker.health_score}%
                      </td>
                      <td className="text-right py-2">{worker.current_load}</td>
                      <td className="text-right py-2">{worker.capacity}</td>
                      <td className="py-2 text-sm text-gray-600">
                        {formatTimeAgo(worker.last_heartbeat)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
          <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
          {events.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No events found</div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      event.severity === 'error' ? 'bg-red-100 text-red-800' :
                      event.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.severity}
                    </span>
                    <span className="font-mono text-sm">{event.worker_id}</span>
                    <span className="text-gray-600">{event.event_type}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatTimeAgo(event.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerMonitoring;
