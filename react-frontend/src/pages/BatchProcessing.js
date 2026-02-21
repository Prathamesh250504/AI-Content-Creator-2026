import React, { useState, useEffect } from 'react';
import { useBatch } from '../contexts/BatchContext';
import { useTheme } from '../contexts/ThemeContext';
import BatchJobCard from '../components/BatchJobCard';
import BatchUploadModal from '../components/BatchUploadModal';
import BatchJobDetailsModal from '../components/BatchJobDetailsModal';

const BatchProcessing = () => {
  const { 
    batchJobs, 
    loading, 
    loadBatchJobs, 
    exportBatchResults
  } = useBatch();
  
  const { isDarkMode } = useTheme();
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    loadBatchJobs();
  }, [loadBatchJobs]);

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const handleExport = async (job) => {
    try {
      await exportBatchResults(job.id, 'json');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleUploadSuccess = (jobId) => {
    console.log('Batch job created:', jobId);
    loadBatchJobs();
  };

  const getFilteredAndSortedJobs = () => {
    let filtered = batchJobs;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => job.status === filterStatus);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progress - a.progress;
        case 'total_items':
          return b.total_items - a.total_items;
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const getStatusCounts = () => {
    return batchJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {});
  };

  const filteredJobs = getFilteredAndSortedJobs();
  const statusCounts = getStatusCounts();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Batch Processing
              </h1>
              <p className={`${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Generate multiple pieces of content efficiently with bulk processing
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Batch Job
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className={`rounded-lg p-4 text-center transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <div className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {statusCounts.total || 0}
            </div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Total Jobs
            </div>
          </div>
          <div className={`rounded-lg p-4 text-center transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <div className="text-2xl font-bold text-blue-400">{statusCounts.processing || 0}</div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Processing
            </div>
          </div>
          <div className={`rounded-lg p-4 text-center transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <div className="text-2xl font-bold text-green-400">{statusCounts.completed || 0}</div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Completed
            </div>
          </div>
          <div className={`rounded-lg p-4 text-center transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <div className="text-2xl font-bold text-red-400">{statusCounts.failed || 0}</div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Failed
            </div>
          </div>
          <div className={`rounded-lg p-4 text-center transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200 shadow-sm'
          }`}>
            <div className="text-2xl font-bold text-yellow-400">{statusCounts.pending || 0}</div>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Pending
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className={`rounded-lg p-6 mb-8 transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full md:w-auto rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700 border border-gray-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Jobs ({statusCounts.total || 0})</option>
                <option value="pending">Pending ({statusCounts.pending || 0})</option>
                <option value="processing">Processing ({statusCounts.processing || 0})</option>
                <option value="completed">Completed ({statusCounts.completed || 0})</option>
                <option value="failed">Failed ({statusCounts.failed || 0})</option>
                <option value="cancelled">Cancelled ({statusCounts.cancelled || 0})</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full md:w-auto rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700 border border-gray-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-900'
                }`}
              >
                <option value="created_at">Created Date</option>
                <option value="name">Name</option>
                <option value="progress">Progress</option>
                <option value="total_items">Item Count</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadBatchJobs}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-900 border border-gray-300'
                }`}
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {loading && batchJobs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className={`ml-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Loading batch jobs...
            </span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className={`mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {batchJobs.length === 0 ? (
                <>
                  <svg className={`w-16 h-16 mx-auto mb-4 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg">No batch jobs yet</p>
                  <p className="text-sm">Create your first batch job to get started</p>
                </>
              ) : (
                <>
                  <p className="text-lg">No jobs match the current filters</p>
                  <p className="text-sm">Try adjusting your filter settings</p>
                </>
              )}
            </div>
            {batchJobs.length === 0 && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Batch Job
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <BatchJobCard
                key={job.id}
                job={job}
                onViewDetails={handleViewDetails}
                onExport={handleExport}
              />
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className={`mt-12 rounded-lg p-6 transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            How to Use Batch Processing
          </h3>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <span className={`font-medium ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Prepare Your Content
                </span>
              </div>
              <p>Create a CSV file with your prompts or enter them manually. Download our template to get started quickly.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <span className={`font-medium ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Upload & Process
                </span>
              </div>
              <p>Upload your CSV or create items manually. Our system will process them efficiently with rate limiting and queue management.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <span className={`font-medium ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Export Results
                </span>
              </div>
              <p>Monitor progress in real-time and export your results in multiple formats (JSON, CSV, TXT) when complete.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BatchUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
      
      <BatchJobDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        job={selectedJob}
      />
    </div>
  );
};

export default BatchProcessing;