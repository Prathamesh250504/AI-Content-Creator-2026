import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Wand2,
  RotateCcw,
  RotateCw,
  Save,
  Copy,
  Eye,
  Lightbulb,
  Merge,
  Palette,
  Type,
  Zap,
  Target,
  Smile,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw,
  Settings
} from 'lucide-react';
import authService from '../services/authService';

const ContentEditor = ({ 
  initialContent = '', 
  contentType = 'general',
  onSave,
  onClose,
  showMergeOption = false,
  availableContentPieces = []
}) => {
  // Editor state
  const [content, setContent] = useState(initialContent);
  const [originalContent] = useState(initialContent);
  const [history, setHistory] = useState([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isModified, setIsModified] = useState(false);
  
  // Enhancement state
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [applyingSuggestion, setApplyingSuggestion] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  
  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showEnhancementPanel, setShowEnhancementPanel] = useState(false);
  const [showMergePanel, setShowMergePanel] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  
  // Enhancement options
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedLength, setSelectedLength] = useState('');
  const [stylePreferences, setStylePreferences] = useState({
    sentence_structure: 'varied',
    vocabulary: 'balanced',
    active_voice: true,
    remove_jargon: false,
    add_transitions: true
  });
  
  // Merge options
  const [selectedPieces, setSelectedPieces] = useState([]);
  const [mergeStyle, setMergeStyle] = useState('cohesive');
  
  const textareaRef = useRef(null);
  
  // Tone options
  const toneOptions = [
    { value: 'professional', label: 'Professional', icon: '💼' },
    { value: 'casual', label: 'Casual', icon: '😊' },
    { value: 'friendly', label: 'Friendly', icon: '🤝' },
    { value: 'authoritative', label: 'Authoritative', icon: '🎯' },
    { value: 'enthusiastic', label: 'Enthusiastic', icon: '🚀' },
    { value: 'empathetic', label: 'Empathetic', icon: '❤️' },
    { value: 'humorous', label: 'Humorous', icon: '😄' },
    { value: 'urgent', label: 'Urgent', icon: '⚡' }
  ];
  
  // Length options
  const lengthOptions = [
    { value: 'shorter', label: 'Make Shorter', icon: '📝' },
    { value: 'longer', label: 'Make Longer', icon: '📄' },
    { value: 'concise', label: 'More Concise', icon: '🎯' },
    { value: 'detailed', label: 'More Detailed', icon: '📋' }
  ];
  
  // Merge style options
  const mergeStyleOptions = [
    { value: 'cohesive', label: 'Cohesive Flow', description: 'Blend pieces smoothly' },
    { value: 'sequential', label: 'Sequential', description: 'Combine in order' },
    { value: 'integrated', label: 'Integrated', description: 'Merge key points' },
    { value: 'summary', label: 'Summary', description: 'Create unified summary' }
  ];
  
  // Update history when content changes
  const updateHistory = useCallback((newContent) => {
    if (newContent !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setIsModified(newContent !== originalContent);
    }
  }, [history, historyIndex, originalContent]);
  
  // Handle content change
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateHistory(newContent);
  };
  
  // Undo/Redo functionality
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      setIsModified(history[newIndex] !== originalContent);
    }
  };
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      setIsModified(history[newIndex] !== originalContent);
    }
  };
  
  // Load enhancement suggestions
  const loadSuggestions = useCallback(async () => {
    if (!content.trim()) return;
    
    setLoadingSuggestions(true);
    try {
      const token = authService.getToken();
      const response = await fetch('/api/content/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          content_type: contentType
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        console.error('Failed to load suggestions:', data.error);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [content, contentType]);
  
  // Apply enhancement suggestion
  const applySuggestion = async (suggestion) => {
    setApplyingSuggestion(suggestion);
    try {
      const token = authService.getToken();
      const response = await fetch('/api/content/apply-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          suggestion: suggestion
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setContent(data.enhanced_content);
        updateHistory(data.enhanced_content);
        // Reload suggestions for the new content
        setTimeout(loadSuggestions, 500);
      } else {
        console.error('Failed to apply suggestion:', data.error);
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
    } finally {
      setApplyingSuggestion(null);
    }
  };
  
  // Enhance tone
  const enhanceTone = async (tone) => {
    if (!content.trim() || !tone) return;
    
    setEnhancing(true);
    try {
      const token = authService.getToken();
      const response = await fetch('/api/content/enhance/tone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          target_tone: tone,
          content_type: contentType
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setContent(data.enhanced_content);
        updateHistory(data.enhanced_content);
        setSelectedTone('');
        // Reload suggestions
        setTimeout(loadSuggestions, 500);
      } else {
        console.error('Failed to enhance tone:', data.error);
      }
    } catch (error) {
      console.error('Error enhancing tone:', error);
    } finally {
      setEnhancing(false);
    }
  };
  
  // Enhance length
  const enhanceLength = async (length) => {
    if (!content.trim() || !length) return;
    
    setEnhancing(true);
    try {
      const token = authService.getToken();
      const response = await fetch('/api/content/enhance/length', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          target_length: length,
          content_type: contentType
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setContent(data.enhanced_content);
        updateHistory(data.enhanced_content);
        setSelectedLength('');
        // Reload suggestions
        setTimeout(loadSuggestions, 500);
      } else {
        console.error('Failed to enhance length:', data.error);
      }
    } catch (error) {
      console.error('Error enhancing length:', error);
    } finally {
      setEnhancing(false);
    }
  };
  
  // Enhance style
  const enhanceStyle = async () => {
    if (!content.trim()) return;
    
    setEnhancing(true);
    try {
      const token = authService.getToken();
      const response = await fetch('/api/content/enhance/style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          style_preferences: stylePreferences
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setContent(data.enhanced_content);
        updateHistory(data.enhanced_content);
        setShowStylePanel(false);
        // Reload suggestions
        setTimeout(loadSuggestions, 500);
      } else {
        console.error('Failed to enhance style:', data.error);
      }
    } catch (error) {
      console.error('Error enhancing style:', error);
    } finally {
      setEnhancing(false);
    }
  };
  
  // Merge content pieces
  const mergeContent = async () => {
    if (selectedPieces.length < 1) return;
    
    const contentPieces = [
      { content: content, content_type: contentType },
      ...selectedPieces
    ];
    
    setEnhancing(true);
    try {
      const token = authService.getToken();
      const response = await fetch('/api/content/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content_pieces: contentPieces,
          merge_style: mergeStyle
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setContent(data.merged_content);
        updateHistory(data.merged_content);
        setShowMergePanel(false);
        setSelectedPieces([]);
        // Reload suggestions
        setTimeout(loadSuggestions, 500);
      } else {
        console.error('Failed to merge content:', data.error);
      }
    } catch (error) {
      console.error('Error merging content:', error);
    } finally {
      setEnhancing(false);
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
  
  // Load suggestions on content change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim() && content !== initialContent) {
        loadSuggestions();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [content, initialContent, loadSuggestions]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:left-[280px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Edit3 className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Content Editor</h2>
            {isModified && (
              <span className="px-2 py-1 bg-yellow-600/30 text-yellow-300 text-xs rounded-full">
                Modified
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-600 mx-2" />
            
            {/* View Toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white"
              title={showPreview ? "Edit Mode" : "Preview Mode"}
            >
              {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            {/* Copy */}
            <button
              onClick={copyToClipboard}
              className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white"
              title="Copy to Clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!isModified}
              className="px-4 py-2 btn-cosmic text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
            
            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex h-[calc(90vh-120px)]">
          {/* Main Editor */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-4 border-b border-gray-700 bg-gray-800/50">
              {/* Enhancement Toggle */}
              <button
                onClick={() => setShowEnhancementPanel(!showEnhancementPanel)}
                className={`p-2 rounded-lg transition-colors ${
                  showEnhancementPanel 
                    ? 'bg-purple-600 text-white' 
                    : 'glass glass-hover text-gray-400 hover:text-white'
                }`}
                title="AI Suggestions"
              >
                <Lightbulb className="w-4 h-4" />
              </button>
              
              {/* Tone Enhancement */}
              <div className="relative">
                <select
                  value={selectedTone}
                  onChange={(e) => {
                    setSelectedTone(e.target.value);
                    if (e.target.value) {
                      enhanceTone(e.target.value);
                    }
                  }}
                  disabled={enhancing}
                  className="input-cosmic rounded-lg text-sm pr-8 appearance-none"
                >
                  <option value="">Adjust Tone</option>
                  {toneOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                <Palette className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Length Enhancement */}
              <div className="relative">
                <select
                  value={selectedLength}
                  onChange={(e) => {
                    setSelectedLength(e.target.value);
                    if (e.target.value) {
                      enhanceLength(e.target.value);
                    }
                  }}
                  disabled={enhancing}
                  className="input-cosmic rounded-lg text-sm pr-8 appearance-none"
                >
                  <option value="">Adjust Length</option>
                  {lengthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                <Type className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Style Enhancement */}
              <button
                onClick={() => setShowStylePanel(!showStylePanel)}
                disabled={enhancing}
                className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
                title="Style Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              {/* Merge Content */}
              {showMergeOption && availableContentPieces.length > 0 && (
                <button
                  onClick={() => setShowMergePanel(!showMergePanel)}
                  disabled={enhancing}
                  className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
                  title="Merge Content"
                >
                  <Merge className="w-4 h-4" />
                </button>
              )}
              
              {/* Refresh Suggestions */}
              <button
                onClick={loadSuggestions}
                disabled={loadingSuggestions || !content.trim()}
                className="p-2 glass glass-hover rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
                title="Refresh Suggestions"
              >
                {loadingSuggestions ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
              
              {enhancing && (
                <div className="flex items-center gap-2 text-purple-400">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Enhancing...</span>
                </div>
              )}
            </div>
            
            {/* Content Area */}
            <div className="flex-1 p-4">
              {showPreview ? (
                /* Preview Mode */
                <div className="h-full glass rounded-lg p-4 overflow-y-auto">
                  <div className="prose prose-invert max-w-none">
                    {content.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-300 leading-relaxed">
                        {paragraph || '\u00A0'}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start editing your content..."
                  className="w-full h-full input-cosmic rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ minHeight: '400px' }}
                />
              )}
            </div>
          </div>
          
          {/* Side Panels */}
          <AnimatePresence>
            {/* Enhancement Suggestions Panel */}
            {showEnhancementPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-gray-700 bg-gray-800/50 overflow-hidden"
              >
                <div className="p-4 h-full overflow-y-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    AI Suggestions
                  </h3>
                  
                  {loadingSuggestions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="w-6 h-6 animate-spin text-purple-400" />
                    </div>
                  ) : suggestions ? (
                    <div className="space-y-4">
                      {/* Engagement Suggestions */}
                      {suggestions.engagement && suggestions.engagement.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            Engagement
                          </h4>
                          <div className="space-y-2">
                            {suggestions.engagement.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => applySuggestion({ type: 'engagement', text: suggestion })}
                                disabled={applyingSuggestion}
                                className="w-full text-left p-2 glass glass-hover rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                              >
                                {applyingSuggestion?.text === suggestion ? (
                                  <Loader className="w-4 h-4 animate-spin inline mr-2" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 inline mr-2 text-green-400" />
                                )}
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* CTA Suggestions */}
                      {suggestions.cta && suggestions.cta.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            Call-to-Action
                          </h4>
                          <div className="space-y-2">
                            {suggestions.cta.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => applySuggestion({ type: 'cta', text: suggestion })}
                                disabled={applyingSuggestion}
                                className="w-full text-left p-2 glass glass-hover rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                              >
                                {applyingSuggestion?.text === suggestion ? (
                                  <Loader className="w-4 h-4 animate-spin inline mr-2" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 inline mr-2 text-green-400" />
                                )}
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Emoji Suggestions */}
                      {suggestions.emojis && suggestions.emojis.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-1">
                            <Smile className="w-4 h-4" />
                            Emojis
                          </h4>
                          <div className="space-y-2">
                            {suggestions.emojis.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => applySuggestion({ 
                                  type: 'emoji', 
                                  emoji: suggestion.emoji,
                                  position: suggestion.position,
                                  text: `Add ${suggestion.emoji} ${suggestion.reason}`
                                })}
                                disabled={applyingSuggestion}
                                className="w-full text-left p-2 glass glass-hover rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                              >
                                {applyingSuggestion?.emoji === suggestion.emoji ? (
                                  <Loader className="w-4 h-4 animate-spin inline mr-2" />
                                ) : (
                                  <span className="inline mr-2 text-lg">{suggestion.emoji}</span>
                                )}
                                {suggestion.reason}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Readability Suggestions */}
                      {suggestions.readability && suggestions.readability.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" />
                            Readability
                          </h4>
                          <div className="space-y-2">
                            {suggestions.readability.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => applySuggestion({ type: 'readability', text: suggestion })}
                                disabled={applyingSuggestion}
                                className="w-full text-left p-2 glass glass-hover rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                              >
                                {applyingSuggestion?.text === suggestion ? (
                                  <Loader className="w-4 h-4 animate-spin inline mr-2" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 inline mr-2 text-green-400" />
                                )}
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Start editing to get AI suggestions</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Style Panel */}
            {showStylePanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-gray-700 bg-gray-800/50 overflow-hidden"
              >
                <div className="p-4 h-full overflow-y-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-400" />
                    Style Settings
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Sentence Structure */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sentence Structure
                      </label>
                      <select
                        value={stylePreferences.sentence_structure}
                        onChange={(e) => setStylePreferences(prev => ({
                          ...prev,
                          sentence_structure: e.target.value
                        }))}
                        className="w-full input-cosmic rounded-lg text-sm"
                      >
                        <option value="short">Short & Punchy</option>
                        <option value="varied">Varied Length</option>
                        <option value="long">Longer Sentences</option>
                      </select>
                    </div>
                    
                    {/* Vocabulary */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Vocabulary Level
                      </label>
                      <select
                        value={stylePreferences.vocabulary}
                        onChange={(e) => setStylePreferences(prev => ({
                          ...prev,
                          vocabulary: e.target.value
                        }))}
                        className="w-full input-cosmic rounded-lg text-sm"
                      >
                        <option value="simple">Simple & Clear</option>
                        <option value="balanced">Balanced</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    
                    {/* Checkboxes */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={stylePreferences.active_voice}
                          onChange={(e) => setStylePreferences(prev => ({
                            ...prev,
                            active_voice: e.target.checked
                          }))}
                          className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-300">Use Active Voice</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={stylePreferences.remove_jargon}
                          onChange={(e) => setStylePreferences(prev => ({
                            ...prev,
                            remove_jargon: e.target.checked
                          }))}
                          className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-300">Remove Jargon</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={stylePreferences.add_transitions}
                          onChange={(e) => setStylePreferences(prev => ({
                            ...prev,
                            add_transitions: e.target.checked
                          }))}
                          className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-300">Improve Transitions</span>
                      </label>
                    </div>
                    
                    {/* Apply Button */}
                    <button
                      onClick={enhanceStyle}
                      disabled={enhancing}
                      className="w-full btn-cosmic text-white font-medium rounded-lg py-2"
                    >
                      {enhancing ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin inline mr-2" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 inline mr-2" />
                          Apply Style
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Merge Panel */}
            {showMergePanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-gray-700 bg-gray-800/50 overflow-hidden"
              >
                <div className="p-4 h-full overflow-y-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Merge className="w-5 h-5 text-green-400" />
                    Merge Content
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Merge Style */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Merge Style
                      </label>
                      <div className="space-y-2">
                        {mergeStyleOptions.map(option => (
                          <label key={option.value} className="flex items-start gap-2">
                            <input
                              type="radio"
                              name="mergeStyle"
                              value={option.value}
                              checked={mergeStyle === option.value}
                              onChange={(e) => setMergeStyle(e.target.value)}
                              className="mt-1 text-purple-500 focus:ring-purple-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-white">{option.label}</div>
                              <div className="text-xs text-gray-400">{option.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Available Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Content to Merge
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableContentPieces.map((piece, index) => (
                          <label key={index} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedPieces.includes(piece)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPieces(prev => [...prev, piece]);
                                } else {
                                  setSelectedPieces(prev => prev.filter(p => p !== piece));
                                }
                              }}
                              className="mt-1 text-purple-500 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <div className="text-sm text-white truncate">
                                {piece.content?.substring(0, 50)}...
                              </div>
                              <div className="text-xs text-gray-400">
                                {piece.content_type} • {piece.content?.split(' ').length} words
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Merge Button */}
                    <button
                      onClick={mergeContent}
                      disabled={enhancing || selectedPieces.length === 0}
                      className="w-full btn-cosmic text-white font-medium rounded-lg py-2 disabled:opacity-50"
                    >
                      {enhancing ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin inline mr-2" />
                          Merging...
                        </>
                      ) : (
                        <>
                          <Merge className="w-4 h-4 inline mr-2" />
                          Merge Content
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ContentEditor;