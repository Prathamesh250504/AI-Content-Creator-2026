import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { contentService, analyticsService } from '../services/api';
import authService from '../services/authService';
import { useUser } from './UserContext';

const ContentContext = createContext();

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

export const ContentProvider = ({ children }) => {
  const [generatedContent, setGeneratedContent] = useState([]);
  const [contentHistory, setContentHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useUser();
  const [statistics, setStatistics] = useState({
    total_entries: 0,
    total_words: 0,
    content_types: {},
    recent_entries: [],
    success_rate: 100,
    time_saved_hours: 0,
    avg_words_per_content: 0,
    content_this_month: 0
  });

  // Get current user ID (authenticated or default)
  const getCurrentUserId = () => {
    if (authService.isAuthenticated()) {
      const user = authService.getUser();
      return user?.user_id || 'default_user';
    }
    return localStorage.getItem('userId') || 'default_user';
  };

  const loadTemplates = useCallback(async () => {
    try {
      const templatesData = await contentService.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  const loadContentHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setContentHistory([]);
      return;
    }
    
    try {
      const userId = getCurrentUserId();
      console.log('Loading content history for user:', userId);
      
      const history = await contentService.getHistory(userId);
      
      // Ensure history is an array and has proper structure
      const validHistory = Array.isArray(history) ? history.map(entry => ({
        content_id: entry.id || entry.content_id || Date.now().toString(),
        content: entry.content || '',
        content_type: entry.template_used || entry.content_type || 'unknown',
        template_used: entry.template_used || entry.content_type || 'unknown',
        parameters: entry.parameters || {},
        timestamp: entry.timestamp || new Date().toISOString(),
        model_used: entry.model || entry.model_used || '',
        word_count: entry.word_count || (entry.content ? entry.content.split(' ').length : 0),
        version: entry.version || 1,
        favorite: entry.favorite || false
      })) : [];
      
      console.log('Loaded content history:', validHistory.length, 'entries');
      setContentHistory(validHistory);
    } catch (error) {
      console.error('Failed to load content history:', error);
      // Only show error if it's not an auth error
      if (error.response?.status !== 401) {
        setContentHistory([]);
      }
    }
  }, [isAuthenticated]);

  const loadStatistics = useCallback(async () => {
    if (!isAuthenticated) {
      setStatistics({
        total_entries: 0,
        total_words: 0,
        content_types: {},
        recent_entries: [],
        success_rate: 100,
        time_saved_hours: 0,
        avg_words_per_content: 0,
        content_this_month: 0
      });
      return;
    }
    
    try {
      const userId = getCurrentUserId();
      console.log('Loading statistics for user:', userId);
      
      const stats = await analyticsService.getDashboardStats(userId);
      console.log('Loaded statistics:', stats);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Only show error if it's not an auth error
      if (error.response?.status !== 401) {
        // Set default values on error
        setStatistics({
          total_entries: 0,
          total_words: 0,
          content_types: {},
          recent_entries: [],
          success_rate: 100,
          time_saved_hours: 0,
          avg_words_per_content: 0,
          content_this_month: 0
        });
      }
    }
  }, [isAuthenticated]);

  // Reload data when authentication state changes
  const reloadUserData = useCallback(async () => {
    console.log('Reloading user data...');
    await loadContentHistory();
    await loadStatistics();
  }, [loadContentHistory, loadStatistics]);

  useEffect(() => {
    loadTemplates(); // Templates don't require auth
    if (isAuthenticated) {
      loadContentHistory(); // Only load user data when authenticated
      loadStatistics();
    }
  }, [loadTemplates, loadContentHistory, loadStatistics, isAuthenticated]);

  // Listen for authentication changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Authentication state changed, reloading data...');
      reloadUserData();
    };

    // Listen for custom auth events
    window.addEventListener('auth-state-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, [reloadUserData]);

  const generateContent = async (templateKey, userPrompt, parameters) => {
    try {
      setLoading(true);
      
      // Always use the main generate endpoint which handles all model selection types
      const result = await contentService.generateContent(templateKey, userPrompt, parameters);
      
      if (result.success) {
        const newContent = {
          id: Date.now(),
          content: result.content,
          template_used: result.template_used || templateKey,
          content_type: result.template_used || templateKey,
          parameters,
          timestamp: new Date().toISOString(),
          model: result.model || result.model_info?.model_name || 'Unknown',
          model_info: result.model_info || result.metadata || {},
          word_count: result.content ? result.content.split(' ').length : 0
        };
        
        console.log('Adding new content to state:', newContent);
        setGeneratedContent(prev => {
          const updated = [newContent, ...prev];
          console.log('Updated generated content array:', updated);
          return updated;
        });
        
        // Reload history and statistics
        await loadContentHistory();
        await loadStatistics();
        
        // Show success notification with model info
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('show-content-generated', {
            detail: { 
              contentType: templateKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              wordCount: newContent.word_count,
              model: newContent.model,
              mode: parameters.content_mode || 'default'
            }
          }));
        }, 100);
        
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      
      // Show error notification
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('show-content-error', {
          detail: { error: error.message }
        }));
      }, 100);
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateAdvancedContent = async (requestData) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/generate/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Handle different generation modes
        if (requestData.mode === 'ab_test') {
          // For A/B tests, don't add to generated content immediately
          // The user will choose the winner first
          return result;
        } else {
          // For standard and advanced modes, add to generated content
          const newContent = {
            id: Date.now(),
            content: result.content,
            template_used: result.template_name || result.template_id || 'advanced_template',
            content_type: result.template_name || result.template_id || 'advanced_template',
            parameters: requestData.parameters || {},
            timestamp: new Date().toISOString(),
            model: result.model_used || 'Unknown',
            model_info: result.model_info || {},
            word_count: result.word_count || 0,
            generation_mode: result.generation_mode || 'advanced'
          };
          
          setGeneratedContent(prev => [newContent, ...prev]);
          
          // Reload history and statistics
          await loadContentHistory();
          await loadStatistics();
          
          // Show success notification
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('show-content-generated', {
              detail: { 
                contentType: result.template_name || 'Advanced Template',
                wordCount: newContent.word_count,
                model: newContent.model,
                mode: result.generation_mode || 'advanced'
              }
            }));
          }, 100);
        }
        
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to generate advanced content:', error);
      
      // Show error notification
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('show-content-error', {
          detail: { error: error.message }
        }));
      }, 100);
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitABTestResult = async (testId, resultData) => {
    try {
      const response = await fetch(`/api/ab-tests/${testId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(resultData)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to submit A/B test result:', error);
      throw error;
    }
  };

  const addMergedContent = (mergedContent, mergeInfo) => {
    const newMergedContent = {
      id: `merged_${Date.now()}`,
      content: mergedContent,
      template_used: 'merged_content',
      content_type: 'merged_content',
      timestamp: new Date().toISOString(),
      word_count: mergedContent.split(' ').length,
      model: 'Content Merger',
      merged: true,
      merge_info: mergeInfo,
      parameters: {
        merge_style: mergeInfo.mergeStyle,
        original_pieces: mergeInfo.originalPieces,
        merge_timestamp: new Date().toISOString()
      }
    };
    
    console.log('Adding merged content to state:', newMergedContent);
    setGeneratedContent(prev => [newMergedContent, ...prev]);
    
    // Show success notification
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('show-content-generated', {
        detail: { 
          contentType: 'Merged Content',
          wordCount: newMergedContent.word_count,
          model: 'Content Merger',
          mode: 'merge'
        }
      }));
    }, 100);
    
    return newMergedContent;
  };

  const clearHistory = () => {
    console.log('Clearing generated content history');
    setGeneratedContent([]);
    toast.success('Generated content cleared');
  };

  const deleteHistoryEntry = async (entryId) => {
    try {
      await contentService.deleteHistoryEntry(entryId);
      await loadContentHistory();
      await loadStatistics();
    } catch (error) {
      console.error('Failed to delete history entry:', error);
      throw error;
    }
  };

  const exportHistory = async (format = 'json') => {
    try {
      let exportData;
      
      if (isAuthenticated) {
        // For authenticated users, don't pass userId (it's handled by the backend)
        exportData = await contentService.exportHistory(null, format);
      } else {
        // For non-authenticated users, use the current user ID
        const userId = getCurrentUserId();
        exportData = await contentService.exportHistory(userId, format);
      }
      
      return exportData;
    } catch (error) {
      console.error('Failed to export history:', error);
      throw error;
    }
  };

  return (
    <ContentContext.Provider value={{
      generatedContent,
      contentHistory,
      templates,
      statistics,
      loading,
      generateContent,
      generateAdvancedContent,
      submitABTestResult,
      addMergedContent,
      clearHistory,
      deleteHistoryEntry,
      exportHistory,
      loadContentHistory,
      loadStatistics,
      loadTemplates,
      reloadUserData
    }}>
      {children}
    </ContentContext.Provider>
  );
};