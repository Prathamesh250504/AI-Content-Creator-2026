import authService from './authService';

class ContentEnhancementService {
  constructor() {
    this.baseURL = '/api/content';
  }

  async enhanceTone(content, targetTone, contentType = 'general') {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.baseURL}/enhance/tone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          target_tone: targetTone,
          content_type: contentType
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance tone');
      }

      return data;
    } catch (error) {
      console.error('Error enhancing tone:', error);
      throw error;
    }
  }

  async enhanceLength(content, targetLength, contentType = 'general') {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.baseURL}/enhance/length`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          target_length: targetLength,
          content_type: contentType
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance length');
      }

      return data;
    } catch (error) {
      console.error('Error enhancing length:', error);
      throw error;
    }
  }

  async enhanceStyle(content, stylePreferences) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.baseURL}/enhance/style`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          style_preferences: stylePreferences
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance style');
      }

      return data;
    } catch (error) {
      console.error('Error enhancing style:', error);
      throw error;
    }
  }

  async getSuggestions(content, contentType = 'general') {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.baseURL}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          content_type: contentType
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      return data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }

  async applySuggestion(content, suggestion) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.baseURL}/apply-suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          suggestion
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply suggestion');
      }

      return data;
    } catch (error) {
      console.error('Error applying suggestion:', error);
      throw error;
    }
  }

  async mergeContent(contentPieces, mergeStyle = 'cohesive') {
    try {
      const token = authService.getToken();
      const response = await fetch(`${this.baseURL}/merge`, {
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
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to merge content');
      }

      return data;
    } catch (error) {
      console.error('Error merging content:', error);
      throw error;
    }
  }

  // Utility methods for content analysis
  analyzeContent(content) {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Simple readability score calculation
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgSentencesPerParagraph = paragraphs.length > 0 ? sentences.length / paragraphs.length : 0;
    
    // Count engagement indicators
    const questions = (content.match(/\?/g) || []).length;
    const exclamations = (content.match(/!/g) || []).length;
    const emojis = (content.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    
    // Detect call-to-action patterns
    const ctaPatterns = [
      /\b(click|tap|visit|download|subscribe|sign up|register|join|buy|purchase|order|contact|call|email)\b/gi,
      /\b(learn more|find out|discover|explore|get started|try now|book now|apply now)\b/gi,
      /\b(don't miss|act now|limited time|hurry|today only)\b/gi
    ];
    
    const hasCTA = ctaPatterns.some(pattern => pattern.test(content));
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 10) / 10,
      readabilityScore: this.calculateReadabilityScore(avgWordsPerSentence, words),
      engagementIndicators: {
        questions,
        exclamations,
        emojis,
        hasCTA
      },
      estimatedReadingTime: Math.ceil(words.length / 200) // Assuming 200 words per minute
    };
  }

  calculateReadabilityScore(avgWordsPerSentence, words) {
    // Simple readability score based on sentence length and word complexity
    const complexWords = words.filter(word => word.length > 6).length;
    const complexityRatio = words.length > 0 ? complexWords / words.length : 0;
    
    // Score from 0-100 (higher is more readable)
    const score = Math.max(0, 100 - (avgWordsPerSentence * 2) - (complexityRatio * 50));
    return Math.round(score * 10) / 10;
  }

  getReadabilityLevel(score) {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-400' };
    if (score >= 80) return { level: 'Easy', color: 'text-green-300' };
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-400' };
    if (score >= 60) return { level: 'Standard', color: 'text-yellow-300' };
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-orange-400' };
    if (score >= 30) return { level: 'Difficult', color: 'text-red-400' };
    return { level: 'Very Difficult', color: 'text-red-500' };
  }

  // Content enhancement presets
  getEnhancementPresets() {
    return {
      tones: [
        { value: 'professional', label: 'Professional', icon: '💼', description: 'Formal and business-appropriate' },
        { value: 'casual', label: 'Casual', icon: '😊', description: 'Friendly and conversational' },
        { value: 'friendly', label: 'Friendly', icon: '🤝', description: 'Warm and approachable' },
        { value: 'authoritative', label: 'Authoritative', icon: '🎯', description: 'Confident and expert-level' },
        { value: 'enthusiastic', label: 'Enthusiastic', icon: '🚀', description: 'Energetic and exciting' },
        { value: 'empathetic', label: 'Empathetic', icon: '❤️', description: 'Understanding and compassionate' },
        { value: 'humorous', label: 'Humorous', icon: '😄', description: 'Light and entertaining' },
        { value: 'urgent', label: 'Urgent', icon: '⚡', description: 'Action-oriented and pressing' }
      ],
      lengths: [
        { value: 'shorter', label: 'Make Shorter', icon: '📝', description: 'Reduce by 30-50%' },
        { value: 'longer', label: 'Make Longer', icon: '📄', description: 'Expand by 30-50%' },
        { value: 'concise', label: 'More Concise', icon: '🎯', description: 'Remove unnecessary words' },
        { value: 'detailed', label: 'More Detailed', icon: '📋', description: 'Add explanations and examples' }
      ],
      mergeStyles: [
        { value: 'cohesive', label: 'Cohesive Flow', description: 'Blend pieces smoothly together' },
        { value: 'sequential', label: 'Sequential', description: 'Combine in logical order' },
        { value: 'integrated', label: 'Integrated', description: 'Merge key points into unified piece' },
        { value: 'summary', label: 'Summary', description: 'Create comprehensive summary' }
      ]
    };
  }

  // Validation helpers
  validateContent(content) {
    const errors = [];
    const warnings = [];

    if (!content || content.trim().length === 0) {
      errors.push('Content cannot be empty');
      return { isValid: false, errors, warnings };
    }

    if (content.length < 10) {
      warnings.push('Content is very short');
    }

    if (content.length > 10000) {
      warnings.push('Content is very long and may take time to process');
    }

    const analysis = this.analyzeContent(content);
    
    if (analysis.avgWordsPerSentence > 25) {
      warnings.push('Sentences are quite long - consider breaking them up');
    }

    if (analysis.readabilityScore < 30) {
      warnings.push('Content may be difficult to read');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      analysis
    };
  }
}

const contentEnhancementService = new ContentEnhancementService();
export default contentEnhancementService;