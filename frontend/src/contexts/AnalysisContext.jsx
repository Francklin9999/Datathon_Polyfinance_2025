import React, { createContext, useContext, useState, useEffect } from 'react';
import CacheService from '@/services/cacheService';
import AnalysisJobService from '@/services/analysisJobService';
import NotificationService from '@/services/notificationService';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [activeJobs, setActiveJobs] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const loadFromCache = React.useCallback(() => {
    const jobs = AnalysisJobService.getActiveJobs();
    setActiveJobs(jobs);
    
    const history = CacheService.getAnalysisHistory();
    setAnalysisHistory(history);
  }, []);

  const updateActiveJobs = React.useCallback(() => {
    const jobs = AnalysisJobService.getActiveJobs();
    setActiveJobs(jobs);
  }, []);

  // Load active jobs and history from cache on mount
  useEffect(() => {
    loadFromCache();
    
    // Set up notification listener
    const handleNotification = (event) => {
      const notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: event.detail.type,
        data: event.detail.data,
        timestamp: event.detail.timestamp,
        read: false
      };
      setNotifications(prev => [notification, ...prev]);
      
      // Auto-remove notification after 10 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 10000);
    };

    window.addEventListener('polyfinance-notification', handleNotification);

    // Poll for active jobs status
    const pollInterval = setInterval(() => {
      updateActiveJobs();
    }, 3000); // Poll every 3 seconds

    // Request notification permission on mount
    NotificationService.requestPermission();

    return () => {
      window.removeEventListener('polyfinance-notification', handleNotification);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [updateActiveJobs, loadFromCache]);

  const startAnalysisJob = async (jobData) => {
    const jobId = AnalysisJobService.generateJobId();
    const job = await AnalysisJobService.startJob(jobId, jobData);
    updateActiveJobs();
    return job;
  };

  const getJobStatus = (jobId) => {
    return AnalysisJobService.getJobStatus(jobId);
  };

  const cancelJob = (jobId) => {
    AnalysisJobService.cancelJob(jobId);
    updateActiveJobs();
  };

  const removeJob = (jobId) => {
    AnalysisJobService.removeJob(jobId);
    updateActiveJobs();
  };

  const getAnalysisResult = (jobId) => {
    // Get result from in-memory job storage
    const job = AnalysisJobService.getJob(jobId);
    return job?.result || null;
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    activeJobs,
    analysisHistory,
    notifications,
    startAnalysisJob,
    getJobStatus,
    cancelJob,
    removeJob,
    getAnalysisResult,
    dismissNotification,
    markNotificationAsRead,
    clearNotifications,
    updateActiveJobs
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}

