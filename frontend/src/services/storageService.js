/**
 * LocalStorage Storage Service
 * Provides persistent storage for portfolio data, analysis results, and background jobs
 */

const STORAGE_KEYS = {
  PORTFOLIO: 'intellirisk_portfolio',
  ANALYSIS_RESULTS: 'intellirisk_analysis_results',
  BACKGROUND_JOBS: 'intellirisk_background_jobs',
  ANALYSIS_HISTORY: 'intellirisk_analysis_history',
  NOTIFICATION_PREFERENCES: 'intellirisk_notification_prefs',
  DOCUMENT_ADVICE: 'intellirisk_document_advice'
};

class StorageService {
  // Expose STORAGE_KEYS as static property for easy access
  static STORAGE_KEYS = STORAGE_KEYS;

  /**
   * Get item from localStorage
   */
  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  static clear() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Portfolio methods
  static savePortfolio(portfolio) {
    return this.set(STORAGE_KEYS.PORTFOLIO, portfolio);
  }

  static getPortfolio() {
    return this.get(STORAGE_KEYS.PORTFOLIO);
  }

  static removePortfolio() {
    return this.remove(STORAGE_KEYS.PORTFOLIO);
  }

  // Analysis results methods
  static saveAnalysisResult(analysisId, result) {
    const results = this.getAnalysisResults() || {};
    results[analysisId] = {
      ...result,
      timestamp: new Date().toISOString()
    };
    return this.set(STORAGE_KEYS.ANALYSIS_RESULTS, results);
  }

  static getAnalysisResult(analysisId) {
    const results = this.getAnalysisResults() || {};
    return results[analysisId] || null;
  }

  static getAnalysisResults() {
    return this.get(STORAGE_KEYS.ANALYSIS_RESULTS) || {};
  }

  static removeAnalysisResult(analysisId) {
    const results = this.getAnalysisResults() || {};
    delete results[analysisId];
    return this.set(STORAGE_KEYS.ANALYSIS_RESULTS, results);
  }

  // Background jobs methods
  static saveBackgroundJob(jobId, jobData) {
    const jobs = this.getBackgroundJobs() || {};
    jobs[jobId] = {
      ...jobData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.set(STORAGE_KEYS.BACKGROUND_JOBS, jobs);
  }

  static getBackgroundJob(jobId) {
    const jobs = this.getBackgroundJobs() || {};
    return jobs[jobId] || null;
  }

  static getBackgroundJobs() {
    return this.get(STORAGE_KEYS.BACKGROUND_JOBS) || {};
  }

  static updateBackgroundJob(jobId, updates) {
    const jobs = this.getBackgroundJobs() || {};
    if (jobs[jobId]) {
      jobs[jobId] = {
        ...jobs[jobId],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return this.set(STORAGE_KEYS.BACKGROUND_JOBS, jobs);
    }
    return false;
  }

  static removeBackgroundJob(jobId) {
    const jobs = this.getBackgroundJobs() || {};
    delete jobs[jobId];
    return this.set(STORAGE_KEYS.BACKGROUND_JOBS, jobs);
  }

  static getActiveBackgroundJobs() {
    const jobs = this.getBackgroundJobs() || {};
    return Object.entries(jobs)
      .filter(([_, job]) => job.status === 'pending' || job.status === 'processing')
      .map(([id, job]) => ({ id, ...job }));
  }

  // Analysis history methods
  static addToAnalysisHistory(analysis) {
    const history = this.getAnalysisHistory() || [];
    history.unshift({
      ...analysis,
      timestamp: new Date().toISOString()
    });
    // Keep only last 50 analyses
    if (history.length > 50) {
      history.splice(50);
    }
    return this.set(STORAGE_KEYS.ANALYSIS_HISTORY, history);
  }

  static getAnalysisHistory() {
    return this.get(STORAGE_KEYS.ANALYSIS_HISTORY) || [];
  }

  // Notification preferences
  static getNotificationPreferences() {
    return this.get(STORAGE_KEYS.NOTIFICATION_PREFERENCES) || {
      browserNotifications: true,
      inAppNotifications: true,
      soundEnabled: false
    };
  }

  static saveNotificationPreferences(prefs) {
    return this.set(STORAGE_KEYS.NOTIFICATION_PREFERENCES, prefs);
  }

  // Document advice methods (general global market interpretation)
  static saveDocumentAdvice(advice) {
    return this.set(STORAGE_KEYS.DOCUMENT_ADVICE, {
      interpretation: advice.interpretation,
      documentAnalysisResult: {
        interpretation: advice.interpretation
      },
      timestamp: advice.timestamp || new Date().toISOString()
    });
  }

  static getDocumentAdvice() {
    return this.get(STORAGE_KEYS.DOCUMENT_ADVICE);
  }

  static removeDocumentAdvice() {
    return this.remove(STORAGE_KEYS.DOCUMENT_ADVICE);
  }
}

export default StorageService;
export { STORAGE_KEYS };

