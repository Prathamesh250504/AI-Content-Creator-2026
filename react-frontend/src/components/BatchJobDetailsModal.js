import { useState, useEffect, useCallback } from 'react';
import { useBatch } from '../contexts/BatchContext';

const BatchJobDetailsModal = ({ isOpen, onClose, job }) => {
  const { getJobDetails, exportBatchResults } = useBatch(); // Removed unused formatStatus
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Use useCallback to memoize the function and fix the dependency warning
  const loadJobDetails = useCallback(async () => {
    if (!job) return;
    
    setLoading(true);
    try {
      const details = await getJobDetails(job.id);
      setJobDetails(details);
    } catch (error) {
      console.error('Failed to load job details:', error);
    } finally {
      setLoading(false);
    }
  }, [job, getJobDetails]); // Add dependencies

  useEffect(() => {
    if (isOpen && job) {
      loadJobDetails();
    }
  }, [isOpen, job, loadJobDetails]); // Now loadJobDetails is included

  const handleExport = async (format) => {
    try {
      await exportBatchResults(job.id, format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleSelectAll = () => {
    if (!jobDetails) return;
    
    const filteredItems = getFilteredItems();
    const allSelected = filteredItems.every(item => selectedItems.has(item.id));
    
    if (allSelected) {
      // Deselect all filtered items
      const newSelected = new Set(selectedItems);
      filteredItems.forEach(item => newSelected.delete(item.id));
      setSelectedItems(newSelected);
    } else {
      // Select all filtered items
      const newSelected = new Set(selectedItems);
      filteredItems.forEach(item => newSelected.add(item.id));
      setSelectedItems(newSelected);
    }
  };

  const handleItemSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const getFilteredItems = () => {
    if (!jobDetails?.items) return [];
    
    return jobDetails.items.filter(item => {
      // Status filter
      if (filterStatus !== 'all' && item.status !== filterStatus) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.user_prompt.toLowerCase().includes(searchLower) ||
          item.template_key.toLowerCase().includes(searchLower) ||
          (item.result?.content || '').toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-400',
      failed: 'text-red-400',
      processing: 'text-blue-400',
      pending: 'text-yellow-400',
      skipped: 'text-gray-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen || !job) return null;

  const filteredItems = getFilteredItems();
  const statusCounts = jobDetails?.items?.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      {/* Modal positioned to start after sidebar on desktop */}
      <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-white">{job.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{job.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading details...</span>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(90vh-80px)]">
            {/* Job Summary */}
            <div className="p-6 border-b border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{job.total_items}</div>
                  <div className="text-xs text-gray-400">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{job.completed_items}</div>
                  <div className="text-xs text-gray-400">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{job.failed_items}</div>
                  <div className="text-xs text-gray-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{job.progress}%</div>
                  <div className="text-xs text-gray-400">Progress</div>
                </div>
              </div>

              {/* Export Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('json')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Export TXT
                </button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status ({jobDetails?.items?.length || 0})</option>
                    <option value="completed">Completed ({statusCounts.completed || 0})</option>
                    <option value="failed">Failed ({statusCounts.failed || 0})</option>
                    <option value="processing">Processing ({statusCounts.processing || 0})</option>
                    <option value="pending">Pending ({statusCounts.pending || 0})</option>
                  </select>
                  <button
                    onClick={handleSelectAll}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {filteredItems.every(item => selectedItems.has(item.id)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredItems.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No items match the current filters
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`bg-gray-700 rounded-lg p-4 border ${
                        selectedItems.has(item.id) ? 'border-blue-500' : 'border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleItemSelect(item.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-300">
                                #{index + 1}
                              </span>
                              <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                                {item.template_key}
                              </span>
                              <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                            {item.result?.quality_score && (
                              <span className="text-xs text-gray-400">
                                Quality: {Math.round(item.result.quality_score)}%
                              </span>
                            )}
                          </div>
                          
                          <div className="mb-2">
                            <div className="text-sm text-gray-400 mb-1">Prompt:</div>
                            <div className="text-sm text-white bg-gray-800 rounded p-2">
                              {item.user_prompt}
                            </div>
                          </div>
                          
                          {item.status === 'completed' && item.result?.content && (
                            <div className="mb-2">
                              <div className="text-sm text-gray-400 mb-1">Generated Content:</div>
                              <div className="text-sm text-white bg-gray-800 rounded p-2 max-h-32 overflow-y-auto">
                                {item.result.content}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span>Words: {item.result.word_count || 0}</span>
                                <span>Model: {item.result.model_used || 'Unknown'}</span>
                                {item.completed_at && (
                                  <span>Completed: {formatDate(item.completed_at)}</span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {item.status === 'failed' && item.error && (
                            <div className="mb-2">
                              <div className="text-sm text-red-400 mb-1">Error:</div>
                              <div className="text-sm text-red-300 bg-red-900/20 rounded p-2">
                                {item.error}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default BatchJobDetailsModal;