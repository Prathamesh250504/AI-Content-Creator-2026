import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Edit3,
  Copy,
  Save,
  Download,
  BarChart3,
  Clock,
  Target,
  Zap,
  Lightbulb,
  CheckCircle,
  Loader,
  Plus,
  Merge
} from 'lucide-react';
import ContentEditor from './ContentEditor';
import contentEnhancementService from '../services/contentEnhancementService';

const EnhancedContentGenerator = ({ 
  generatedContent = '', 
  contentType = 'general',
  onClose,
  onSave,
  contentHistory = []
}) => {
  const [content, setContent] = useState(generatedContent);
  const [showEditor, setShowEditor] = useState(false);
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [enhancementHistory, setEnhancementHistory] = useState([]);
  const [showMergeOptions, setShowMergeOptions] = useState(false);
  const [selectedHistoryItems, setSelectedHistoryItems] = useState([]);
  
  // Quick enhancement states
  const [quickEnhancing, setQuickEnhancing] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  // Analyze content whenever it changes
  useEffect(() => {
    if (content) {
      const analysis = contentEnhancementService.analyzeContent(content);
      setContentAnalysis(analysis);
    }
  }, [content]);
  
  // Load suggestions function (defined before useEffect to avoid hoisting issues)
  const loadSuggestions = useCallback(async () => {
    if (!content.trim()) return;
    
    setLoadingSuggestions(true);
    try {
      const result = await contentEnhancementService.getSuggestions(content, contentType);
      if (result.success) {
        setSuggestions(result.suggestions);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [content, contentType]);
  
  // Load suggestions when content changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && content !== generatedContent) {
        loadSuggestions();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [content, generatedContent, loadSuggestions]);
  
  // Quick enhancement actions
  const quickEnhance = async (type, value) => {
    setQuickEnhancing(type);
    try {
      let result;
      
      switch (type) {
        case 'tone':
          result = await contentEnhancementService.enhanceTone(content, value, contentType);
          break;
        case 'length':
          result = await contentEnhancementService.enhanceLength(content, value, contentType);
          break;
        case 'style':
          result = await contentEnhancementService.enhanceStyle(content, value);
          break;
        default:
          throw new Error('Unknown enhancement type');
      }
      
      if (result.success) {
        // Add to enhancement history
        setEnhancementHistory(prev => [{
          id: Date.now(),
          type,
          value,
          originalContent: content,
          enhancedContent: result.enhanced_content,
          timestamp: new Date().toISOString(),
          metrics: result.metrics
        }, ...prev]);
        
        setContent(result.enhanced_content);
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
    } finally {
      setQuickEnhancing(null);
    }
  };
  
  // Apply suggestion
  const applySuggestion = async (suggestion) => {
    try {
      const result = await contentEnhancementService.applySuggestion(content, suggestion);
      if (result.success) {
        setContent(result.enhanced_content);
        // Reload suggestions
        setTimeout(loadSuggestions, 500);
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  };
  
  // Merge with selected content
  const mergeWithSelected = async () => {
    if (selectedHistoryItems.length === 0) return;
    
    const contentPieces = [
      { content, content_type: contentType },
      ...selectedHistoryItems.map(item => ({
        content: item.content,
        content_type: item.content_type || 'general'
      }))
    ];
    
    try {
      const result = await contentEnhancementService.mergeContent(contentPieces, 'cohesive');
      if (result.success) {
        setContent(result.merged_content);
        setShowMergeOptions(false);
        setSelectedHistoryItems([]);
      }
    } catch (error) {
      console.error('Failed to merge content:', error);
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };
  
  // Save content
  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
  };
  
  // Export content
  const exportContent = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const readabilityLevel = contentAnalysis ? 
    contentEnhancementService.getReadabilityLevel(contentAnalysis.readabilityScore) : 
    { level: 'Unknown', color: 'text-gray-400' };
  
  return (
    <div className="space-y-6">
      {/* Content Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Enhanced Content</h3>
            {content !== generatedContent && (
              <span className="px-2 py-1 bg-green-600/30 text-green-300 text-xs rounded-full">
                Enhanced
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditor(true)}
              className="p-2 glass glass-hover rounded-lg text-blue-400 hover:text-blue-300"
              title="Open Advanced Editor"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            
            <button
              onClick={copyToClipboard}
              className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white"
              title="Copy to Clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleSave}
              className="p-2 glass glass-hover rounded-lg text-green-400 hover:text-green-300"
              title="Save Content"
            >
              <Save className="w-4 h-4" />
            </button>
            
            <button
              onClick={exportContent}
              className="p-2 glass glass-hover rounded-lg text-purple-400 hover:text-purple-300"
              title="Export Content"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content Analysis */}
        {contentAnalysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-black/20 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{contentAnalysis.wordCount}</div>
              <div className="text-xs text-gray-400">Words</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{contentAnalysis.sentenceCount}</div>
              <div className="text-xs text-gray-400">Sentences</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${readabilityLevel.color}`}>
                {contentAnalysis.readabilityScore}
              </div>
              <div className="text-xs text-gray-400">Readability</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {contentAnalysis.estimatedReadingTime}m
              </div>
              <div className="text-xs text-gray-400">Read Time</div>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            {content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3 text-gray-300 leading-relaxed">
                {paragraph || '\u00A0'}
              </p>
            ))}
          </div>
        </div>
      </motion.div>
      
      {/* Quick Enhancement Actions */}
      {showQuickActions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Enhancements
            </h4>
            <button
              onClick={() => setShowQuickActions(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tone Adjustments */}
            <div>
              <h5 className="text-sm font-medium text-purple-300 mb-2">Adjust Tone</h5>
              <div className="space-y-2">
                {['professional', 'casual', 'friendly', 'enthusiastic'].map(tone => (
                  <button
                    key={tone}
                    onClick={() => quickEnhance('tone', tone)}
                    disabled={quickEnhancing === 'tone'}
                    className="w-full text-left p-2 glass glass-hover rounded-lg text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {quickEnhancing === 'tone' ? (
                      <Loader className="w-4 h-4 animate-spin inline mr-2" />
                    ) : (
                      <Target className="w-4 h-4 inline mr-2" />
                    )}
                    Make {tone}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Length Adjustments */}
            <div>
              <h5 className="text-sm font-medium text-purple-300 mb-2">Adjust Length</h5>
              <div className="space-y-2">
                {['shorter', 'longer', 'concise'].map(length => (
                  <button
                    key={length}
                    onClick={() => quickEnhance('length', length)}
                    disabled={quickEnhancing === 'length'}
                    className="w-full text-left p-2 glass glass-hover rounded-lg text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {quickEnhancing === 'length' ? (
                      <Loader className="w-4 h-4 animate-spin inline mr-2" />
                    ) : (
                      <BarChart3 className="w-4 h-4 inline mr-2" />
                    )}
                    Make {length}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Style Improvements */}
            <div>
              <h5 className="text-sm font-medium text-purple-300 mb-2">Style Improvements</h5>
              <div className="space-y-2">
                <button
                  onClick={() => quickEnhance('style', {
                    sentence_structure: 'varied',
                    vocabulary: 'balanced',
                    active_voice: true,
                    add_transitions: true
                  })}
                  disabled={quickEnhancing === 'style'}
                  className="w-full text-left p-2 glass glass-hover rounded-lg text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  {quickEnhancing === 'style' ? (
                    <Loader className="w-4 h-4 animate-spin inline mr-2" />
                  ) : (
                    <Wand2 className="w-4 h-4 inline mr-2" />
                  )}
                  Improve Flow
                </button>
                
                <button
                  onClick={() => quickEnhance('style', {
                    sentence_structure: 'short',
                    vocabulary: 'simple',
                    remove_jargon: true
                  })}
                  disabled={quickEnhancing === 'style'}
                  className="w-full text-left p-2 glass glass-hover rounded-lg text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  {quickEnhancing === 'style' ? (
                    <Loader className="w-4 h-4 animate-spin inline mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                  )}
                  Simplify
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* AI Suggestions */}
      {suggestions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              AI Suggestions
            </h4>
            {loadingSuggestions && (
              <Loader className="w-4 h-4 animate-spin text-purple-400" />
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Engagement Suggestions */}
            {suggestions.engagement && suggestions.engagement.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-green-300 mb-2 flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Engagement
                </h5>
                <div className="space-y-2">
                  {suggestions.engagement.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => applySuggestion({ type: 'engagement', text: suggestion })}
                      className="w-full text-left p-3 bg-black/20 hover:bg-black/40 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-2 text-green-400" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Readability Suggestions */}
            {suggestions.readability && suggestions.readability.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Readability
                </h5>
                <div className="space-y-2">
                  {suggestions.readability.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => applySuggestion({ type: 'readability', text: suggestion })}
                      className="w-full text-left p-3 bg-black/20 hover:bg-black/40 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-2 text-blue-400" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Content Merge Options */}
      {contentHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <Merge className="w-5 h-5 text-green-400" />
              Merge with Previous Content
            </h4>
            <button
              onClick={() => setShowMergeOptions(!showMergeOptions)}
              className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {showMergeOptions && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-40 overflow-y-auto">
                {contentHistory.slice(0, 6).map((item, index) => (
                  <label key={index} className="flex items-start gap-2 p-3 bg-black/20 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedHistoryItems.includes(item)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHistoryItems(prev => [...prev, item]);
                        } else {
                          setSelectedHistoryItems(prev => prev.filter(i => i !== item));
                        }
                      }}
                      className="mt-1 text-purple-500 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white truncate">
                        {item.content?.substring(0, 60)}...
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.content_type} • {item.content?.split(' ').length} words
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {selectedHistoryItems.length > 0 && (
                <button
                  onClick={mergeWithSelected}
                  className="w-full btn-cosmic text-white font-medium rounded-lg py-2"
                >
                  <Merge className="w-4 h-4 inline mr-2" />
                  Merge {selectedHistoryItems.length} Selected Items
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}
      
      {/* Enhancement History */}
      {enhancementHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Enhancement History
          </h4>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {enhancementHistory.map((enhancement) => (
              <div key={enhancement.id} className="p-3 bg-black/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-300 capitalize">
                    {enhancement.type} Enhancement
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(enhancement.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {enhancement.metrics && (
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Words: {enhancement.metrics.original_word_count} → {enhancement.metrics.enhanced_word_count}</span>
                    {enhancement.metrics.word_count_change_percent && (
                      <span className={enhancement.metrics.word_count_change_percent > 0 ? 'text-green-400' : 'text-red-400'}>
                        {enhancement.metrics.word_count_change_percent > 0 ? '+' : ''}{enhancement.metrics.word_count_change_percent}%
                      </span>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => setContent(enhancement.originalContent)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Revert to this version
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Advanced Content Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <ContentEditor
            initialContent={content}
            contentType={contentType}
            onSave={(newContent) => {
              setContent(newContent);
              setShowEditor(false);
            }}
            onClose={() => setShowEditor(false)}
            showMergeOption={contentHistory.length > 0}
            availableContentPieces={contentHistory}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedContentGenerator;