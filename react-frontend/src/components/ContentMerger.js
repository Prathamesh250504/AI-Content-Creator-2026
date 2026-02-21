import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Merge,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Copy,
  Save,
  Download,
  Loader,
  Eye,
  Zap,
  Layers,
  Settings
} from 'lucide-react';
import contentEnhancementService from '../services/contentEnhancementService';

const ContentMerger = ({ 
  availableContent = [], 
  onClose, 
  onSave,
  initialSelectedContent = []
}) => {
  const [selectedContent, setSelectedContent] = useState(initialSelectedContent);
  const [mergeStyle, setMergeStyle] = useState('cohesive');
  const [mergedContent, setMergedContent] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeMetrics, setMergeMetrics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Merge style options
  const mergeStyles = [
    {
      value: 'cohesive',
      label: 'Cohesive Flow',
      description: 'Blend pieces smoothly with natural transitions',
      icon: '🌊',
      example: 'Creates a unified narrative that flows naturally from one idea to the next'
    },
    {
      value: 'sequential',
      label: 'Sequential Order',
      description: 'Combine pieces in logical sequence',
      icon: '📋',
      example: 'Maintains the order of selected pieces with clear section breaks'
    },
    {
      value: 'integrated',
      label: 'Integrated Points',
      description: 'Merge key points into unified content',
      icon: '🔗',
      example: 'Extracts and combines the most important points from each piece'
    },
    {
      value: 'summary',
      label: 'Unified Summary',
      description: 'Create comprehensive summary',
      icon: '📝',
      example: 'Condenses all pieces into a concise, comprehensive overview'
    }
  ];
  
  // Filter available content based on search and type
  const filteredContent = availableContent.filter(item => {
    const matchesSearch = !searchTerm || 
      item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.template_used?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      item.template_used === filterType ||
      item.content_type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Get unique content types for filtering
  const contentTypes = [...new Set(availableContent.map(item => 
    item.template_used || item.content_type || 'general'
  ))];
  
  // Handle content selection
  const toggleContentSelection = (content) => {
    setSelectedContent(prev => {
      const isSelected = prev.some(item => item.id === content.id);
      if (isSelected) {
        return prev.filter(item => item.id !== content.id);
      } else {
        return [...prev, content];
      }
    });
  };
  
  // Select all filtered content
  const selectAllFiltered = () => {
    const newSelections = filteredContent.filter(item => 
      !selectedContent.some(selected => selected.id === item.id)
    );
    setSelectedContent(prev => [...prev, ...newSelections]);
  };
  
  // Clear all selections
  const clearAllSelections = () => {
    setSelectedContent([]);
  };
  
  // Perform content merge
  const performMerge = async () => {
    if (selectedContent.length < 2) {
      return;
    }
    
    setMerging(true);
    try {
      const contentPieces = selectedContent.map(item => ({
        content: item.content,
        content_type: item.template_used || item.content_type || 'general',
        word_count: item.content?.split(' ').length || 0
      }));
      
      const result = await contentEnhancementService.mergeContent(contentPieces, mergeStyle);
      
      if (result.success) {
        setMergedContent(result.merged_content);
        setMergeMetrics(result.metrics);
      } else {
        console.error('Merge failed:', result.error);
      }
    } catch (error) {
      console.error('Merge error:', error);
    } finally {
      setMerging(false);
    }
  };
  
  // Copy merged content to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mergedContent);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  // Save merged content
  const saveMergedContent = () => {
    if (onSave && mergedContent) {
      onSave(mergedContent, {
        mergeStyle,
        originalPieces: selectedContent.length,
        metrics: mergeMetrics
      });
    }
  };
  
  // Export merged content
  const exportMergedContent = () => {
    if (!mergedContent) return;
    
    const blob = new Blob([mergedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged-content-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Calculate selection metrics
  const selectionMetrics = {
    totalPieces: selectedContent.length,
    totalWords: selectedContent.reduce((sum, item) => 
      sum + (item.content?.split(' ').length || 0), 0),
    contentTypes: [...new Set(selectedContent.map(item => 
      item.template_used || item.content_type || 'general'))],
    avgWordsPerPiece: selectedContent.length > 0 ? 
      Math.round(selectedContent.reduce((sum, item) => 
        sum + (item.content?.split(' ').length || 0), 0) / selectedContent.length) : 0
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:left-[280px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Merge className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Content Merger</h2>
            {selectedContent.length > 0 && (
              <span className="px-2 py-1 bg-green-600/30 text-green-300 text-xs rounded-full">
                {selectedContent.length} selected
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white"
              title="Advanced Options"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex h-[calc(90vh-120px)] min-h-[600px]">
          {/* Content Selection Panel */}
          <div className="w-1/2 border-r border-gray-700 flex flex-col">
            {/* Selection Controls */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full input-cosmic rounded-lg text-sm"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-cosmic rounded-lg text-sm"
                >
                  <option value="all">All Types</option>
                  {contentTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllFiltered}
                    disabled={filteredContent.length === 0}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 text-sm disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    Select All
                  </button>
                  
                  <button
                    onClick={clearAllSelections}
                    disabled={selectedContent.length === 0}
                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded text-red-300 text-sm disabled:opacity-50"
                  >
                    <Minus className="w-3 h-3 inline mr-1" />
                    Clear All
                  </button>
                </div>
                
                <div className="text-sm text-gray-400">
                  {filteredContent.length} available • {selectedContent.length} selected
                </div>
              </div>
            </div>
            
            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredContent.map((item, index) => {
                const isSelected = selectedContent.some(selected => selected.id === item.id);
                
                return (
                  <motion.div
                    key={item.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-green-600/20 border-green-500/50 shadow-lg' 
                        : 'glass border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => toggleContentSelection(item)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-500'
                        }`}>
                          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        
                        <span className="text-sm font-medium text-purple-300">
                          {item.template_used?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Content'}
                        </span>
                      </div>
                      
                      <span className="text-xs text-gray-400">
                        {item.content?.split(' ').length || 0} words
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 line-clamp-3">
                      {item.content?.substring(0, 150)}...
                    </p>
                    
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'No date'}
                      </span>
                      {item.model && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {item.model}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {filteredContent.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No content matches your search criteria</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Merge Configuration & Preview Panel */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {/* Merge Configuration */}
              <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                <h3 className="text-lg font-semibold text-white mb-4">Merge Configuration</h3>
                
                {/* Selection Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-2 bg-black/20 rounded">
                    <div className="text-lg font-bold text-white">{selectionMetrics.totalPieces}</div>
                    <div className="text-xs text-gray-400">Pieces</div>
                  </div>
                  <div className="text-center p-2 bg-black/20 rounded">
                    <div className="text-lg font-bold text-blue-300">{selectionMetrics.totalWords}</div>
                    <div className="text-xs text-gray-400">Total Words</div>
                  </div>
                  <div className="text-center p-2 bg-black/20 rounded">
                    <div className="text-lg font-bold text-green-300">{selectionMetrics.contentTypes.length}</div>
                    <div className="text-xs text-gray-400">Types</div>
                  </div>
                  <div className="text-center p-2 bg-black/20 rounded">
                    <div className="text-lg font-bold text-purple-300">{selectionMetrics.avgWordsPerPiece}</div>
                    <div className="text-xs text-gray-400">Avg/Piece</div>
                  </div>
                </div>
                
                {/* Merge Style Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">Merge Style</label>
                  <div className="grid grid-cols-1 gap-2">
                    {mergeStyles.map(style => (
                      <label key={style.value} className="flex items-start gap-3 p-3 glass rounded-lg cursor-pointer hover:bg-gray-700/30">
                        <input
                          type="radio"
                          name="mergeStyle"
                          value={style.value}
                          checked={mergeStyle === style.value}
                          onChange={(e) => setMergeStyle(e.target.value)}
                          className="mt-1 text-green-500 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{style.icon}</span>
                            <span className="font-medium text-white">{style.label}</span>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">{style.description}</p>
                          {showAdvancedOptions && (
                            <p className="text-xs text-gray-500 italic">{style.example}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Merge Button */}
                <button
                  onClick={performMerge}
                  disabled={selectedContent.length < 2 || merging}
                  className="w-full mt-4 btn-cosmic text-white font-medium rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {merging ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin inline mr-2" />
                      Merging Content...
                    </>
                  ) : (
                    <>
                      <Merge className="w-4 h-4 inline mr-2" />
                      Merge {selectedContent.length} Pieces
                    </>
                  )}
                </button>
                
                {selectedContent.length < 2 && (
                  <p className="text-sm text-yellow-400 mt-2 text-center">
                    Select at least 2 content pieces to merge
                  </p>
                )}
              </div>
              
              {/* Preview Panel */}
              <div className="p-4">
                {mergedContent ? (
                  <div className="space-y-4">
                    {/* Preview Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Eye className="w-5 h-5 text-green-400" />
                        Merged Content Preview
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="p-2 glass glass-hover rounded-lg text-blue-400 hover:text-blue-300"
                          title="Copy to Clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={exportMergedContent}
                          className="p-2 glass glass-hover rounded-lg text-green-400 hover:text-green-300"
                          title="Export as File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={saveMergedContent}
                          className="px-4 py-2 btn-cosmic text-white font-medium rounded-lg"
                        >
                          <Save className="w-4 h-4 inline mr-2" />
                          Save
                        </button>
                      </div>
                    </div>
                    
                    {/* Merge Metrics */}
                    {mergeMetrics && (
                      <div className="grid grid-cols-4 gap-3 p-3 bg-black/20 rounded-lg">
                        <div className="text-center">
                          <div className="text-sm font-bold text-white">{mergeMetrics.original_pieces}</div>
                          <div className="text-xs text-gray-400">Original</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-blue-300">{mergeMetrics.original_total_words}</div>
                          <div className="text-xs text-gray-400">Total Words</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-green-300">{mergeMetrics.merged_words}</div>
                          <div className="text-xs text-gray-400">Merged</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-purple-300">{mergeMetrics.compression_ratio}</div>
                          <div className="text-xs text-gray-400">Ratio</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Content Preview */}
                    <div className="glass rounded-lg p-4 min-h-[300px]">
                      <div className="prose prose-invert max-w-none">
                        {mergedContent.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-3 text-gray-300 leading-relaxed">
                            {paragraph || '\u00A0'}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Merge className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Ready to Merge</p>
                      <p className="text-sm">Select content pieces and click merge to see the preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContentMerger;