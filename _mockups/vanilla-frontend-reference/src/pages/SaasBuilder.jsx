/**
 * SaaS Builder
 * Step-by-step wizard to configure and generate a complete SaaS template
 */

import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, Download, Sparkles, Database, Palette, Settings, Code, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';

const SaasBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState({
    // Step 1: Basic Info
    projectName: '',
    projectDescription: '',
    companyName: '',
    companyEmail: '',
    
    // Step 2: Database
    databaseType: 'postgresql',
    useRedis: true,
    useQueue: true,
    
    // Step 3: Features
    features: {
      multiTenant: true,
      aiProviders: true,
      workflows: true,
      engines: true,
      analytics: true,
      workerMonitoring: true,
      superAdmin: true,
      tokenWallet: true
    },
    
    // Step 4: Brand Kit
    brandKit: 'modern-minimal',
    defaultDarkMode: false,
    
    // Step 5: AI Providers
    aiProviders: {
      openai: true,
      anthropic: true,
      google: false
    },
    
    // Step 6: Authentication
    authMethods: {
      email: true,
      google: false,
      github: false
    },
    
    // Step 7: Deployment
    deployment: {
      docker: true,
      dockerCompose: true,
      envTemplate: true
    }
  });

  const totalSteps = 7;

  const updateConfig = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedConfig = (parent, key, value) => {
    setConfig(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateTemplate = async () => {
    try {
      toast.loading('Generating your SaaS template...', { id: 'generate' });
      
      // Call backend to generate template
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/builder/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Template generation failed');
      }

      // Get ZIP file from response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.projectName || 'saas-template'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Template generated and downloaded!', { id: 'generate' });
      
    } catch (error) {
      console.error('Template generation error:', error);
      
      // Fallback: Download config JSON if backend fails
      const configJson = JSON.stringify(config, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.projectName || 'saas-template'}-config.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.error('Backend generation failed. Config JSON downloaded instead.', { id: 'generate' });
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: Settings },
    { number: 2, title: 'Database', icon: Database },
    { number: 3, title: 'Features', icon: Sparkles },
    { number: 4, title: 'Brand Kit', icon: Palette },
    { number: 5, title: 'AI Providers', icon: Code },
    { number: 6, title: 'Authentication', icon: Settings },
    { number: 7, title: 'Deployment', icon: Rocket }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            SaaS Builder
          </h1>
          <p className="text-xl text-gray-600">
            Configure your multi-tenant AI SaaS platform step by step
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, idx) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep >= step.number
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-indigo-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Basic Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={config.projectName}
                  onChange={(e) => updateConfig('projectName', e.target.value)}
                  placeholder="My Awesome SaaS"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  value={config.projectDescription}
                  onChange={(e) => updateConfig('projectDescription', e.target.value)}
                  placeholder="A powerful multi-tenant SaaS platform..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={(e) => updateConfig('companyName', e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email
                  </label>
                  <input
                    type="email"
                    value={config.companyEmail}
                    onChange={(e) => updateConfig('companyEmail', e.target.value)}
                    placeholder="contact@acme.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Database */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Database Configuration</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Database Type
                </label>
                <select
                  value={config.databaseType}
                  onChange={(e) => updateConfig('databaseType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.useRedis}
                    onChange={(e) => updateConfig('useRedis', e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Redis Cache</div>
                    <div className="text-sm text-gray-500">Enable Redis for session storage and caching</div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.useQueue}
                    onChange={(e) => updateConfig('useQueue', e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Queue System</div>
                    <div className="text-sm text-gray-500">Enable BullMQ for background job processing</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Features */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Select Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(config.features).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateNestedConfig('features', key, e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Brand Kit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Choose Brand Kit</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'modern-minimal', name: 'Modern Minimal', desc: 'Clean and professional' },
                  { id: 'tech-bold', name: 'Tech Bold', desc: 'Bold tech startup aesthetic' },
                  { id: 'elegant-classic', name: 'Elegant Classic', desc: 'Sophisticated premium design' },
                  { id: 'creative-playful', name: 'Creative Playful', desc: 'Vibrant and energetic' },
                  { id: 'corporate-professional', name: 'Corporate Professional', desc: 'Enterprise-grade design' }
                ].map((kit) => (
                  <label
                    key={kit.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      config.brandKit === kit.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="brandKit"
                      value={kit.id}
                      checked={config.brandKit === kit.id}
                      onChange={(e) => updateConfig('brandKit', e.target.value)}
                      className="sr-only"
                    />
                    <div className="font-semibold text-gray-900">{kit.name}</div>
                    <div className="text-sm text-gray-500">{kit.desc}</div>
                  </label>
                ))}
              </div>
              <div className="mt-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.defaultDarkMode}
                    onChange={(e) => updateConfig('defaultDarkMode', e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Default to Dark Mode</div>
                    <div className="text-sm text-gray-500">Start with dark mode enabled</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 5: AI Providers */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">AI Provider Integration</h2>
              <div className="space-y-4">
                {Object.entries(config.aiProviders).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {key === 'openai' ? 'OpenAI' : key === 'anthropic' ? 'Anthropic Claude' : 'Google Gemini'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {key === 'openai' && 'GPT-4, GPT-3.5, and more'}
                        {key === 'anthropic' && 'Claude 3 Opus, Sonnet, Haiku'}
                        {key === 'google' && 'Gemini Pro and Ultra'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateNestedConfig('aiProviders', key, e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Authentication */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Authentication Methods</h2>
              <div className="space-y-4">
                {Object.entries(config.authMethods).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {key === 'email' ? 'Email/Password' : key === 'google' ? 'Google OAuth' : 'GitHub OAuth'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {key === 'email' && 'Standard email and password authentication'}
                        {key === 'google' && 'Sign in with Google'}
                        {key === 'github' && 'Sign in with GitHub'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateNestedConfig('authMethods', key, e.target.checked)}
                      disabled={key === 'email'}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Deployment */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Deployment Configuration</h2>
              <div className="space-y-4">
                {Object.entries(config.deployment).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {key === 'docker' && 'Docker Support'}
                        {key === 'dockerCompose' && 'Docker Compose'}
                        {key === 'envTemplate' && 'Environment Template'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {key === 'docker' && 'Dockerfile for containerization'}
                        {key === 'dockerCompose' && 'docker-compose.yml for local development'}
                        {key === 'envTemplate' && '.env.example template file'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateNestedConfig('deployment', key, e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={generateTemplate}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>Generate Template</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaasBuilder;
