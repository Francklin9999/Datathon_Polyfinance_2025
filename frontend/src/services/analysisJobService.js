/**
 * Analysis Job Service
 * Manages background analysis jobs with polling and status tracking
 * Uses in-memory storage (no localStorage) for job data
 */

import NotificationService from './notificationService';

class AnalysisJobService {
  static pollInterval = 3000; // Poll every 3 seconds
  static maxPollAttempts = 200; // Max 10 minutes of polling
  static pollTimeout = null;
  static activeControllers = {}; // Store AbortController for each job
  static jobs = {}; // In-memory job storage (replaces localStorage)

  /**
   * Start a background analysis job
   */
  static async startJob(jobId, jobData) {
    const job = {
      id: jobId,
      status: 'pending',
      type: 'analysis',
      ...jobData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pollAttempts: 0
    };

    // Save to in-memory storage
    this.jobs[jobId] = job;

    // Notify that job started
    await NotificationService.notifyJobStarted(jobId, jobData.name || 'Document Analysis');
    NotificationService.createNotificationEvent('job_started', job);

    return job;
  }

  /**
   * Execute analysis with background polling
   */
  static async executeAnalysis(jobId, analysisPromiseOrFunction) {
    // Create AbortController for this job
    const abortController = new AbortController();
    this.activeControllers[jobId] = abortController;

    // Update job to processing with initial progress
    this.updateJobStatus(jobId, 'processing', {
      progress: {
        message: 'Starting analysis...',
        step: 'initializing'
      },
      startTime: Date.now()
    });

    // Check if job was cancelled before starting
    const job = this.jobs[jobId];
    if (job && job.status === 'cancelled') {
      delete this.activeControllers[jobId];
      throw new Error('Analysis was cancelled');
    }

    let progressInterval = null;
    let stuckError = null;
    try {
      // Create a progress tracking interval
      progressInterval = setInterval(() => {
        const currentJob = this.jobs[jobId];
        if (currentJob) {
          // Check if job was cancelled
          if (currentJob.status === 'cancelled') {
            if (progressInterval) clearInterval(progressInterval);
            abortController.abort();
            return;
          }
          
          // Check if job is stuck (processing for more than 15 minutes without updates)
          if (currentJob.status === 'processing' && currentJob.startTime) {
            const elapsed = Date.now() - currentJob.startTime;
            const STUCK_THRESHOLD = 15 * 60 * 1000; // 15 minutes
            
            if (elapsed > STUCK_THRESHOLD) {
              // Check last update time
              const lastUpdate = new Date(currentJob.updatedAt).getTime();
              const timeSinceUpdate = Date.now() - lastUpdate;
              const UPDATE_THRESHOLD = 5 * 60 * 1000; // 5 minutes without update
              
              if (timeSinceUpdate > UPDATE_THRESHOLD) {
                stuckError = new Error('Analysis appears to be stuck. The job has been processing for too long without updates.');
                if (progressInterval) clearInterval(progressInterval);
                progressInterval = null;
                delete this.activeControllers[jobId];
                this.updateJobStatus(jobId, 'failed', {
                  error: stuckError.message,
                  progress: {
                    message: 'Error: Analysis stuck',
                    step: 'failed'
                  }
                });
                abortController.abort(); // Abort the request
              }
            }
          }
          
          if (currentJob.status === 'processing') {
            // Update timestamp to show it's still alive
            this.updateJobProgress(jobId, currentJob.progress || { message: 'Processing...', step: 'analyzing' });
          }
        }
      }, 2000); // Update every 2 seconds

      // Execute the analysis
      // If analysisPromiseOrFunction is a function, call it with AbortSignal
      // Otherwise, treat it as a promise
      let analysisPromise;
      if (typeof analysisPromiseOrFunction === 'function') {
        analysisPromise = analysisPromiseOrFunction(abortController.signal);
      } else {
        analysisPromise = analysisPromiseOrFunction;
      }

      // Check for stuck error before proceeding
      if (stuckError) {
        throw stuckError;
      }

      const result = await analysisPromise;

      // Check again after promise resolves (in case it became stuck during execution)
      if (stuckError) {
        throw stuckError;
      }

      // Clear progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      delete this.activeControllers[jobId];

      // Note: Results are stored in job object, not in localStorage

      // Update job to completed
      this.updateJobStatus(jobId, 'completed', { 
        result,
        progress: {
          message: 'Analysis complete',
          step: 'completed'
        }
      });

      // Send notifications
      await NotificationService.notifyAnalysisComplete(jobId, result);
      NotificationService.createNotificationEvent('analysis_complete', {
        jobId,
        result
      });

      return result;
    } catch (error) {
      console.error('Analysis job failed:', error);
      
      // Clean up
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      delete this.activeControllers[jobId];
      
      // Check if it was cancelled
      const wasCancelled = error.name === 'AbortError' || 
                          error.message === 'Analysis was cancelled' || 
                          error.message.includes('aborted') ||
                          error.message.includes('cancelled');
      
      if (wasCancelled) {
        this.updateJobStatus(jobId, 'cancelled', {
          progress: {
            message: 'Analysis cancelled',
            step: 'cancelled'
          }
        });
        NotificationService.createNotificationEvent('job_cancelled', { jobId });
        throw new Error('Analysis was cancelled');
      }
      
      // Update job to failed
      const errorMessage = error.message || 'Unknown error occurred';
      this.updateJobStatus(jobId, 'failed', { 
        error: errorMessage,
        progress: {
          message: `Error: ${errorMessage}`,
          step: 'failed'
        }
      });

      // Send notifications
      await NotificationService.notifyAnalysisFailed(jobId, error);
      NotificationService.createNotificationEvent('analysis_failed', {
        jobId,
        error: errorMessage
      });

      throw error;
    }
  }

