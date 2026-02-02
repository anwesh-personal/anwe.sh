/**
 * AI Provider Service
 * Unified interface for multiple AI providers
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/database.js';
import tokenService from './tokenService.js';

class AIService {
  constructor() {
    this.providers = {
      openai: null,
      anthropic: null,
      google: null
    };
    this.initializeProviders();
  }

  initializeProviders() {
    if (process.env.OPENAI_API_KEY) {
      this.providers.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }

    if (process.env.GOOGLE_AI_API_KEY) {
      this.providers.google = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }
  }

  /**
   * Get available providers from database
   */
  async getAvailableProviders(tenantId = null) {
    const query = tenantId
      ? 'SELECT * FROM ai_providers WHERE (tenant_id = $1 OR tenant_id IS NULL) AND is_active = true ORDER BY priority'
      : 'SELECT * FROM ai_providers WHERE tenant_id IS NULL AND is_active = true ORDER BY priority';
    
    const { rows } = await pool.query(query, tenantId ? [tenantId] : []);
    return rows;
  }

  /**
   * Get model metadata
   */
  async getModel(modelId) {
    const { rows } = await pool.query(
      'SELECT * FROM ai_models WHERE id = $1',
      [modelId]
    );

    return rows[0] || null;
  }

  /**
   * Execute AI request
   */
  async execute(userId, tenantId, modelId, prompt, options = {}) {
    const {
      systemPrompt = null,
      temperature = 0.7,
      maxTokens = 1000,
      stream = false
    } = options;

    // Get model metadata
    const model = await this.getModel(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    // Check token balance
    const wallet = await tokenService.getWallet(userId);
    if (!wallet || wallet.currentTokens < 100) {
      throw new Error('Insufficient tokens');
    }

    // Create execution record
    const executionId = await this.createExecutionRecord(userId, tenantId, model, prompt);

    try {
      let result;
      let tokensUsed = 0;

      // Route to appropriate provider
      switch (model.provider_type) {
        case 'openai':
          result = await this.executeOpenAI(model, prompt, systemPrompt, temperature, maxTokens, stream);
          tokensUsed = result.usage?.total_tokens || 0;
          break;
        
        case 'anthropic':
          result = await this.executeAnthropic(model, prompt, systemPrompt, temperature, maxTokens, stream);
          tokensUsed = result.usage?.input_tokens + result.usage?.output_tokens || 0;
          break;
        
        case 'google':
          result = await this.executeGoogle(model, prompt, temperature, maxTokens, stream);
          tokensUsed = result.usage?.total_tokens || 0;
          break;
        
        default:
          throw new Error(`Unsupported provider: ${model.provider_type}`);
      }

      // Calculate cost
      const cost = this.calculateCost(model, tokensUsed, result.usage);

      // Update execution record
      await this.updateExecutionRecord(executionId, {
        status: 'completed',
        promptTokens: result.usage?.prompt_tokens || 0,
        completionTokens: result.usage?.completion_tokens || 0,
        totalTokens: tokensUsed,
        costUsd: cost,
        outputData: result.content || result.text,
        executionTimeMs: result.executionTime || 0
      });

      // Debit tokens
      await tokenService.adjustTokens(
        userId,
        tokensUsed,
        'debit',
        'AI execution',
        {
          source: 'ai_execution',
          referenceType: 'ai_execution',
          referenceId: executionId,
          executionId: executionId,
          metadata: {
            modelId: model.id,
            modelName: model.name,
            provider: model.provider_type
          }
        }
      );

      return {
        executionId,
        content: result.content || result.text,
        usage: {
          promptTokens: result.usage?.prompt_tokens || 0,
          completionTokens: result.usage?.completion_tokens || 0,
          totalTokens: tokensUsed
        },
        cost: cost
      };

    } catch (error) {
      await this.updateExecutionRecord(executionId, {
        status: 'failed',
        errorMessage: error.message
      });
      throw error;
    }
  }

  /**
   * Execute OpenAI request
   */
  async executeOpenAI(model, prompt, systemPrompt, temperature, maxTokens, stream) {
    if (!this.providers.openai) {
      throw new Error('OpenAI provider not configured');
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const startTime = Date.now();
    const response = await this.providers.openai.chat.completions.create({
      model: model.model_id,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    });

    const executionTime = Date.now() - startTime;

    if (stream) {
      // Handle streaming response
      return { stream: response, executionTime };
    }

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      executionTime
    };
  }

  /**
   * Execute Anthropic request
   */
  async executeAnthropic(model, prompt, systemPrompt, temperature, maxTokens, stream) {
    if (!this.providers.anthropic) {
      throw new Error('Anthropic provider not configured');
    }

    const startTime = Date.now();
    const response = await this.providers.anthropic.messages.create({
      model: model.model_id,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      stream
    });

    const executionTime = Date.now() - startTime;

    if (stream) {
      return { stream: response, executionTime };
    }

    return {
      content: response.content[0].text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens
      },
      executionTime
    };
  }

  /**
   * Execute Google AI request
   */
  async executeGoogle(model, prompt, temperature, maxTokens, stream) {
    if (!this.providers.google) {
      throw new Error('Google AI provider not configured');
    }

    const genModel = this.providers.google.getGenerativeModel({ model: model.model_id });
    const startTime = Date.now();

    const result = await genModel.generateContent({
      contents: prompt,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    });

    const executionTime = Date.now() - startTime;
    const response = await result.response;

    return {
      content: response.text(),
      usage: {
        total_tokens: response.usageMetadata?.totalTokenCount || 0
      },
      executionTime
    };
  }

  /**
   * Calculate cost based on model pricing
   */
  calculateCost(model, totalTokens, usage) {
    if (!model.input_cost_per_1k || !model.output_cost_per_1k) {
      return 0;
    }

    const inputTokens = usage?.prompt_tokens || usage?.input_tokens || 0;
    const outputTokens = usage?.completion_tokens || usage?.output_tokens || 0;

    const inputCost = (inputTokens / 1000) * Number(model.input_cost_per_1k);
    const outputCost = (outputTokens / 1000) * Number(model.output_cost_per_1k);

    return inputCost + outputCost;
  }

  /**
   * Create execution record
   */
  async createExecutionRecord(userId, tenantId, model, inputData) {
    const { rows } = await pool.query(
      `INSERT INTO ai_executions (
        tenant_id, user_id, provider_id, model_id, model_name,
        status, input_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        tenantId,
        userId,
        model.provider_id,
        model.id,
        model.name,
        'running',
        JSON.stringify(inputData)
      ]
    );

    return rows[0].id;
  }

  /**
   * Update execution record
   */
  async updateExecutionRecord(executionId, updates) {
    const {
      status,
      promptTokens,
      completionTokens,
      totalTokens,
      tokensDebited,
      costUsd,
      outputData,
      errorMessage,
      executionTimeMs
    } = updates;

    await pool.query(
      `UPDATE ai_executions SET
        status = COALESCE($1, status),
        prompt_tokens = COALESCE($2, prompt_tokens),
        completion_tokens = COALESCE($3, completion_tokens),
        total_tokens = COALESCE($4, total_tokens),
        tokens_debited = COALESCE($5, tokens_debited),
        cost_usd = COALESCE($6, cost_usd),
        output_data = COALESCE($7, output_data),
        error_message = COALESCE($8, error_message),
        execution_time_ms = COALESCE($9, execution_time_ms),
        completed_at = CASE WHEN $1 IN ('completed', 'failed', 'cancelled') THEN now() ELSE completed_at END
      WHERE id = $10`,
      [
        status,
        promptTokens,
        completionTokens,
        totalTokens,
        tokensDebited,
        costUsd,
        outputData ? JSON.stringify(outputData) : null,
        errorMessage,
        executionTimeMs,
        executionId
      ]
    );
  }
}

export default new AIService();
