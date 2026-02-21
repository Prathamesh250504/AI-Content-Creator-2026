import React, { useState } from 'react';
import { useBatch } from '../contexts/BatchContext';
import { useTheme } from '../contexts/ThemeContext';

const BatchJobCard = ({ job, onViewDetails, onExport }) => {
  const { cancelBatchJob, formatStatus } = useBatch();
  const { isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const statusInfo = formatStatus(job.status);
  const progressPercentage = job.progress || 0;
  const isActive = job.status === 'processing';
  const canCancel = job.status === 'pending' || job.status === 'processing';
  const canExport = job.status === 'completed';

  const handleCancel = async () => {
    if (!canCancel || isCancelling) return;
    
    setIsCancelling(true);
    try {
      await cancelBatchJob(job.id);
    } catch (error) {
      // Error handled by context
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className={`rounded-lg border p-6 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
        : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {job.name}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              statusInfo.color === 'green' ? 'bg-green-500/20 text-green-300' :
              statusInfo.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
              statusInfo.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300' :
              statusInfo.color === 'red' ? 'bg-red-500/20 text-red-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              <span>{statusInfo.icon}</span>
              {statusInfo.label}
            </span>
          </div>
          
          {job.description && (
            <p className={`text-sm mb-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {job.description}
            </p>
          )}
          
          <div className={`flex items-center gap-4 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span>{job.total_items} items</span>
            <span>•</span>
            <span>Created {formatDate(job.created_at)}</span>
            {job.started_at && (
              <>
                <span>•</span>
                <span>Duration: {formatDuration(job.started_at, job.completed_at)}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="mb-4">
          <div className={`flex items-center justify-between text-sm mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className={`w-full rounded-full h-2 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{job.completed_items}</div>
          <div className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Completed
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{job.failed_items}</div>
          <div className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Failed
          </div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {job.total_items - job.completed_items - job.failed_items}
          </div>
          <div className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Pending
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={`border-t pt-4 mt-4 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Job ID:</span>
              <span className={`ml-2 font-mono ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {job.id.slice(0, 8)}...
              </span>
            </div>
            <div>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Success Rate:</span>
              <span className={`ml-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {job.total_items > 0 ? Math.round((job.completed_items / job.total_items) * 100) : 0}%
              </span>
            </div>
            {job.estimated_completion && job.status === 'processing' && (
              <div className="col-span-2">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Estimated Completion:</span>
                <span className={`ml-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatDate(job.estimated_completion)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={`flex items-center gap-2 mt-4 pt-4 border-t ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={() => onViewDetails(job)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          View Details
        </button>
        
        {canExport && (
          <button
            onClick={() => onExport(job)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Export
          </button>
        )}
        
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BatchJobCard;