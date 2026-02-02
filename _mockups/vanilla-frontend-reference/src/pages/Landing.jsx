/**
 * Landing Page
 * Stunning entry point that showcases the SaaS Builder
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Rocket, Zap, Palette, Database, Code, ArrowRight, Check, Settings } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Main Headline */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 animate-fade-in">
                Build Your SaaS
                <span className="block bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  In Minutes
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-indigo-200 max-w-3xl mx-auto">
                Configure your multi-tenant AI SaaS platform with our step-by-step builder.
                No coding required. Just answer a few questions and get a complete, production-ready template.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/builder"
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <Rocket className="w-6 h-6" />
                <span>Start Building Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/brand-kits"
                className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white rounded-xl font-semibold text-lg border-2 border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Palette className="w-6 h-6" />
                <span>Preview Designs</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">7 Steps</div>
                <div className="text-indigo-200">Simple Configuration</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">5 Themes</div>
                <div className="text-indigo-200">Beautiful Brand Kits</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">100%</div>
                <div className="text-indigo-200">Production Ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From configuration to deployment in 7 simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              { icon: Settings, title: 'Basic Info', desc: 'Enter your project details' },
              { icon: Database, title: 'Database', desc: 'Choose your stack' },
              { icon: Sparkles, title: 'Features', desc: 'Select what you need' },
              { icon: Palette, title: 'Design', desc: 'Pick your brand kit' },
              { icon: Code, title: 'AI Providers', desc: 'Configure AI services' },
              { icon: Zap, title: 'Auth', desc: 'Set up authentication' },
              { icon: Rocket, title: 'Deploy', desc: 'Get your template' },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-100 hover:border-indigo-300 transition-all">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-indigo-600 mb-1">Step {idx + 1}</div>
                  <div className="text-lg font-bold text-gray-900 mb-2">{step.title}</div>
                  <div className="text-sm text-gray-600">{step.desc}</div>
                </div>
                {idx < 6 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-indigo-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Rocket className="w-6 h-6" />
              <span>Start Building Your SaaS</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What You Get
            </h2>
            <p className="text-xl text-gray-600">
              A complete, production-ready SaaS platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Multi-tenant Architecture',
              'User Authentication System',
              'Token Wallet & Billing',
              'AI Provider Integration',
              'Workflow Builder',
              'Engine Management',
              'Analytics Dashboard',
              'Worker Monitoring',
              'Super Admin Panel',
              '5 Brand Kits',
              'Dark/Light Mode',
              'Docker Support'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Build Your SaaS?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Start configuring your platform now. It takes less than 5 minutes.
          </p>
          <Link
            to="/builder"
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-indigo-600 rounded-xl font-bold text-xl shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-105"
          >
            <Rocket className="w-6 h-6" />
            <span>Launch Builder</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
