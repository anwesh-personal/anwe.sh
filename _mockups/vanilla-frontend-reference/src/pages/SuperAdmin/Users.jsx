/**
 * Super Admin - User Management
 * Manage all users across all tenants
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, UserPlus, Download } from 'lucide-react';
import api from '../../lib/api.js';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const SuperAdminUsers = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // TODO: Implement backend endpoint
      // const response = await api.get('/superadmin/users');
      // setUsers(response.data);
      
      // Mock data
      setUsers([
        { id: '1', email: 'user1@example.com', fullName: 'John Doe', role: 'user', tier: 'premium', tenant: 'Acme Corp', createdAt: '2024-01-15' },
        { id: '2', email: 'user2@example.com', fullName: 'Jane Smith', role: 'admin', tier: 'enterprise', tenant: 'Tech Inc', createdAt: '2024-01-20' },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>
              User Management
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
              Manage all users across the platform
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-lg font-medium"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-background)'
            }}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Add User
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-foreground-secondary)' }} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-background-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)'
              }}
            />
          </div>
          <button
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-foreground)'
            }}
          >
            <Filter className="w-4 h-4 inline mr-2" />
            Filter
          </button>
          <button
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-background-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-foreground)'
            }}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
        </div>

        {/* Users Table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-foreground-secondary)' }}>
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-foreground-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-foreground)' }}>
                        {user.fullName || 'N/A'}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor: user.role === 'admin' ? 'var(--color-primary)' : 'var(--color-background-tertiary)',
                        color: user.role === 'admin' ? 'var(--color-background)' : 'var(--color-foreground)'
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--color-foreground)' }}>
                    {user.tier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--color-foreground)' }}>
                    {user.tenant}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-foreground-secondary)' }}>
                    {user.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <button className="p-2 rounded hover:bg-opacity-20" style={{ color: 'var(--color-primary)' }}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded hover:bg-opacity-20" style={{ color: 'var(--color-error)' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminUsers;
