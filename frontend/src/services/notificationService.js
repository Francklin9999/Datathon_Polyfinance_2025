/**
 * Notification Service
 * Handles browser notifications and in-app notifications
 */

import StorageService from './storageService';

class NotificationService {
  static permission = null;

  /**
   * Request browser notification permission
   */
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Check if notifications are enabled
   */
  static isNotificationEnabled() {
    const prefs = StorageService.getNotificationPreferences();
    return prefs.browserNotifications && Notification.permission === 'granted';
  }

  /**
   * Send browser notification
   */
  static async notify(title, options = {}) {
    const prefs = StorageService.getNotificationPreferences();
    
    if (!prefs.browserNotifications) {
      return false;
    }

    // Request permission if not already granted
    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return false;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: '/vite.svg',
        badge: '/vite.svg',
        requireInteraction: false,
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Notify when analysis is complete
   */
  static async notifyAnalysisComplete(analysisId, result) {
    const topOffenders = result?.portfolio_impact?.worst_offenders || [];
    const topOffender = topOffenders[0];
    
    const title = 'Document Analysis Complete';
    const body = topOffender 
      ? `Top exposed company: ${topOffender.ticker} (Score: ${topOffender.score?.toFixed(1)})`
      : 'Analysis finished successfully';

    return await this.notify(title, {
      body,
      tag: `analysis-${analysisId}`,
      data: {
        type: 'analysis_complete',
        analysisId,
        url: '/document-analyzer'
      }
    });
  }

  /**
   * Notify when analysis fails
   */
  static async notifyAnalysisFailed(analysisId, error) {
    const title = 'Analysis Failed';
    const body = error?.message || 'An error occurred during analysis';

    return await this.notify(title, {
      body,
      tag: `analysis-${analysisId}`,
      data: {
        type: 'analysis_failed',
        analysisId
      }
    });
  }

  /**
   * Notify when background job starts
   */
  static async notifyJobStarted(jobId, jobName) {
    const title = 'Analysis Started';
    const body = `${jobName} is now running in the background`;

    return await this.notify(title, {
      body,
      tag: `job-${jobId}`,
      data: {
        type: 'job_started',
        jobId
      }
    });
  }

  /**
   * Create notification event for in-app notifications
   */
  static createNotificationEvent(type, data) {
    const event = new CustomEvent('intellirisk-notification', {
      detail: {
        type,
        data,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
    return event;
  }
}

// Set up notification click handler for browser notifications
if (typeof window !== 'undefined' && 'Notification' in window) {
  // Handle notification clicks
  document.addEventListener('click', (event) => {
    // This will be handled by the notification click event
    if (event.target.closest('.notification-link')) {
      const url = event.target.closest('.notification-link').dataset.url;
      if (url) {
        window.location.href = url;
      }
    }
  });
}

export default NotificationService;

