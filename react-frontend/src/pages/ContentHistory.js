import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { 
  Search, 
  Download, 
  Trash2, 
  Copy, 
  Star,
  Calendar,
  FileText,
  Eye,
  X
} from 'lucide-react';
import { useContent } from '../contexts/ContentContext';

const ContentHistory = () => {
  const location = useLocation();
  const { contentHistory, deleteHistoryEntry, exportHistory, loadContentHistory } = useContent();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Handle search term from navbar navigation
  useEffect(() => {
    if (location.state?.searchTerm) {
      setSearchTerm(location.state.searchTerm);
    }
    if (location.state?.highlightId) {
      setHighlightId(location.state.highlightId);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightId(null), 3000);
    }
  }, [location.state]);

  useEffect(() => {
    loadContentHistory();
  }, [loadContentHistory]);

  useEffect(() => {
    let filtered = [...contentHistory];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        (entry.content && entry.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.content_type && entry.content_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.template_used && entry.template_used.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.parameters?.topic && entry.parameters.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.parameters?.user_prompt && entry.parameters.user_prompt.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(entry => 
        (entry.content_type || entry.template_used) === filterType
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'type':
          const typeA = a.content_type || a.template_used || '';
          const typeB = b.content_type || b.template_used || '';
          return typeA.localeCompare(typeB);
        case 'length':
          return (b.word_count || 0) - (a.word_count || 0);
        default:
          return 0;
      }
    });

    setFilteredHistory(filtered);
  }, [contentHistory, searchTerm, filterType, sortBy]);

  const handleDelete = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteHistoryEntry(entryId);
        toast.success('Content deleted successfully');
      } catch (error) {
        toast.error('Failed to delete content');
      }
    }
  };

  const handleExport = async (format) => {
    try {
      // Check if there's content to export
      if (contentHistory.length === 0) {
        toast.error('No content history to export');
        return;
      }

      // Show loading toast for PDF export (it might take longer)
      let loadingToast;
      if (format === 'pdf') {
        loadingToast = toast.loading('Generating PDF report... This may take a moment.');
      }

      const response = await exportHistory(format);
      
      // Dismiss loading toast
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      
      if (!response.success) {
        throw new Error(response.error || 'Export failed');
      }
      
      let content, mimeType, filename;
      
      if (format === 'json') {
        content = JSON.stringify(response.data, null, 2);
        mimeType = 'application/json';
        filename = `content-history-${new Date().toISOString().split('T')[0]}.json`;
      } else if (format === 'csv') {
        content = response.data;
        mimeType = 'text/csv';
        filename = `content-history-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (format === 'pdf') {
        // Handle PDF export with base64 data
        const pdfData = response.data;
        const byteCharacters = atob(pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        content = byteArray;
        mimeType = 'application/pdf';
        filename = response.filename || `content-history-${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`History exported successfully as ${format.toUpperCase()} (${response.total_entries} entries)`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export history');
    }
  };

  const copyToClipboard = (content) => {
    if (!content || typeof content !== 'string') {
      toast.error('No content to copy');
      return;
    }
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard!');
  };

  const getContentTypes = () => {
    const types = [...new Set(contentHistory
      .map(entry => entry.content_type || entry.template_used || 'Unknown')
      .filter(type => type && type !== 'Unknown')
    )];
    return types;
  };

  const truncateContent = (content, maxLength = 200) => {
    if (!content || typeof content !== 'string') return 'No content available';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const openPreview = (entry) => {
    setPreviewEntry(entry);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewEntry(null);
  };

  const formatContentForDisplay = (content) => {
    if (!content || typeof content !== 'string') return 'No content available';
    
    // Split content into paragraphs and format
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      
      // Check if it's a header (starts with numbers like "1.", "2.", etc.)
      if (/^\d+\./.test(paragraph.trim())) {
        return (
          <h3 key={index} className="text-lg font-semibold text-purple-300 mt-4 mb-2">
            {paragraph.trim()}
          </h3>
        );
      }
      
      // Check if it's a bullet point
      if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
        return (
          <li key={index} className="text-gray-200 mb-1 ml-4">
            {paragraph.trim().substring(1).trim()}
          </li>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="text-gray-200 mb-3 leading-relaxed">
          {paragraph.trim()}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="bg-hero-gradient rounded-3xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔍 Content History</h1>
          <p className="text-xl text-white/90">Manage and explore your generated content</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full input-cosmic rounded-lg pl-10 pr-4 py-3"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-cosmic rounded-lg px-4 py-3"
            >
              <option value="all">All Types</option>
              {getContentTypes().map(type => (
                <option key={type} value={type}>
                  {type && typeof type === 'string' 
                    ? type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : 'Unknown Type'
                  }
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-cosmic rounded-lg px-4 py-3"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="type">By Type</option>
              <option value="length">By Length</option>
            </select>

            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleExport(e.target.value);
                    e.target.value = ''; // Reset selection
                  }
                }}
                className="btn-cosmic text-white px-4 py-3 pr-10 rounded-lg font-medium cursor-pointer appearance-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                defaultValue=""
              >
                <option value="" disabled className="bg-gray-800 text-white">
                  📥 Export History
                </option>
                <option value="json" className="bg-gray-800 text-white">
                  📄 Export as JSON
                </option>
                <option value="csv" className="bg-gray-800 text-white">
                  📊 Export as CSV
                </option>
                <option value="pdf" className="bg-gray-800 text-white">
                  📋 Export as PDF
                </option>
              </select>
              <Download className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-white" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{contentHistory.length}</div>
            <div className="text-sm text-gray-400">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {contentHistory.reduce((sum, entry) => sum + (entry.word_count || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{getContentTypes().length}</div>
            <div className="text-sm text-gray-400">Content Types</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{filteredHistory.length}</div>
            <div className="text-sm text-gray-400">Filtered Results</div>
          </div>
        </div>
      </motion.div>

      {/* Content List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {filteredHistory.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4 opacity-60">📝</div>
            <h3 className="text-xl font-bold text-white mb-2">No Content Found</h3>
            <p className="text-gray-400 mb-6">
              {contentHistory.length === 0 
                ? "You haven't generated any content yet. Start creating to see your history here!"
                : "No content matches your current filters. Try adjusting your search or filters."
              }
            </p>
            {contentHistory.length === 0 && (
              <a
                href="/generator"
                className="inline-flex items-center px-6 py-3 btn-cosmic text-white font-medium rounded-lg"
              >
                <FileText className="w-5 h-5 mr-2" />
                Generate Content
              </a>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredHistory.map((entry, index) => (
              <motion.div
                key={entry.content_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass rounded-xl p-6 hover:shadow-2xl transition-all duration-300 ${
                  highlightId === entry.content_id ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {(entry.content_type || entry.template_used || 'Generated Content') && typeof (entry.content_type || entry.template_used) === 'string'
                          ? (entry.content_type || entry.template_used).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                          : 'Generated Content'
                        }
                      </h3>
                      <span className="px-2 py-1 bg-purple-600/30 text-purple-300 text-xs rounded-full">
                        v{entry.version || 1}
                      </span>
                      {entry.favorite && (
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {entry.word_count || 0} words
                      </div>
                      {entry.model_used && (
                        <div className="text-xs text-gray-500">
                          Model: {entry.model_used}
                        </div>
                      )}
                    </div>

                    {/* Topic/Prompt */}
                    {(entry.parameters?.topic || entry.parameters?.user_prompt) && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-purple-300">Topic: </span>
                        <span className="text-sm text-gray-300">
                          {entry.parameters.topic || entry.parameters.user_prompt}
                        </span>
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="bg-black/20 rounded-lg p-4 mb-4">
                      <p className="text-gray-200 leading-relaxed">
                        {truncateContent(entry.content || 'No content available')}
                      </p>
                    </div>

                    {/* Parameters */}
                    {entry.parameters && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {entry.parameters.tone && (
                          <span className="px-2 py-1 bg-blue-600/30 text-blue-300 text-xs rounded-full">
                            {entry.parameters.tone}
                          </span>
                        )}
                        {entry.parameters.length && (
                          <span className="px-2 py-1 bg-green-600/30 text-green-300 text-xs rounded-full">
                            {entry.parameters.length}
                          </span>
                        )}
                        {entry.parameters.target_audience && entry.parameters.target_audience !== 'general audience' && (
                          <span className="px-2 py-1 bg-orange-600/30 text-orange-300 text-xs rounded-full">
                            {entry.parameters.target_audience}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openPreview(entry)}
                      className="p-2 glass glass-hover rounded-lg text-blue-400 hover:text-blue-300"
                      title="Preview content"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => copyToClipboard(entry.content || 'No content available')}
                      className="p-2 glass glass-hover rounded-lg text-white"
                      title="Copy content"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(entry.content_id)}
                      className="p-2 glass glass-hover rounded-lg text-red-400 hover:text-red-300"
                      title="Delete content"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Preview Modal */}
      {showPreview && previewEntry && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center lg:left-[280px]">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closePreview}
          />
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] mx-4 glass rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {(previewEntry.content_type || previewEntry.template_used || 'Generated Content')
                        .replace('_', ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())
                      }
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(previewEntry.timestamp).toLocaleDateString()}</span>
                      </div>
                      <span>•</span>
                      <span>{previewEntry.word_count || 0} words</span>
                      {previewEntry.model_used && (
                        <>
                          <span>•</span>
                          <span className="text-purple-400">{previewEntry.model_used}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(previewEntry.content || 'No content available')}
                    className="p-2 glass glass-hover rounded-lg text-white"
                    title="Copy content"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closePreview}
                    className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white"
                    title="Close preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Parameters */}
                {previewEntry.parameters && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-purple-300 mb-3">Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {previewEntry.parameters.topic && (
                        <div>
                          <span className="text-sm font-medium text-gray-400">Topic:</span>
                          <p className="text-white">{previewEntry.parameters.topic}</p>
                        </div>
                      )}
                      {previewEntry.parameters.tone && (
                        <div>
                          <span className="text-sm font-medium text-gray-400">Tone:</span>
                          <p className="text-white capitalize">{previewEntry.parameters.tone}</p>
                        </div>
                      )}
                      {previewEntry.parameters.target_audience && previewEntry.parameters.target_audience !== 'general audience' && (
                        <div>
                          <span className="text-sm font-medium text-gray-400">Target Audience:</span>
                          <p className="text-white">{previewEntry.parameters.target_audience}</p>
                        </div>
                      )}
                      {previewEntry.parameters.length && (
                        <div>
                          <span className="text-sm font-medium text-gray-400">Length:</span>
                          <p className="text-white capitalize">{previewEntry.parameters.length}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {previewEntry.parameters.tone && (
                        <span className="px-2 py-1 bg-blue-600/30 text-blue-300 text-xs rounded-full">
                          {previewEntry.parameters.tone}
                        </span>
                      )}
                      {previewEntry.parameters.length && (
                        <span className="px-2 py-1 bg-green-600/30 text-green-300 text-xs rounded-full">
                          {previewEntry.parameters.length}
                        </span>
                      )}
                      {previewEntry.parameters.target_audience && previewEntry.parameters.target_audience !== 'general audience' && (
                        <span className="px-2 py-1 bg-orange-600/30 text-orange-300 text-xs rounded-full">
                          {previewEntry.parameters.target_audience}
                        </span>
                      )}
                      {previewEntry.favorite && (
                        <span className="px-2 py-1 bg-yellow-600/30 text-yellow-300 text-xs rounded-full flex items-center">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Favorite
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Generated Content */}
                <div>
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">Generated Content</h3>
                  <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                    <div className="prose prose-invert max-w-none">
                      {formatContentForDisplay(previewEntry.content || 'No content available')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/20">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Version {previewEntry.version || 1}</span>
                  {previewEntry.content_id && (
                    <>
                      <span>•</span>
                      <span>ID: {previewEntry.content_id.slice(-8)}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      copyToClipboard(previewEntry.content || 'No content available');
                      closePreview();
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                  >
                    Copy & Close
                  </button>
                  <button
                    onClick={closePreview}
                    className="px-4 py-2 glass glass-hover rounded-lg text-white font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ContentHistory;