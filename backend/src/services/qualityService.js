/**
 * Quality Control Service
 * Quality gates and validation
 */

import pool from '../config/database.js';

class QualityService {
  /**
   * Run quality gate
   */
  async runQualityGate(executionId, gateName, content, context = {}) {
    // Basic quality checks
    const checks = {
      length: content.length > 100,
      readability: this.checkReadability(content),
      uniqueness: await this.checkUniqueness(content),
      structure: this.checkStructure(content)
    };

    const passed = Object.values(checks).every(check => check === true);
    const score = this.calculateScore(checks);

    // Store result
    const { rows } = await pool.query(
      `INSERT INTO quality_gate_results (
        execution_id, gate_name, passed, score, feedback, metrics, context
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        executionId,
        gateName,
        passed,
        score,
        this.generateFeedback(checks),
        JSON.stringify(checks),
        JSON.stringify(context)
      ]
    );

    return rows[0];
  }

  /**
   * Check readability
   */
  checkReadability(content) {
    // Simple readability check - can be enhanced
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = content.split(/\s+/).length / sentences.length;
    return avgWordsPerSentence >= 5 && avgWordsPerSentence <= 25;
  }

  /**
   * Check uniqueness (basic)
   */
  async checkUniqueness(content) {
    // In production, use similarity detection
    return true;
  }

  /**
   * Check structure
   */
  checkStructure(content) {
    // Check for basic structure elements
    const hasParagraphs = content.split('\n\n').length > 1;
    const hasSentences = content.match(/[.!?]/) !== null;
    return hasParagraphs && hasSentences;
  }

  /**
   * Calculate quality score
   */
  calculateScore(checks) {
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(c => c === true).length;
    return (passed / total) * 100;
  }

  /**
   * Generate feedback
   */
  generateFeedback(checks) {
    const issues = [];
    if (!checks.length) issues.push('Content too short');
    if (!checks.readability) issues.push('Readability issues');
    if (!checks.uniqueness) issues.push('Potential duplicate content');
    if (!checks.structure) issues.push('Poor structure');

    return issues.length > 0 ? issues.join(', ') : 'Quality checks passed';
  }

  /**
   * Get quality results for execution
   */
  async getQualityResults(executionId) {
    const { rows } = await pool.query(
      'SELECT * FROM quality_gate_results WHERE execution_id = $1 ORDER BY created_at DESC',
      [executionId]
    );

    return rows;
  }
}

export default new QualityService();