  /**
   * Update job status
   */
  static updateJobStatus(jobId, status, updates = {}) {
    if (!this.jobs[jobId]) {
      return null;
    }
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    if (status !== null) {
      updateData.status = status;
    }
    
    this.jobs[jobId] = {
      ...this.jobs[jobId],
      ...updateData
    };
    
    return this.jobs[jobId];
  }

  /**
   * Get job status
   */
  static getJobStatus(jobId) {
    const job = this.jobs[jobId];
    return job ? {
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    } : null;
  }

  /**
   * Get all active jobs
   */
  static getActiveJobs() {
    return Object.entries(this.jobs)
      .filter(([_, job]) => job.status === 'pending' || job.status === 'processing')
      .map(([id, job]) => ({ id, ...job }));
  }

  /**
   * Cancel a job
   */
  static cancelJob(jobId) {
    const job = this.jobs[jobId];
    if (job && (job.status === 'pending' || job.status === 'processing')) {
      // Abort the request if it's active
      if (this.activeControllers[jobId]) {
        this.activeControllers[jobId].abort();
        delete this.activeControllers[jobId];
      }
      
      this.updateJobStatus(jobId, 'cancelled', {
        progress: {
          message: 'Analysis cancelled',
          step: 'cancelled'
        }
      });
      NotificationService.createNotificationEvent('job_cancelled', { jobId });
      return true;
    }
    return false;
  }

  /**
   * Remove a job completely (for any status)
   */
  static removeJob(jobId) {
    if (this.jobs[jobId]) {
      delete this.jobs[jobId];
      delete this.activeControllers[jobId];
      NotificationService.createNotificationEvent('job_removed', { jobId });
      return true;
    }
    return false;
  }

  /**
   * Update job progress
   */
  static updateJobProgress(jobId, progress) {
    return this.updateJobStatus(jobId, null, { 
      progress,
      updatedAt: new Date().toISOString()
    });
  }
  
  /**
   * Get all jobs (for debugging/admin purposes)
   */
  static getAllJobs() {
    return Object.values(this.jobs);
  }
  
  /**
   * Get job by ID (returns full job object)
   */
  static getJob(jobId) {
    return this.jobs[jobId] || null;
  }

  /**
   * Clean up old completed jobs (older than 1 hour)
   */
  static cleanupOldJobs() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    Object.entries(this.jobs).forEach(([jobId, job]) => {
      const updatedAt = new Date(job.updatedAt).getTime();
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        updatedAt < oneHourAgo
      ) {
        delete this.jobs[jobId];
        delete this.activeControllers[jobId];
      }
    });
  }

  /**
   * Generate unique job ID
   */
  static generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Cleanup old jobs on load
if (typeof window !== 'undefined') {
  AnalysisJobService.cleanupOldJobs();
  
  // Cleanup every hour
  setInterval(() => {
    AnalysisJobService.cleanupOldJobs();
  }, 60 * 60 * 1000);
}

export default AnalysisJobService;

