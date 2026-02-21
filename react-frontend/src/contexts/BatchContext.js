import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import batchService from '../services/batchService';
import { useUser } from './UserContext';

const BatchContext = createContext();

export const useBatch = () => {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error('useBatch must be used within a BatchProvider');
  }
  return context;
};

export const BatchProvider = ({ children }) => {
  const [batchJobs, setBatchJobs] = useState([]);
  const [activePollers, setActivePollers] = useState(new Map());
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useUser();

  // Load batch templates
  const loadTemplates = useCallback(async () => {
    try {
      const response = await batchService.getBatchTemplates();
      setTemplates(response.templates);
    } catch (error) {
      console.error('Failed to load batch templates:', error);
      toast.error('Failed to load templates');
    }
  }, []);

  // Start polling for job status (defined first to avoid hoisting issues)
  const startJobPolling = useCallback((jobId) => {
    // Don't start if already polling
    if (activePollers.has(jobId)) {
      return;
    }

    const stopPoller = batchService.createJobStatusPoller(
      jobId,
      // onUpdate
      (job) => {
        setBatchJobs(prev => 
          prev.map(j => j.id === jobId ? job : j)
        );
      },
      // onComplete
      (job) => {
        setBatchJobs(prev => 
          prev.map(j => j.id === jobId ? job : j)
        );
        
        // Remove from active pollers
        setActivePollers(prev => {
          const newMap = new Map(prev);
          newMap.delete(jobId);
          return newMap;
        });
        
        // Show completion notification
        if (job.status === 'completed') {
          toast.success(`Batch job "${job.name}" completed successfully!`);
        } else if (job.status === 'failed') {
          toast.error(`Batch job "${job.name}" failed`);
        } else if (job.status === 'cancelled') {
          toast.info(`Batch job "${job.name}" was cancelled`);
        }
      },
      // onError
      (error) => {
        console.error('Job polling error:', error);
        
        // Remove from active pollers
        setActivePollers(prev => {
          const newMap = new Map(prev);
          newMap.delete(jobId);
          return newMap;
        });
      }
    );

    // Add to active pollers
    setActivePollers(prev => new Map(prev).set(jobId, stopPoller));
  }, [activePollers]);

  // Load user batch jobs (only when authenticated)
  const loadBatchJobs = useCallback(async () => {
    if (!isAuthenticated) {
      setBatchJobs([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await batchService.getUserBatchJobs();
      setBatchJobs(response.jobs);
    } catch (error) {
      console.error('Failed to load batch jobs:', error);
      // Only show error toast if it's not an auth error
      if (error.response?.status !== 401) {
        toast.error('Failed to load batch jobs');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Create batch job from items
  const createBatchJob = useCallback(async (name, description, items, settings = {}) => {
    try {
      setLoading(true);
      
      // Validate items
      const validation = batchService.validateBatchItems(items);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const response = await batchService.createBatchJob(name, description, items, settings);
      
      toast.success(`Batch job created with ${items.length} items`);
      
      // Reload jobs and start polling
      await loadBatchJobs();
      startJobPolling(response.job_id);
      
      return response.job_id;
    } catch (error) {
      console.error('Failed to create batch job:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadBatchJobs, startJobPolling]);

  // Create batch job from CSV
  const createBatchJobFromCsv = useCallback(async (file, name, description) => {
    try {
      setLoading(true);
      
      const response = await batchService.uploadCsvBatch(file, name, description);
      
      toast.success(`Batch job created from CSV with ${response.items_count} items`);
      
      // Reload jobs and start polling
      await loadBatchJobs();
      startJobPolling(response.job_id);
      
      return response.job_id;
    } catch (error) {
      console.error('Failed to create batch job from CSV:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadBatchJobs, startJobPolling]);

  // Stop polling for job
  const stopJobPolling = useCallback((jobId) => {
    const stopPoller = activePollers.get(jobId);
    if (stopPoller) {
      stopPoller();
      setActivePollers(prev => {
        const newMap = new Map(prev);
        newMap.delete(jobId);
        return newMap;
      });
    }
  }, [activePollers]);

  // Cancel batch job
  const cancelBatchJob = useCallback(async (jobId) => {
    try {
      await batchService.cancelBatchJob(jobId);
      toast.success('Batch job cancelled');
      
      // Stop polling and reload jobs
      stopJobPolling(jobId);
      await loadBatchJobs();
    } catch (error) {
      console.error('Failed to cancel batch job:', error);
      toast.error(error.message);
      throw error;
    }
  }, [stopJobPolling, loadBatchJobs]);

  // Export batch results
  const exportBatchResults = useCallback(async (jobId, format = 'json') => {
    try {
      const result = await batchService.exportBatchResults(jobId, format);
      toast.success(`Results exported as ${result.filename}`);
      return result;
    } catch (error) {
      console.error('Failed to export batch results:', error);
      toast.error(error.message);
      throw error;
    }
  }, []);

  // Get job details
  const getJobDetails = useCallback(async (jobId) => {
    try {
      const response = await batchService.getBatchJobResults(jobId);
      return response;
    } catch (error) {
      console.error('Failed to get job details:', error);
      toast.error(error.message);
      throw error;
    }
  }, []);

  // Download CSV template
  const downloadCsvTemplate = useCallback(async (templateKey = 'linkedin_post') => {
    try {
      await batchService.downloadCsvTemplate(templateKey);
      toast.success('CSV template downloaded');
    } catch (error) {
      console.error('Failed to download CSV template:', error);
      toast.error(error.message);
      throw error;
    }
  }, []);

  // Parse CSV for preview
  const parseCsvForPreview = useCallback(async (csvText) => {
    try {
      const items = batchService.parseCsvContent(csvText);
      return items;
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      throw error;
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadTemplates(); // Templates don't require auth
    if (isAuthenticated) {
      loadBatchJobs(); // Only load user data when authenticated
    }
  }, [loadTemplates, loadBatchJobs, isAuthenticated]);

  // Start polling for processing jobs on load
  useEffect(() => {
    batchJobs.forEach(job => {
      if (job.status === 'processing' && !activePollers.has(job.id)) {
        startJobPolling(job.id);
      }
    });
  }, [batchJobs, startJobPolling, activePollers]);

  // Cleanup pollers on unmount
  useEffect(() => {
    return () => {
      activePollers.forEach(stopPoller => stopPoller());
    };
  }, [activePollers]);

  const value = {
    // State
    batchJobs,
    templates,
    loading,
    activePollers: Array.from(activePollers.keys()),

    // Actions
    createBatchJob,
    createBatchJobFromCsv,
    cancelBatchJob,
    exportBatchResults,
    getJobDetails,
    downloadCsvTemplate,
    parseCsvForPreview,
    loadBatchJobs,
    startJobPolling,
    stopJobPolling,

    // Utilities
    validateItems: batchService.validateBatchItems,
    estimateTime: batchService.estimateProcessingTime,
    formatStatus: batchService.formatJobStatus
  };

  return (
    <BatchContext.Provider value={value}>
      {children}
    </BatchContext.Provider>
  );
};

export default BatchContext;