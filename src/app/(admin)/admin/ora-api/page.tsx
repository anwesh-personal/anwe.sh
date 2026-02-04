'use client';

/**
 * ORA API Dashboard
 * Visual interface for viewing ORA API capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminHeader } from '@/components/admin';
import styles from './page.module.css';

interface ApiAction {
    description: string;
    params: Record<string, {
        type: string;
        required?: boolean;
        optional?: boolean;
        default?: unknown;
        enum?: string[];
        format?: string;
    }>;
    returns: Record<string, string>;
}

interface ApiSchema {
    name: string;
    version: string;
    description: string;
    authentication: {
        type: string;
        header: string;
        format: string;
    };
    baseUrl: string;
    actions: Record<string, ApiAction>;
    timestamp: string;
    authenticated: boolean;
}

export default function OraApiPage() {
    const [schema, setSchema] = useState<ApiSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [testParams, setTestParams] = useState<Record<string, string>>({});
    const [testResult, setTestResult] = useState<unknown>(null);
    const [testing, setTesting] = useState(false);

    const fetchSchema = useCallback(async () => {
        try {
            const response = await fetch('/api/ora');
            if (!response.ok) throw new Error('Failed to fetch API schema');
            const data = await response.json();
            setSchema(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchema();
    }, [fetchSchema]);

    const handleTestAction = async () => {
        if (!selectedAction) return;
        setTesting(true);
        setTestResult(null);

        try {
            // Parse params
            const parsedParams: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(testParams)) {
                if (value.trim()) {
                    try {
                        parsedParams[key] = JSON.parse(value);
                    } catch {
                        parsedParams[key] = value;
                    }
                }
            }

            const response = await fetch('/api/ora', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: selectedAction,
                    data: parsedParams
                })
            });

            const result = await response.json();
            setTestResult({ status: response.status, data: result });
        } catch (err) {
            setTestResult({ error: err instanceof Error ? err.message : 'Unknown error' });
        } finally {
            setTesting(false);
        }
    };

    const groupedActions = schema?.actions ? Object.entries(schema.actions).reduce((acc, [name, action]) => {
        const category = name.split('.')[0];
        if (!acc[category]) acc[category] = [];
        acc[category].push({ name, ...action });
        return acc;
    }, {} as Record<string, Array<{ name: string } & ApiAction>>) : {};

    const categoryIcons: Record<string, string> = {
        posts: '📝',
        analytics: '📊',
        leads: '👥',
        settings: '⚙️',
        memory: '🧠',
        files: '📁',
        system: '🖥️'
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <AdminHeader title="ORA API" subtitle="Loading..." />
                <div className={styles.loading}>Loading API schema...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <AdminHeader title="ORA API" subtitle="Error" />
                <div className={styles.error}>Error: {error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <AdminHeader
                title="ORA API Dashboard"
                subtitle={`${schema?.name} v${schema?.version}`}
            />

            <div className={styles.content}>
                {/* Connection Info */}
                <div className={styles.connectionCard}>
                    <h2>🔗 Connection Info</h2>
                    <div className={styles.connectionDetails}>
                        <div className={styles.detail}>
                            <span className={styles.label}>Endpoint:</span>
                            <code>{typeof window !== 'undefined' ? window.location.origin : ''}/api/ora</code>
                        </div>
                        <div className={styles.detail}>
                            <span className={styles.label}>Auth:</span>
                            <code>Authorization: Bearer &#123;ORA_SECRET&#125;</code>
                        </div>
                        <div className={styles.detail}>
                            <span className={styles.label}>Method:</span>
                            <code>POST</code> for actions, <code>GET</code> for schema
                        </div>
                    </div>
                    <div className={styles.exampleBox}>
                        <h4>Example Request:</h4>
                        <pre>{`POST /api/ora
Authorization: Bearer YOUR_ORA_SECRET
Content-Type: application/json

{
  "action": "posts.list",
  "data": { "limit": 10 }
}`}</pre>
                    </div>
                </div>

                {/* Actions Grid */}
                <div className={styles.actionsSection}>
                    <h2>🎯 Available Actions ({Object.keys(schema?.actions || {}).length})</h2>

                    <div className={styles.categoriesGrid}>
                        {Object.entries(groupedActions).map(([category, actions]) => (
                            <div key={category} className={styles.categoryCard}>
                                <h3>
                                    <span className={styles.categoryIcon}>{categoryIcons[category] || '📌'}</span>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </h3>
                                <div className={styles.actionsList}>
                                    {actions.map(action => (
                                        <button
                                            key={action.name}
                                            className={`${styles.actionButton} ${selectedAction === action.name ? styles.selected : ''}`}
                                            onClick={() => {
                                                setSelectedAction(action.name);
                                                setTestParams({});
                                                setTestResult(null);
                                            }}
                                        >
                                            <span className={styles.actionName}>{action.name}</span>
                                            <span className={styles.actionDesc}>{action.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Details */}
                {selectedAction && schema?.actions[selectedAction] && (
                    <div className={styles.actionDetails}>
                        <h2>📋 {selectedAction}</h2>
                        <p className={styles.actionDescription}>
                            {schema.actions[selectedAction].description}
                        </p>

                        <div className={styles.paramsSection}>
                            <h3>Parameters</h3>
                            {Object.keys(schema.actions[selectedAction].params).length === 0 ? (
                                <p className={styles.noParams}>No parameters required</p>
                            ) : (
                                <table className={styles.paramsTable}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Required</th>
                                            <th>Default</th>
                                            <th>Test Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(schema.actions[selectedAction].params).map(([name, param]) => (
                                            <tr key={name}>
                                                <td><code>{name}</code></td>
                                                <td>{param.type}{param.enum ? ` (${param.enum.join('|')})` : ''}</td>
                                                <td>{param.required ? '✅' : '❌'}</td>
                                                <td>{param.default !== undefined ? String(param.default) : '-'}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.paramInput}
                                                        placeholder={param.type}
                                                        value={testParams[name] || ''}
                                                        onChange={(e) => setTestParams({ ...testParams, [name]: e.target.value })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className={styles.returnsSection}>
                            <h3>Returns</h3>
                            <div className={styles.returnsList}>
                                {Object.entries(schema.actions[selectedAction].returns).map(([key, type]) => (
                                    <span key={key} className={styles.returnItem}>
                                        <code>{key}</code>: {type}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className={styles.testSection}>
                            <button
                                className={styles.testButton}
                                onClick={handleTestAction}
                                disabled={testing}
                            >
                                {testing ? '⏳ Testing...' : '🧪 Test Action (No Auth)'}
                            </button>
                            <p className={styles.testNote}>
                                Note: Test without auth will return 401. Use actual ORA with secret for real calls.
                            </p>
                        </div>

                        {testResult && (
                            <div className={styles.testResult}>
                                <h3>Result</h3>
                                <pre>{JSON.stringify(testResult, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
