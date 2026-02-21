import axios from 'axios';
import authService from './authService';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // If REACT_APP_API_URL is explicitly set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check if we're accessing from a different host (mobile device)
  const currentHost = window.location.hostname;
  
  // If accessing from network IP (not localhost), use full backend URL
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    const backendHost = process.env.REACT_APP_BACKEND_HOST || currentHost;
    const backendPort = process.env.REACT_APP_BACKEND_PORT || '8000';
    return `http://${backendHost}:${backendPort}/api`;
  }
  
  // Default to relative URL for localhost (uses proxy)
  return '/api';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 120000, // 2 minutes timeout for content generation (especially for non-English languages)
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('API Service baseURL:', api.defaults.baseURL);
console.log('Current hostname:', window.location.hostname);

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid, clear auth
      authService.clearAuth();
      // Optionally redirect to login or show notification
      window.dispatchEvent(new CustomEvent('auth-expired'));
    }
    
    return Promise.reject(error);
  }
);

// Content Service
export const contentService = {
  // Generate content using template (main method - handles all cases)
  async generateContent(templateKey, userPrompt, parameters) {
    try {
      const requestData = {
        template_key: templateKey,
        user_prompt: userPrompt,
        parameters: parameters
      };

      // Add model selection if provided
      if (parameters.selected_model) {
        requestData.selected_model = parameters.selected_model;
      }
      if (parameters.content_mode) {
        requestData.content_mode = parameters.content_mode;
      }

      const response = await api.post('/generate', requestData);
      return response.data;
    } catch (error) {
      console.error('Generate content error:', error);
      
      // Better error handling
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something else happened
        throw new Error(error.message || 'Failed to generate content');
      }
    }
  },

  // Get available templates
  async getTemplates() {
    try {
      const response = await api.get('/templates');
      if (response.data.success) {
        return response.data.templates;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Fallback to default templates if API fails
      return [
        {
          key: 'linkedin_post',
          name: 'LinkedIn Post',
          description: 'Professional social media content for LinkedIn networking',
          tone_options: ['Professional', 'Thought Leadership', 'Inspirational', 'Educational', 'Personal'],
          length_options: ['Short (100-200 words)', 'Medium (200-400 words)', 'Long (400-600 words)'],
          required_fields: ['topic', 'key_message'],
          optional_fields: ['call_to_action', 'hashtags', 'target_audience']
        },
        {
          key: 'email_marketing',
          name: 'Email Marketing',
          description: 'Engaging email campaigns for marketing and outreach',
          tone_options: ['Professional', 'Friendly', 'Urgent', 'Informative', 'Persuasive'],
          length_options: ['Short (100-200 words)', 'Medium (200-400 words)', 'Long (400-600 words)'],
          required_fields: ['subject_line', 'main_message'],
          optional_fields: ['call_to_action', 'personalization', 'urgency_factor']
        },
        {
          key: 'blog_post',
          name: 'Blog Post',
          description: 'Comprehensive blog content for websites and publications',
          tone_options: ['Professional', 'Casual', 'Educational', 'Entertaining', 'Authoritative'],
          length_options: ['Short (300-500 words)', 'Medium (500-800 words)', 'Long (800-1200 words)'],
          required_fields: ['blog_topic', 'main_points'],
          optional_fields: ['target_audience', 'keywords', 'call_to_action']
        }
      ];
    }
  },

  // Get content history
  async getHistory(userId) {
    try {
      let response;
      
      // Use authenticated endpoint if user is logged in
      if (authService.isAuthenticated()) {
        response = await api.get('/auth/history');
      } else {
        // Fallback to user-specific endpoint
        response = await api.get(`/history/${userId}`);
      }
      
      if (response.data.success) {
        return response.data.history;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  },

  // Get statistics
  async getStatistics(userId) {
    try {
      let response;
      
      // Use authenticated endpoint if user is logged in
      if (authService.isAuthenticated()) {
        response = await api.get('/auth/statistics');
      } else {
        // Fallback to user-specific endpoint
        response = await api.get(`/statistics/${userId}`);
      }
      
      if (response.data.success) {
        return response.data.statistics;
      } else {
        return {
          total_entries: 0,
          total_words: 0,
          content_types: {},
          recent_entries: []
        };
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      return {
        total_entries: 0,
        total_words: 0,
        content_types: {},
        recent_entries: []
      };
    }
  },

  // Delete history entry
  async deleteHistoryEntry(entryId) {
    try {
      await api.delete(`/history/${entryId}`);
    } catch (error) {
      throw new Error('Failed to delete history entry');
    }
  },

  // Export history
  async exportHistory(userId, format = 'json') {
    try {
      let response;
      
      // Use authenticated endpoint if user is logged in
      if (authService.isAuthenticated()) {
        response = await api.get(`/auth/export?format=${format}`);
      } else {
        // Fallback to user-specific endpoint (for backward compatibility)
        response = await api.get(`/export/${userId}?format=${format}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('Export history error:', error);
      
      // Better error handling
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something else happened
        throw new Error(error.message || 'Failed to export history');
      }
    }
  }
};

// Enhanced Profile Management Service
export const profileService = {
  // Create new user profile
  async createProfile(userId, profileData = {}) {
    try {
      const response = await api.post('/profile/create', {
        user_id: userId,
        profile_data: profileData
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create profile');
    }
  },

  // Get user profile with enhanced data
  async getUserProfile(userId) {
    try {
      const response = await api.get(`/profile/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get profile');
    }
  },

  // Get user preferences
  async getUserPreferences(userId) {
    try {
      const response = await api.get(`/profile/${userId}/preferences`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get preferences');
    }
  },

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const response = await api.put(`/profile/${userId}/preferences`, {
        preferences
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update preferences');
    }
  },

  // Delete user profile
  async deleteProfile(userId) {
    try {
      const response = await api.delete(`/profile/${userId}/delete`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete profile');
    }
  },

  // Get all user profiles (admin)
  async getAllProfiles() {
    try {
      const response = await api.get('/profiles');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get profiles');
    }
  },

  // Get user analytics
  async getUserAnalytics(userId) {
    try {
      const response = await api.get(`/profile/${userId}/analytics`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get analytics');
    }
  },

  // Apply preferences to parameters
  async applyPreferencesToParameters(userId, parameters) {
    try {
      const response = await api.post(`/profile/${userId}/apply-preferences`, {
        parameters
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to apply preferences');
    }
  },

  // Get database status
  async getDatabaseStatus() {
    try {
      const response = await api.get('/database/status');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get database status');
    }
  }
};

// User Service (updated with enhanced methods)
export const userService = {
  // Get user profile
  async getProfile(userId) {
    try {
      const response = await profileService.getUserProfile(userId);
      if (response.success) {
        return response.profile;
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Return default profile if API fails
      return {
        user_id: userId,
        preferences: {
          // Personal Information
          name: '',
          email: '',
          company: '',
          role: '',
          
          // Content Preferences
          default_tone: 'professional',
          default_writing_style: 'formal',
          default_industry: 'technology',
          default_audience: 'professionals',
          default_content_length: 'medium',
          
          // Advanced Preferences
          preferred_cta_style: 'strong',
          default_urgency_level: 'medium',
          personalization_level: 'medium',
          include_keywords_by_default: false,
          default_geographic_region: 'global',
          
          // UI Preferences
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          notifications_enabled: true,
          
          // Content Generation Settings
          auto_save_content: true,
          show_generation_tips: true,
          enable_advanced_parameters: true,
          default_template: 'linkedin_post',
          
          // Privacy Settings
          data_retention_days: 365,
          analytics_enabled: true,
          share_usage_data: false
        }
      };
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const response = await api.post('/profile', { user_id: userId, ...updates });
      if (response.data.success) {
        return response.data.profile;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  },

  // Update user preferences
  async updatePreferences(userId, preferences) {
    try {
      const response = await profileService.updateUserPreferences(userId, preferences);
      return response;
    } catch (error) {
      throw new Error('Failed to update preferences');
    }
  },

  // Get user preferences
  async getPreferences(userId) {
    try {
      const response = await profileService.getUserPreferences(userId);
      return response.preferences;
    } catch (error) {
      throw new Error('Failed to get preferences');
    }
  }
};

// Analytics Service
export const analyticsService = {
  // Get comprehensive analytics for user
  async getUserAnalytics(userId) {
    try {
      let response;
      
      // Use authenticated endpoint if user is logged in
      if (authService.isAuthenticated()) {
        response = await api.get('/auth/statistics');
      } else {
        // Fallback to user-specific endpoint
        response = await api.get(`/analytics?user_id=${userId}`);
      }
      
      if (response.data.success) {
        return response.data.statistics;
      } else {
        return {
          total_entries: 0,
          total_words: 0,
          content_types: {},
          recent_entries: [],
          success_rate: 100,
          time_saved_hours: 0,
          avg_words_per_content: 0,
          most_used_template: 'N/A',
          content_this_month: 0,
          words_this_month: 0
        };
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      return {
        total_entries: 0,
        total_words: 0,
        content_types: {},
        recent_entries: [],
        success_rate: 100,
        time_saved_hours: 0,
        avg_words_per_content: 0,
        most_used_template: 'N/A',
        content_this_month: 0,
        words_this_month: 0
      };
    }
  },

  // Get real-time dashboard stats
  async getDashboardStats(userId) {
    try {
      let response;
      
      // Use authenticated endpoint if user is logged in
      if (authService.isAuthenticated()) {
        response = await api.get('/auth/statistics');
      } else {
        // Fallback to user-specific endpoint
        response = await api.get(`/analytics?user_id=${userId}`);
      }
      
      if (response.data.success) {
        const stats = response.data.statistics;
        
        // Calculate derived metrics
        const avgWordsPerContent = stats.total_entries > 0 
          ? Math.round(stats.total_words / stats.total_entries) 
          : 0;
        
        const timeSavedHours = Math.round(stats.total_entries * 0.5); // Assume 30 min saved per content
        
        return {
          total_entries: stats.total_entries || 0,
          total_words: stats.total_words || 0,
          content_types: stats.content_types || {},
          recent_activity: stats.recent_entries?.length || 0,
          success_rate: 100, // Assume 100% for now
          time_saved_hours: timeSavedHours,
          avg_words_per_content: avgWordsPerContent,
          content_this_month: stats.total_entries || 0, // For now, use total entries
          recent_entries: stats.recent_entries || []
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      // Return fallback stats
      return {
        total_entries: 0,
        total_words: 0,
        content_types: {},
        recent_activity: 0,
        success_rate: 100,
        time_saved_hours: 0,
        avg_words_per_content: 0,
        content_this_month: 0,
        recent_entries: []
      };
    }
  }
};

// Model Service
export const modelService = {
  // Get available models
  async getAvailableModels() {
    try {
      const response = await api.get('/models/available');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get available models');
    }
  },

  // Get model recommendations
  async getModelRecommendations(contentType, userPreferences = {}) {
    try {
      const response = await api.post('/models/recommendations', {
        content_type: contentType,
        user_preferences: userPreferences
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get model recommendations');
    }
  },

  // Get model health status
  async getModelHealth() {
    try {
      const response = await api.get('/models/health');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get model health');
    }
  },

  // Get content modes
  async getContentModes() {
    try {
      const response = await api.get('/models/modes');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get content modes');
    }
  }
};

export default api;

// Export all services
export const apiService = {
  ...contentService,
  ...userService,
  ...profileService,
  ...analyticsService,
  ...modelService
};