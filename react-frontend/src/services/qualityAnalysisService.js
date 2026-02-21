/**
 * Content Quality Analysis Service
 * Handles API calls for content quality analysis
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class QualityAnalysisService {
  /**
   * Analyze content quality with comprehensive metrics
   */
  async analyzeContentQuality(content, contentType = 'general') {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/quality`, {
        content,
        content_type: contentType
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze readability metrics only
   */
  async analyzeReadability(content) {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/readability`, {
        content
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze sentiment
   */
  async analyzeSentiment(content) {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/sentiment`, {
        content
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze engagement potential
   */
  async analyzeEngagement(content, contentType = 'general') {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/engagement`, {
        content,
        content_type: contentType
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze keyword density
   */
  async analyzeKeywords(content) {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/keywords`, {
        content
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze content structure
   */
  async analyzeStructure(content) {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/structure`, {
        content
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get improvement suggestions
   */
  async getImprovementSuggestions(content, contentType = 'general', priority = null) {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/suggestions`, {
        content,
        content_type: contentType,
        priority
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze multiple content pieces for comparison
   */
  async analyzeBatch(contentList) {
    try {
      const response = await axios.post(`${API_BASE_URL}/analyze/batch`, {
        content_list: contentList
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze user's content history for trends
   */
  async analyzeUserHistory(userId, limit = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}/analyze/history/${userId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data.error || 'Analysis failed',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'Unable to connect to analysis service',
        status: 0,
        data: null
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'Unknown error occurred',
        status: -1,
        data: null
      };
    }
  }
}

const qualityAnalysisService = new QualityAnalysisService();
export default qualityAnalysisService;