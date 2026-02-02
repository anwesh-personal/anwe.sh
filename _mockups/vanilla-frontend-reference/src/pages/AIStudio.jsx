/**
 * AI Studio Page
 * Interface for executing AI models
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import aiService from '../services/aiService.js';
import { useTokenWallet } from '../contexts/TokenWalletContext.jsx';
import toast from 'react-hot-toast';

const AIStudio = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const { refresh: refreshWallet } = useTokenWallet();
  const navigate = useNavigate();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoadingModels(true);
      const modelsData = await aiService.getModels();
      setModels(modelsData);
      if (modelsData.length > 0) {
        setSelectedModel(modelsData[0].id);
      }
    } catch (error) {
      toast.error('Failed to load models');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedModel || !prompt.trim()) {
      toast.error('Please select a model and enter a prompt');
      return;
    }

    try {
      setLoading(true);
      setResponse('');
      const result = await aiService.execute(selectedModel, prompt);
      setResponse(result.content);
      toast.success('AI execution completed!');
      await refreshWallet();
    } catch (error) {
      toast.error(error.response?.data?.error || 'AI execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">AI Studio</h1>

          {/* Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Model
            </label>
            {loadingModels ? (
              <div className="text-gray-600">Loading models...</div>
            ) : (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider_type})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your prompt here..."
            />
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={loading || !selectedModel || !prompt.trim()}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              'Executing...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Execute
              </>
            )}
          </button>

          {/* Response */}
          {response && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response
              </label>
              <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm">{response}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIStudio;
