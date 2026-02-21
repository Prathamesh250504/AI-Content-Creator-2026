import api from './api';

/**
 * Batch Processing Service
 * Handles all batch content generation operations
 */

export const batchService = {
  /**
   * Create a new batch job
   */
  async createBatchJob(name, description, items, settings = {}) {
    try {
      const response = await api.post('/batch/create', {
        name,
        description,
        items,
        settings
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create batch job');
    }
  },

  /**
   * Upload CSV file for batch processing
   */
  async uploadCsvBatch(file, name, description) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);

      const response = await api.post('/batch/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to upload CSV batch');
    }
  },

  /**
   * Get all batch jobs for current user
   */
  async getUserBatchJobs() {
    try {
      const response = await api.get('/batch/jobs');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch batch jobs');
    }
  },

  /**
   * Get status of a specific batch job
   */
  async getBatchJobStatus(jobId) {
    try {
      const response = await api.get(`/batch/job/${jobId}/status`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job status');
    }
  },

  /**
   * Get detailed results of a batch job
   */
  async getBatchJobResults(jobId) {
    try {
      const response = await api.get(`/batch/job/${jobId}/results`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch job results');
    }
  },

  /**
   * Cancel a batch job
   */
  async cancelBatchJob(jobId) {
    try {
      const response = await api.post(`/batch/job/${jobId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to cancel job');
    }
  },

  /**
   * Export batch job results
   */
  async exportBatchResults(jobId, format = 'json') {
    try {
      const response = await api.get(`/batch/job/${jobId}/export?format=${format}`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `batch_results_${jobId}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to export results');
    }
  },

  /**
   * Get available templates for batch processing
   */
  async getBatchTemplates() {
    try {
      const response = await api.get('/batch/templates');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch templates');
    }
  },

  /**
   * Download CSV template for a specific content type
   */
  async downloadCsvTemplate(templateKey = 'linkedin_post') {
    try {
      const response = await api.get(`/batch/csv-template?template=${templateKey}`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${templateKey}_batch_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to download CSV template');
    }
  },

  /**
   * Poll job status with automatic updates
   */
  createJobStatusPoller(jobId, onUpdate, onComplete, onError, interval = 2000) {
    let isPolling = true;
    
    const poll = async () => {
      if (!isPolling) return;
      
      try {
        const response = await this.getBatchJobStatus(jobId);
        const job = response.job;
        
        onUpdate(job);
        
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          isPolling = false;
          onComplete(job);
          return;
        }
        
        // Continue polling
        setTimeout(poll, interval);
      } catch (error) {
        isPolling = false;
        onError(error);
      }
    };
    
    // Start polling
    poll();
    
    // Return stop function
    return () => {
      isPolling = false;
    };
  },

  /**
   * Validate batch items before submission
   */
  validateBatchItems(items) {
    const errors = [];
    
    if (!Array.isArray(items) || items.length === 0) {
      errors.push('At least one item is required');
      return { valid: false, errors };
    }
    
    if (items.length > 100) {
      errors.push('Maximum 100 items allowed per batch');
    }
    
    items.forEach((item, index) => {
      if (!item.user_prompt || !item.user_prompt.trim()) {
        errors.push(`Item ${index + 1}: Prompt is required`);
      }
      
      if (item.user_prompt && item.user_prompt.length > 2000) {
        errors.push(`Item ${index + 1}: Prompt too long (max 2000 characters)`);
      }
      
      if (!item.template_key) {
        errors.push(`Item ${index + 1}: Template is required`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Parse CSV content for validation
   */
  parseCsvContent(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const items = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const item = {};
      
      headers.forEach((header, index) => {
        if (values[index]) {
          item[header] = values[index];
        }
      });
      
      if (item.user_prompt || item.prompt) {
        items.push({
          template_key: item.template_key || item.template || 'linkedin_post',
          user_prompt: item.user_prompt || item.prompt,
          parameters: Object.fromEntries(
            Object.entries(item).filter(([key]) => 
              !['template_key', 'template', 'user_prompt', 'prompt'].includes(key)
            )
          )
        });
      }
    }
    
    return items;
  },

  /**
   * Estimate batch processing time
   */
  estimateProcessingTime(itemCount, avgTimePerItem = 10) {
    const totalSeconds = itemCount * avgTimePerItem;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  },

  /**
   * Format batch job status for display
   */
  formatJobStatus(status) {
    const statusMap = {
      pending: { label: 'Pending', color: 'yellow', icon: '⏳' },
      processing: { label: 'Processing', color: 'blue', icon: '⚡' },
      completed: { label: 'Completed', color: 'green', icon: '✅' },
      failed: { label: 'Failed', color: 'red', icon: '❌' },
      cancelled: { label: 'Cancelled', color: 'gray', icon: '⏹️' }
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
  }
};

export default batchService;