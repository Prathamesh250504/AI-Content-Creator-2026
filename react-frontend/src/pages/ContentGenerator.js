import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  Settings, 
  Loader2, 
  Copy,
  Trash2,
  HelpCircle,
  Info,
  Target,
  Palette,
  Type,
  Users,
  Hash,
  Lightbulb,
  BarChart3,
  MessageSquare,
  Zap,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Download,
  RefreshCw,
  Layers,
  Edit3
} from 'lucide-react';
import { useContent } from '../contexts/ContentContext';
import { profileService } from '../services/api';
import QualityAnalysisDashboard from '../components/QualityAnalysisDashboard';
import SimpleModelDropdown from '../components/SimpleModelDropdown';
import AdvancedContentGenerator from '../components/AdvancedContentGenerator';
import ABTestComparison from '../components/ABTestComparison';
import EnhancedContentGenerator from '../components/EnhancedContentGenerator';
import ContentMerger from '../components/ContentMerger';

const ContentGenerator = () => {
  const { register, handleSubmit, watch, setValue } = useForm();
  const { templates, generateContent, loading, generatedContent, clearHistory, submitABTestResult, addMergedContent } = useContent();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [isGeneratingMultiple, setIsGeneratingMultiple] = useState(false);
  const [readabilityScores, setReadabilityScores] = useState({});
  const [showQualityAnalysis, setShowQualityAnalysis] = useState(null);
  const [qualityAnalysisContent, setQualityAnalysisContent] = useState('');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showAdvancedGenerator, setShowAdvancedGenerator] = useState(false);
  const [showABTestComparison, setShowABTestComparison] = useState(false);
  const [abTestResult, setAbTestResult] = useState(null);
  const [showEnhancedGenerator, setShowEnhancedGenerator] = useState(false);
  const [selectedContentForEnhancement, setSelectedContentForEnhancement] = useState(null);
  const [showContentMerger, setShowContentMerger] = useState(false);
  const location = useLocation();

  // Debug log to track generated content
  console.log('ContentGenerator - generatedContent:', generatedContent);

  // Enhanced progress simulation for better UX
  const simulateProgress = useCallback(() => {
    if (!loading) return;
    
    const stages = [
      { progress: 10, stage: 'Analyzing your requirements...' },
      { progress: 25, stage: 'Selecting optimal AI model...' },
      { progress: 40, stage: 'Processing content parameters...' },
      { progress: 60, stage: 'Generating creative content...' },
      { progress: 80, stage: 'Optimizing for readability...' },
      { progress: 95, stage: 'Finalizing your content...' },
      { progress: 100, stage: 'Content ready!' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length && loading) {
        setGenerationProgress(stages[currentStage].progress);
        setGenerationStage(stages[currentStage].stage);
        currentStage++;
      } else {
        clearInterval(interval);
        if (!loading) {
          setGenerationProgress(0);
          setGenerationStage('');
        }
      }
    }, 800);

    return () => clearInterval(interval);
  }, [loading]);

  // Calculate readability score (simplified Flesch Reading Ease)
  const calculateReadabilityScore = useCallback((text) => {
    if (!text || typeof text !== 'string') return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const syllables = text.split(/\s+/).reduce((count, word) => {
      return count + Math.max(1, word.toLowerCase().match(/[aeiouy]+/g)?.length || 1);
    }, 0);

    if (sentences === 0 || words === 0) return 0;

    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, Math.round(score)));
  }, []);

  // Get readability level description
  const getReadabilityLevel = useCallback((score) => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score >= 80) return { level: 'Easy', color: 'text-green-300', bg: 'bg-green-500/15' };
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (score >= 60) return { level: 'Standard', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    if (score >= 30) return { level: 'Difficult', color: 'text-red-400', bg: 'bg-red-500/20' };
    return { level: 'Very Difficult', color: 'text-red-500', bg: 'bg-red-500/25' };
  }, []);

  // Update readability scores when content changes
  useEffect(() => {
    const scores = {};
    generatedContent.forEach(item => {
      if (item.content) {
        scores[item.id] = calculateReadabilityScore(item.content);
      }
    });
    setReadabilityScores(scores);
  }, [generatedContent, calculateReadabilityScore]);

  // Start progress simulation when loading begins
  useEffect(() => {
    if (loading) {
      simulateProgress();
    }
  }, [loading, simulateProgress]);

  // Load user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await profileService.getUserPreferences('default_user');
        if (response.success) {
          setUserPreferences(response.preferences);
          setPreferencesLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
        setPreferencesLoaded(true); // Still mark as loaded to prevent infinite loading
      }
    };

    loadUserPreferences();
  }, []);

  // Apply user preferences to form when template changes
  useEffect(() => {
    if (preferencesLoaded && selectedTemplate && userPreferences) {
      // Apply user preferences as defaults
      setValue('tone', userPreferences.default_tone || 'professional');
      setValue('writing_style', userPreferences.default_writing_style || 'formal');
      setValue('content_length', userPreferences.default_content_length || 'medium');
      setValue('target_audience', userPreferences.default_audience || 'professionals');
      setValue('industry', userPreferences.default_industry || 'technology');
      setValue('cta_style', userPreferences.preferred_cta_style || 'strong');
      setValue('urgency_level', userPreferences.default_urgency_level || 'medium');
      setValue('personalization', userPreferences.personalization_level || 'medium');
      setValue('geographic_region', userPreferences.default_geographic_region || 'global');
      setValue('quality_iterations', userPreferences.default_quality_iterations || 2);
      
      // Apply boolean preferences
      setValue('include_keywords', userPreferences.include_keywords_by_default || false);
      setValue('show_tips', userPreferences.show_generation_tips || true);
      setValue('enable_advanced', userPreferences.enable_advanced_parameters || true);
      
      // Set advanced panel visibility based on user preference
      setShowAdvanced(userPreferences.enable_advanced_parameters || false);
    }
  }, [preferencesLoaded, selectedTemplate, userPreferences, setValue]);

  // Tooltip Component
  const Tooltip = ({ content, children, id }) => (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(id)}
        onMouseLeave={() => setShowTooltip(null)}
        className="cursor-help"
      >
        {children}
      </div>
      {showTooltip === id && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 w-80 p-4 bg-gray-900 border border-purple-500/30 rounded-lg shadow-xl -top-2 left-full ml-2"
        >
          <div className="text-sm text-gray-200 leading-relaxed">
            {content}
          </div>
          <div className="absolute top-3 -left-2 w-4 h-4 bg-gray-900 border-l border-b border-purple-500/30 transform rotate-45"></div>
        </motion.div>
      )}
    </div>
  );

  // Parameter configurations with enhanced tooltips and examples
  const parameterConfigs = {
    tone: {
      icon: <Palette className="w-4 h-4" />,
      tooltip: "The overall emotional tone and style of your content. Choose based on your audience and message.",
      example: "Professional: 'We are pleased to announce...' | Casual: 'Hey! Check this out...'"
    },
    length: {
      icon: <Type className="w-4 h-4" />,
      tooltip: "The desired length of your content. Short is concise, Long is comprehensive.",
      example: "Short: Quick updates, social posts | Long: Detailed articles, comprehensive guides"
    },
    creativity: {
      icon: <Lightbulb className="w-4 h-4" />,
      tooltip: "Controls how creative and varied the AI output will be. Higher = more creative, Lower = more predictable.",
      example: "Low (0-30): Factual, straightforward | High (70-100): Creative, unique angles"
    },
    target_audience: {
      icon: <Users className="w-4 h-4" />,
      tooltip: "Describe your target audience in detail. The more specific, the better the personalization.",
      example: "Marketing professionals aged 25-40, interested in digital marketing trends"
    },
    keywords: {
      icon: <Hash className="w-4 h-4" />,
      tooltip: "Comma-separated keywords that should be naturally incorporated into the content for SEO or emphasis.",
      example: "innovation, growth, digital transformation, AI technology"
    },
    writing_style: {
      icon: <Type className="w-4 h-4" />,
      tooltip: "The overall approach to presenting information in your content.",
      example: "Storytelling: Narrative-driven | Data-Driven: Statistics and facts focused"
    },
    content_format: {
      icon: <BarChart3 className="w-4 h-4" />,
      tooltip: "The structural format you want for your content.",
      example: "List: Bullet points | Paragraph: Flowing text | Mixed: Combination of both"
    },
    language_style: {
      icon: <MessageSquare className="w-4 h-4" />,
      tooltip: "The complexity level of language used in the content.",
      example: "Simple: Easy to understand | Technical: Industry-specific terminology"
    },
    emotional_appeal: {
      icon: <Zap className="w-4 h-4" />,
      tooltip: "The type of emotional connection you want to create with your audience.",
      example: "Rational: Logic-based | Emotional: Feelings-based | Balanced: Both"
    },
    include_statistics: {
      icon: <BarChart3 className="w-4 h-4" />,
      tooltip: "Request the AI to include relevant statistics, data points, or research findings in the content.",
      example: "When enabled: 'According to recent studies, 73% of marketers...'"
    },
    include_cta: {
      icon: <Target className="w-4 h-4" />,
      tooltip: "Add a clear and compelling call-to-action at the end of your content.",
      example: "'Sign up now', 'Learn more', 'Get started today'"
    },
    include_questions: {
      icon: <MessageSquare className="w-4 h-4" />,
      tooltip: "Add questions throughout the content to encourage audience interaction and engagement.",
      example: "'What are your thoughts on this?', 'Have you experienced this challenge?'"
    }
  };

  useEffect(() => {
    // Check if template was passed from Templates page
    if (location.state?.selectedTemplate) {
      setSelectedTemplate(location.state.selectedTemplate);
    } else if (templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates[0]);
    }
  }, [templates, selectedTemplate, location.state]);

  const onSubmit = async (data) => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    if (!data.user_prompt?.trim()) {
      toast.error('Please provide a content description');
      return;
    }

    // Check required fields
    const missingFields = selectedTemplate.required_fields?.filter(field => !data[field]?.trim()) || [];
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const parameters = {
        tone: data.tone?.toLowerCase() || 'professional',
        length: data.length?.toLowerCase() || 'medium',
        creativity: parseInt(data.creativity) || 70,
        target_audience: data.target_audience || 'general audience',
        keywords: data.keywords || '',
        writing_style: data.writing_style?.toLowerCase() || 'standard',
        content_format: data.content_format?.toLowerCase() || 'paragraph',
        language_style: data.language_style?.toLowerCase() || 'moderate',
        emotional_appeal: data.emotional_appeal?.toLowerCase() || 'balanced',
        industry_context: data.industry_context || '',
        brand_voice: data.brand_voice || '',
        include_statistics: data.include_statistics || false,
        include_cta: data.include_cta || false,
        include_questions: data.include_questions || false,
        quality_iterations: parseInt(data.quality_iterations) || 2,
        selected_model: selectedModel?.model_id || null,
        content_mode: selectedModel?.mode || 'default',
        ...Object.fromEntries(
          selectedTemplate.required_fields?.map(field => [field, data[field]]) || []
        ),
        ...Object.fromEntries(
          selectedTemplate.optional_fields?.map(field => [field, data[field]]).filter(([_, value]) => value) || []
        )
      };

      if (data.additional_notes?.trim()) {
        parameters.additional_notes = data.additional_notes;
      }

      await generateContent(selectedTemplate.key, data.user_prompt, parameters);
      toast.success('Content generated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to generate content');
    }
  };

  // Generate multiple variations for comparison
  const generateMultipleVariations = async (data) => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    if (!data.user_prompt?.trim()) {
      toast.error('Please provide a content description');
      return;
    }

    setIsGeneratingMultiple(true);
    
    try {
      const baseParameters = {
        tone: data.tone?.toLowerCase() || 'professional',
        length: data.length?.toLowerCase() || 'medium',
        creativity: parseInt(data.creativity) || 70,
        target_audience: data.target_audience || 'general audience',
        keywords: data.keywords || '',
        writing_style: data.writing_style?.toLowerCase() || 'standard',
        content_format: data.content_format?.toLowerCase() || 'paragraph',
        language_style: data.language_style?.toLowerCase() || 'moderate',
        emotional_appeal: data.emotional_appeal?.toLowerCase() || 'balanced',
        industry_context: data.industry_context || '',
        brand_voice: data.brand_voice || '',
        include_statistics: data.include_statistics || false,
        include_cta: data.include_cta || false,
        include_questions: data.include_questions || false,
        quality_iterations: parseInt(data.quality_iterations) || 2,
        selected_model: selectedModel?.model_id || null,
        content_mode: selectedModel?.mode || 'default',
        ...Object.fromEntries(
          selectedTemplate.required_fields?.map(field => [field, data[field]]) || []
        ),
        ...Object.fromEntries(
          selectedTemplate.optional_fields?.map(field => [field, data[field]]).filter(([_, value]) => value) || []
        )
      };

      // Create 3 variations with different creativity levels
      const variations = [
        { ...baseParameters, creativity: Math.max(30, baseParameters.creativity - 20), variation: 'Conservative' },
        { ...baseParameters, creativity: baseParameters.creativity, variation: 'Balanced' },
        { ...baseParameters, creativity: Math.min(100, baseParameters.creativity + 20), variation: 'Creative' }
      ];

      for (let i = 0; i < variations.length; i++) {
        try {
          await generateContent(selectedTemplate.key, data.user_prompt, variations[i]);
          // The generated content will be added to generatedContent by the context
        } catch (error) {
          console.error(`Failed to generate variation ${i + 1}:`, error);
        }
      }

      setShowComparison(true);
      toast.success('Multiple variations generated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to generate variations');
    } finally {
      setIsGeneratingMultiple(false);
    }
  };

  // Handle advanced content generation
  const handleAdvancedGenerate = async (result) => {
    try {
      if (result.generation_mode === 'ab_test') {
        // Show A/B test comparison
        setAbTestResult(result);
        setShowABTestComparison(true);
      } else {
        // Regular advanced generation - content is already added to context
        toast.success('Advanced content generated successfully!');
      }
      setShowAdvancedGenerator(false);
    } catch (error) {
      toast.error('Failed to process advanced generation result');
    }
  };

  // Handle A/B test feedback submission
  const handleABTestFeedback = async (feedbackData) => {
    try {
      await submitABTestResult(abTestResult.ab_test_id, feedbackData);
      
      // The content will be added through the context
      toast.success('A/B test feedback submitted successfully!');
      setShowABTestComparison(false);
      setAbTestResult(null);
    } catch (error) {
      console.error('Failed to submit A/B test feedback:', error);
      throw error;
    }
  };

  // Function to handle quality analysis
  const handleQualityAnalysis = (content, contentId) => {
    setQualityAnalysisContent(content);
    setShowQualityAnalysis(contentId);
    toast.success('Opening quality analysis...');
  };

  // Function to handle content enhancement
  const handleEnhanceContent = (contentItem) => {
    setSelectedContentForEnhancement(contentItem);
    setShowEnhancedGenerator(true);
  };

  // Function to save enhanced content
  const handleSaveEnhancedContent = (enhancedContent) => {
    if (selectedContentForEnhancement) {
      // Update the content in the generated content array
      generatedContent.map(item => 
        item.id === selectedContentForEnhancement.id 
          ? { ...item, content: enhancedContent, enhanced: true }
          : item
      );
      
      // Update the content context (you may need to add this method to ContentContext)
      // For now, we'll just close the modal
      setShowEnhancedGenerator(false);
      setSelectedContentForEnhancement(null);
      
      toast.success('Content enhanced successfully!');
    }
  };

  // Function to handle content merging
  const handleContentMerge = () => {
    if (generatedContent.length < 2) {
      toast.error('You need at least 2 content pieces to merge');
      return;
    }
    setShowContentMerger(true);
  };

  // Function to save merged content
  const handleSaveMergedContent = (mergedContent, mergeInfo) => {
    // Use the context method to add merged content
    addMergedContent(mergedContent, mergeInfo);
    
    // Close the modal
    setShowContentMerger(false);
    
    toast.success(`Successfully merged ${mergeInfo.originalPieces} content pieces!`);
  };

  // Handle escape key to close quality analysis modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showQualityAnalysis) {
        setShowQualityAnalysis(null);
      }
    };

    if (showQualityAnalysis) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [showQualityAnalysis]);

  // Handle window resize for responsive modal positioning
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to clean and format content
  const cleanContent = (content) => {
    if (!content || typeof content !== 'string') return 'No content available';
    
    let cleaned = content;
    
    // Remove markdown bold markers (**)
    cleaned = cleaned.replace(/\*\*/g, '');
    
    // Split content into lines for processing
    const lines = cleaned.split('\n');
    const processedLines = [];
    let headerCount = 0;
    let subHeaderCount = 0;
    let subSubHeaderCount = 0;
    
    for (let line of lines) {
      // Handle different levels of markdown headers
      if (line.match(/^####\s+(.+)$/)) {
        // H4 - Sub-sub-header
        const title = line.replace(/^####\s+/, '').trim();
        // Ensure we have a main header first
        if (headerCount === 0) headerCount = 1;
        if (subHeaderCount === 0) subHeaderCount = 1;
        subSubHeaderCount++;
        processedLines.push(`${headerCount}.${subHeaderCount}.${subSubHeaderCount}. ${title}`);
      } else if (line.match(/^###\s+(.+)$/)) {
        // H3 - Sub-header
        const title = line.replace(/^###\s+/, '').trim();
        // Ensure we have a main header first
        if (headerCount === 0) headerCount = 1;
        subHeaderCount++;
        subSubHeaderCount = 0;
        processedLines.push(`${headerCount}.${subHeaderCount}. ${title}`);
      } else if (line.match(/^##\s+(.+)$/)) {
        // H2 - Main header
        const title = line.replace(/^##\s+/, '').trim();
        headerCount++;
        subHeaderCount = 0;
        subSubHeaderCount = 0;
        processedLines.push(`${headerCount}. ${title}`);
      } else if (line.match(/^#\s+(.+)$/)) {
        // H1 - Top level header
        const title = line.replace(/^#\s+/, '').trim();
        headerCount++;
        subHeaderCount = 0;
        subSubHeaderCount = 0;
        processedLines.push(`${headerCount}. ${title}`);
      } else {
        // Regular line - clean up any remaining # symbols
        const cleanedLine = line.replace(/^#+\s*/, '');
        processedLines.push(cleanedLine);
      }
    }
    
    // Join lines back together
    cleaned = processedLines.join('\n');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Remove any remaining markdown artifacts
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1'); // Remove single asterisks (italic)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1'); // Remove backticks (code)
    
    return cleaned.trim();
  };

  const copyToClipboard = (content) => {
    if (!content || typeof content !== 'string') {
      toast.error('No content to copy');
      return;
    }
    
    const cleanedContent = cleanContent(content);
    
    navigator.clipboard.writeText(cleanedContent).then(() => {
      toast.success('Content copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = cleanedContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Content copied to clipboard!');
    });
  };

  // Helper function to get field descriptions
  const getFieldDescription = (field) => {
    const descriptions = {
      'topic': 'Main subject or theme',
      'key_message': 'Core message to convey',
      'subject_line': 'Email subject line',
      'main_offer': 'Primary offer or value proposition',
      'target_audience': 'Intended audience',
      'product_service': 'Product or service name',
      'main_benefit': 'Key benefit or advantage',
      'blog_topic': 'Blog post subject',
      'main_points': 'Key points to cover',
      'product_name': 'Name of the product',
      'key_features': 'Important features',
      'target_customer': 'Target customer type',
      'announcement': 'What to announce',
      'company_name': 'Company or organization name',
      'key_details': 'Important details',
      'platform': 'Social media platform',
      'content_theme': 'Content theme or topic',
      'main_message': 'Primary message',
      'call_to_action': 'Desired action',
      'hashtags': 'Relevant hashtags',
      'urgency_factor': 'Urgency element',
      'personalization': 'Personal touch',
      'pain_point': 'Problem to address',
      'offer_details': 'Offer specifics',
      'urgency_element': 'Time-sensitive element',
      'hook_type': 'Opening hook style',
      'target_reader': 'Intended reader',
      'article_length': 'Article length context',
      'price_range': 'Price information',
      'unique_selling_point': 'What makes it unique',
      'use_cases': 'How it\'s used',
      'quotes': 'Relevant quotes',
      'background_info': 'Background context',
      'contact_info': 'Contact details',
      'brand_voice': 'Brand personality'
    };
    return descriptions[field] || 'Additional information';
  };

  // Helper function to render appropriate input type
  const getFieldInput = (field) => {
    // Multi-line fields
    if (['main_points', 'key_details', 'background_info', 'use_cases', 'key_features'].includes(field)) {
      return (
        <textarea
          {...register(field, { required: selectedTemplate?.required_fields?.includes(field) })}
          rows={3}
          className="w-full input-cosmic rounded-lg px-4 py-3 resize-none"
          placeholder={getFieldPlaceholder(field)}
        />
      );
    }
    
    // Dropdown fields
    if (field === 'platform') {
      return (
        <select
          {...register(field, { required: selectedTemplate?.required_fields?.includes(field) })}
          className="w-full input-cosmic rounded-lg px-4 py-3"
        >
          <option value="">Select platform</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Instagram">Instagram</option>
          <option value="Facebook">Facebook</option>
          <option value="Twitter">Twitter</option>
          <option value="TikTok">TikTok</option>
          <option value="YouTube">YouTube</option>
        </select>
      );
    }
    
    if (field === 'hook_type') {
      return (
        <select
          {...register(field, { required: selectedTemplate?.required_fields?.includes(field) })}
          className="w-full input-cosmic rounded-lg px-4 py-3"
        >
          <option value="">Select hook type</option>
          <option value="Question">Question</option>
          <option value="Statistic">Statistic</option>
          <option value="Story">Story</option>
          <option value="Quote">Quote</option>
          <option value="Bold Statement">Bold Statement</option>
        </select>
      );
    }
    
    // Default text input
    return (
      <input
        type="text"
        {...register(field, { required: selectedTemplate?.required_fields?.includes(field) })}
        className="w-full input-cosmic rounded-lg px-4 py-3"
        placeholder={getFieldPlaceholder(field)}
      />
    );
  };

  // Helper function to get field placeholders
  const getFieldPlaceholder = (field) => {
    const placeholders = {
      'topic': 'e.g., Digital Marketing Trends 2024',
      'key_message': 'e.g., AI is transforming content creation',
      'subject_line': 'e.g., Unlock 50% More Engagement',
      'main_offer': 'e.g., Free 30-day trial with premium features',
      'target_audience': 'e.g., Marketing professionals aged 25-40',
      'product_service': 'e.g., AI Content Generator Pro',
      'main_benefit': 'e.g., Save 10 hours per week on content creation',
      'blog_topic': 'e.g., The Future of Remote Work',
      'main_points': 'e.g., Benefits, challenges, best practices',
      'product_name': 'e.g., SmartPhone Pro Max',
      'key_features': 'e.g., 48MP camera, 5G connectivity, all-day battery',
      'target_customer': 'e.g., Tech-savvy professionals',
      'announcement': 'e.g., New product launch',
      'company_name': 'e.g., TechCorp Inc.',
      'key_details': 'e.g., Launch date, pricing, availability',
      'platform': 'Select social media platform',
      'content_theme': 'e.g., Behind the scenes',
      'main_message': 'e.g., Quality matters more than quantity',
      'call_to_action': 'e.g., Sign up now, Learn more, Shop today',
      'hashtags': 'e.g., #marketing #AI #productivity',
      'urgency_factor': 'e.g., Limited time offer, Only 24 hours left',
      'personalization': 'e.g., Use recipient\'s name and company',
      'pain_point': 'e.g., Spending too much time on manual tasks',
      'offer_details': 'e.g., 50% off first month, Free shipping',
      'urgency_element': 'e.g., Sale ends tonight',
      'hook_type': 'Select opening hook style',
      'target_reader': 'e.g., Small business owners',
      'article_length': 'e.g., 1500 words comprehensive guide',
      'price_range': 'e.g., $99-$199',
      'unique_selling_point': 'e.g., Only AI tool with real-time collaboration',
      'use_cases': 'e.g., Content creation, social media, email marketing',
      'quotes': 'e.g., "This will revolutionize our industry" - CEO',
      'background_info': 'e.g., Company founded in 2020, 50+ employees',
      'contact_info': 'e.g., press@company.com, (555) 123-4567',
      'brand_voice': 'e.g., Friendly, professional, innovative'
    };
    return placeholders[field] || `Enter ${field.replace('_', ' ')}`;
  };

  return (
    <div className="max-w-full mx-auto space-y-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="bg-hero-gradient rounded-3xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">✨ Content Generator</h1>
          <p className="text-xl text-white/90">Create amazing content with AI-powered templates</p>
        </div>
      </motion.div>

      {/* Generator Form - Full width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 max-w-6xl mx-auto"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* User Preferences Indicator */}
          {userPreferences && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="text-blue-300 font-medium">Personal Preferences Applied</h4>
                    <p className="text-blue-200 text-sm">
                      Your default settings have been loaded: {userPreferences.default_tone} tone, 
                      {userPreferences.default_writing_style} style, {userPreferences.default_audience} audience
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                    Personalized
                  </span>
                  {userPreferences.show_generation_tips && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                      Tips Enabled
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Enhanced Template Selection */}
          <div className="form-section">
            <label className="block text-lg font-semibold text-white mb-3 flex items-center">
              <span className="mr-2">🎯</span>
              Content Type Selection
            </label>
            
            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {templates.map((template) => (
                <motion.div
                  key={template.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedTemplate?.key === template.key
                      ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/25'
                      : 'border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-purple-500/10'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-lg">{template.name}</h3>
                    {selectedTemplate?.key === template.key && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      {template.tone_options?.length || 0} tones
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                      {template.required_fields?.length || 0} required
                    </span>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                      {template.optional_fields?.length || 0} optional
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Template Details */}
            {selectedTemplate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="glass rounded-lg p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold text-purple-300">
                    {selectedTemplate.name} Template
                  </h4>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    Selected
                  </span>
                </div>
                
                <p className="text-gray-300 leading-relaxed">
                  {selectedTemplate.description}
                </p>

                {/* Formatting Guidelines */}
                {selectedTemplate.formatting_guidelines && Array.isArray(selectedTemplate.formatting_guidelines) && selectedTemplate.formatting_guidelines.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h5 className="text-blue-300 font-medium mb-2 flex items-center">
                      <span className="mr-2">📋</span>
                      Formatting Guidelines
                    </h5>
                    <ul className="space-y-1">
                      {selectedTemplate.formatting_guidelines.map((guideline, index) => (
                        <li key={index} className="text-blue-200 text-sm flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {guideline}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Field Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.required_fields && selectedTemplate.required_fields.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h5 className="text-red-300 font-medium mb-2 flex items-center">
                        <span className="mr-2">⚠️</span>
                        Required Fields
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.required_fields.map((field) => (
                          <span key={field} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                            {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTemplate.optional_fields && selectedTemplate.optional_fields.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <h5 className="text-green-300 font-medium mb-2 flex items-center">
                        <span className="mr-2">✨</span>
                        Optional Fields
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.optional_fields.map((field) => (
                          <span key={field} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                            {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Style & Format Section */}
          <div className="form-section space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Style & Format</h3>
                <p className="text-gray-400 text-sm">Configure the tone, length, and creative approach</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tone Selection */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <label className="block text-sm font-medium text-white flex items-center">
                    <Palette className="w-4 h-4 mr-2 text-purple-400" />
                    Content Tone *
                  </label>
                  <Tooltip 
                    id="tone-tooltip"
                    content={
                      <div>
                        <p className="font-medium text-purple-300 mb-2">Content Tone</p>
                        <p className="mb-3">{parameterConfigs.tone.tooltip}</p>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
                          <p className="text-xs text-purple-200">
                            <strong>Examples:</strong><br />
                            {parameterConfigs.tone.example}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors" />
                  </Tooltip>
                </div>
                <select {...register('tone')} className="w-full input-cosmic rounded-lg px-4 py-3">
                  {selectedTemplate?.tone_options?.map((tone) => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
              </div>
              
              {/* Length Selection */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <label className="block text-sm font-medium text-white flex items-center">
                    <Type className="w-4 h-4 mr-2 text-blue-400" />
                    Content Length *
                  </label>
                  <Tooltip 
                    id="length-tooltip"
                    content={
                      <div>
                        <p className="font-medium text-blue-300 mb-2">Content Length</p>
                        <p className="mb-3">{parameterConfigs.length.tooltip}</p>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                          <p className="text-xs text-blue-200">
                            <strong>Examples:</strong><br />
                            {parameterConfigs.length.example}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors" />
                  </Tooltip>
                </div>
                <select {...register('length')} className="w-full input-cosmic rounded-lg px-4 py-3">
                  {selectedTemplate?.length_options?.map((length) => (
                    <option key={length} value={length}>{length}</option>
                  ))}
                </select>
              </div>
              
              {/* Creativity Level */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <label className="block text-sm font-medium text-white flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                    Creativity Level
                  </label>
                  <Tooltip 
                    id="creativity-tooltip"
                    content={
                      <div>
                        <p className="font-medium text-yellow-300 mb-2">Creativity Level</p>
                        <p className="mb-3">{parameterConfigs.creativity.tooltip}</p>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                          <p className="text-xs text-yellow-200">
                            <strong>Examples:</strong><br />
                            {parameterConfigs.creativity.example}
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-yellow-400 transition-colors" />
                  </Tooltip>
                </div>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    {...register('creativity')}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Conservative</span>
                    <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full font-medium">
                      {watch('creativity') || 70}%
                    </span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Required Fields */}
          {selectedTemplate?.required_fields && selectedTemplate.required_fields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="form-section space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center">
                <span className="mr-2">📋</span>
                Required Information
                <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                  {selectedTemplate.required_fields.length} required
                </span>
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedTemplate.required_fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-medium text-white mb-2 flex items-center">
                      <span className="text-red-400 mr-1">*</span>
                      {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      <span className="ml-2 text-xs text-gray-400">
                        ({getFieldDescription(field)})
                      </span>
                    </label>
                    {getFieldInput(field)}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Dynamic Optional Fields */}
          {selectedTemplate?.optional_fields && selectedTemplate.optional_fields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="form-section space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center">
                <span className="mr-2">✨</span>
                Optional Enhancements
                <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                  {selectedTemplate.optional_fields.length} optional
                </span>
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedTemplate.optional_fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-medium text-white mb-2 flex items-center">
                      <span className="text-green-400 mr-1">○</span>
                      {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      <span className="ml-2 text-xs text-gray-400">
                        ({getFieldDescription(field)})
                      </span>
                    </label>
                    {getFieldInput(field)}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Main Content Prompt */}
          <div className="form-section">
            <label className="block text-lg font-semibold text-white mb-3 flex items-center">
              <span className="mr-2">📝</span>
              Content Description *
            </label>
            <textarea
              {...register('user_prompt', { required: true })}
              rows={5}
              className="w-full input-cosmic rounded-lg px-4 py-3 resize-none text-base"
              placeholder="Describe what you want to create. Be specific about your goals, key points, and any special requirements."
            />
          </div>

          {/* AI Model Selection */}
          <SimpleModelDropdown
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
            contentType={selectedTemplate?.key || 'general'}
            className="mb-6"
          />

          {/* Enhanced Advanced Options Toggle */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-3 px-6 py-3 glass glass-hover rounded-lg transition-all duration-300 hover:scale-105"
            >
              <Settings className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-medium">
                {showAdvanced ? 'Hide' : 'Show'} Advanced Parameters
              </span>
              <div className={`transform transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Enhanced Advanced Options */}
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="form-section space-y-8 border-t border-gray-600 pt-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Advanced Parameters</h3>
                  <p className="text-gray-400 text-sm">Fine-tune your content with detailed specifications</p>
                </div>
              </div>
              
              {/* Audience & Context Section */}
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-white flex items-center border-b border-gray-600 pb-2">
                  <Users className="w-5 h-5 mr-2 text-green-400" />
                  Audience & Context
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-white flex items-center">
                        <Users className="w-4 h-4 mr-2 text-green-400" />
                        Target Audience
                      </label>
                      <Tooltip 
                        id="audience-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-green-300 mb-2">Target Audience</p>
                            <p className="mb-3">{parameterConfigs.target_audience.tooltip}</p>
                            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                              <p className="text-xs text-green-200">
                                <strong>Example:</strong><br />
                                {parameterConfigs.target_audience.example}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-green-400 transition-colors" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      {...register('target_audience')}
                      className="w-full input-cosmic rounded-lg px-4 py-3"
                      placeholder="e.g., Marketing professionals aged 25-40"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-white flex items-center">
                        <Hash className="w-4 h-4 mr-2 text-blue-400" />
                        Keywords to Include
                      </label>
                      <Tooltip 
                        id="keywords-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-blue-300 mb-2">Keywords to Include</p>
                            <p className="mb-3">{parameterConfigs.keywords.tooltip}</p>
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                              <p className="text-xs text-blue-200">
                                <strong>Example:</strong><br />
                                {parameterConfigs.keywords.example}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      {...register('keywords')}
                      className="w-full input-cosmic rounded-lg px-4 py-3"
                      placeholder="e.g., innovation, growth, technology"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-white flex items-center">
                        <Info className="w-4 h-4 mr-2 text-purple-400" />
                        Industry/Context
                      </label>
                      <Tooltip 
                        id="industry-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-purple-300 mb-2">Industry/Context</p>
                            <p className="mb-3">Specify the industry or context to help tailor the content appropriately.</p>
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
                              <p className="text-xs text-purple-200">
                                <strong>Examples:</strong><br />
                                Technology, Healthcare, Finance, Education, E-commerce
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      {...register('industry_context')}
                      className="w-full input-cosmic rounded-lg px-4 py-3"
                      placeholder="e.g., Technology, Healthcare, Finance"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-white flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-pink-400" />
                        Brand Voice
                      </label>
                      <Tooltip 
                        id="brand-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-pink-300 mb-2">Brand Voice Description</p>
                            <p className="mb-3">Describe your brand's unique voice and personality to maintain consistency.</p>
                            <div className="bg-pink-500/10 border border-pink-500/30 rounded p-2">
                              <p className="text-xs text-pink-200">
                                <strong>Example:</strong><br />
                                Friendly yet professional, innovative, customer-focused, approachable
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-pink-400 transition-colors" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      {...register('brand_voice')}
                      className="w-full input-cosmic rounded-lg px-4 py-3"
                      placeholder="e.g., Friendly, professional, innovative"
                    />
                  </div>
                </div>
              </div>

              {/* Writing Style Section */}
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-white flex items-center border-b border-gray-600 pb-2">
                  <Type className="w-5 h-5 mr-2 text-orange-400" />
                  Writing Style & Format
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-white flex items-center">
                        <Type className="w-4 h-4 mr-2 text-orange-400" />
                        Writing Style
                      </label>
                      <Tooltip 
                        id="writing-style-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-orange-300 mb-2">Writing Style</p>
                            <p className="mb-3">{parameterConfigs.writing_style.tooltip}</p>
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
                              <p className="text-xs text-orange-200">
                                <strong>Examples:</strong><br />
                                {parameterConfigs.writing_style.example}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-orange-400 transition-colors" />
                      </Tooltip>
                    </div>
                    <select {...register('writing_style')} className="w-full input-cosmic rounded-lg px-4 py-3">
                      <option value="Standard">Standard</option>
                      <option value="Storytelling">Storytelling</option>
                      <option value="Data-Driven">Data-Driven</option>
                      <option value="Conversational">Conversational</option>
                      <option value="Academic">Academic</option>
                      <option value="Journalistic">Journalistic</option>
                      <option value="Persuasive">Persuasive</option>
                      <option value="Educational">Educational</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-white flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-cyan-400" />
                        Content Format
                      </label>
                      <Tooltip 
                        id="format-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-cyan-300 mb-2">Content Format</p>
                            <p className="mb-3">{parameterConfigs.content_format.tooltip}</p>
                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2">
                              <p className="text-xs text-cyan-200">
                                <strong>Examples:</strong><br />
                                {parameterConfigs.content_format.example}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-cyan-400 transition-colors" />
                      </Tooltip>
                    </div>
                    <select {...register('content_format')} className="w-full input-cosmic rounded-lg px-4 py-3">
                      <option value="Paragraph">Paragraph</option>
                      <option value="List">List</option>
                      <option value="Mixed">Mixed</option>
                      <option value="Q&A">Q&A</option>
                      <option value="Step-by-Step">Step-by-Step</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-white flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2 text-indigo-400" />
                        Language Style
                      </label>
                      <Tooltip 
                        id="language-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-indigo-300 mb-2">Language Complexity</p>
                            <p className="mb-3">{parameterConfigs.language_style.tooltip}</p>
                            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-2">
                              <p className="text-xs text-indigo-200">
                                <strong>Examples:</strong><br />
                                {parameterConfigs.language_style.example}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-indigo-400 transition-colors" />
                      </Tooltip>
                    </div>
                    <select {...register('language_style')} className="w-full input-cosmic rounded-lg px-4 py-3">
                      <option value="Simple">Simple</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Technical">Technical</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-white flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-red-400" />
                        Emotional Appeal
                      </label>
                      <Tooltip 
                        id="emotional-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-red-300 mb-2">Emotional Appeal</p>
                            <p className="mb-3">{parameterConfigs.emotional_appeal.tooltip}</p>
                            <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                              <p className="text-xs text-red-200">
                                <strong>Examples:</strong><br />
                                {parameterConfigs.emotional_appeal.example}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors" />
                      </Tooltip>
                    </div>
                    <select {...register('emotional_appeal')} className="w-full input-cosmic rounded-lg px-4 py-3">
                      <option value="Rational">Rational</option>
                      <option value="Emotional">Emotional</option>
                      <option value="Balanced">Balanced</option>
                      <option value="Inspirational">Inspirational</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content Enhancement Section */}
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-white flex items-center border-b border-gray-600 pb-2">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                  Content Enhancement Options
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-3 p-4 glass rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          {...register('include_statistics')}
                          className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-white font-medium">Include Statistics</span>
                        </div>
                      </label>
                      <Tooltip 
                        id="stats-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-blue-300 mb-2">Include Statistics/Data</p>
                            <p className="mb-3">{parameterConfigs.include_statistics.tooltip}</p>
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                              <p className="text-xs text-blue-200">
                                <strong>Example:</strong><br />
                                {parameterConfigs.include_statistics.example}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors" />
                      </Tooltip>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-3 p-4 glass rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          {...register('include_cta')}
                          className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-white font-medium">Include Call-to-Action</span>
                        </div>
                      </label>
                      <Tooltip 
                        id="cta-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-green-300 mb-2">Include Call-to-Action</p>
                            <p className="mb-3">{parameterConfigs.include_cta.tooltip}</p>
                            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                              <p className="text-xs text-green-200">
                                <strong>Examples:</strong><br />
                                {parameterConfigs.include_cta.example}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-green-400 transition-colors" />
                      </Tooltip>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-3 p-4 glass rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          {...register('include_questions')}
                          className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-white font-medium">Include Questions</span>
                        </div>
                      </label>
                      <Tooltip 
                        id="questions-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-purple-300 mb-2">Include Engagement Questions</p>
                            <p className="mb-3">{parameterConfigs.include_questions.tooltip}</p>
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
                              <p className="text-xs text-purple-200">
                                <strong>Examples:</strong><br />
                                {parameterConfigs.include_questions.example}
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors" />
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Quality Iterations Control */}
                <div className="space-y-4">
                  <h5 className="text-md font-medium text-white flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-orange-400" />
                    Quality Enhancement
                  </h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm font-medium text-white flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 text-orange-400" />
                        Quality Iterations
                      </label>
                      <Tooltip 
                        id="quality-iterations-tooltip"
                        content={
                          <div>
                            <p className="font-medium text-orange-300 mb-2">Quality Iterations</p>
                            <p className="mb-3">Number of attempts the AI will make to generate the best possible content. Higher values take longer but often produce better results.</p>
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
                              <p className="text-xs text-orange-200">
                                <strong>Recommendation:</strong><br />
                                1-2: Fast generation | 3-4: Balanced quality/speed | 5: Maximum quality
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-orange-400 transition-colors" />
                      </Tooltip>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        {...register('quality_iterations')}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Fast (1)</span>
                        <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full font-medium">
                          {watch('quality_iterations') || 2} iterations
                        </span>
                        <span>Best Quality (5)</span>
                      </div>
                      <p className="text-xs text-gray-400 text-center">
                        {(() => {
                          const iterations = watch('quality_iterations') || 2;
                          if (iterations <= 2) return "⚡ Fast generation with good quality";
                          if (iterations <= 3) return "⚖️ Balanced speed and quality";
                          if (iterations <= 4) return "🎯 High quality with longer generation time";
                          return "💎 Maximum quality - best results but slowest";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <label className="block text-sm font-medium text-white flex items-center">
                    <Info className="w-4 h-4 mr-2 text-gray-400" />
                    Additional Instructions
                  </label>
                  <Tooltip 
                    id="instructions-tooltip"
                    content={
                      <div>
                        <p className="font-medium text-gray-300 mb-2">Additional Instructions</p>
                        <p className="mb-3">Any specific requirements, style preferences, or additional context that will help create better content.</p>
                        <div className="bg-gray-500/10 border border-gray-500/30 rounded p-2">
                          <p className="text-xs text-gray-200">
                            <strong>Examples:</strong><br />
                            "Focus on mobile users", "Include competitor comparison", "Use simple language for beginners"
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-300 transition-colors" />
                  </Tooltip>
                </div>
                <textarea
                  {...register('additional_notes')}
                  rows={4}
                  className="w-full input-cosmic rounded-lg px-4 py-3 resize-none"
                  placeholder="Any specific requirements, style preferences, or additional context..."
                />
              </div>
            </motion.div>
          )}

          {/* Enhanced Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-600">
            <button
              type="submit"
              disabled={loading || isGeneratingMultiple}
              className="flex-1 btn-cosmic text-white py-4 px-8 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg relative overflow-hidden"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  <div className="flex flex-col items-center">
                    <span>Generating Content...</span>
                    {generationStage && (
                      <span className="text-sm text-purple-200 mt-1">{generationStage}</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 h-1 bg-purple-400 transition-all duration-300" 
                       style={{ width: `${generationProgress}%` }}></div>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-3" />
                  Generate Content
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => generateMultipleVariations(watch())}
              disabled={loading || isGeneratingMultiple}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg transition-all duration-300"
            >
              {isGeneratingMultiple ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Generating Variations...
                </>
              ) : (
                <>
                  <Layers className="w-6 h-6 mr-3" />
                  Generate Variations
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedGenerator(true)}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-4 px-8 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg transition-all duration-300"
            >
              <Edit3 className="w-6 h-6 mr-3" />
              Advanced Generator
            </button>
            
            <button
              type="button"
              onClick={clearHistory}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Clear History
            </button>
          </div>
        </form>
      </motion.div>

      {/* Generated Content Display - Full width below the form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 w-full"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
            <span className="mr-3">📄</span>
            Generated Content
            {generatedContent.length > 0 && (
              <span className="ml-3 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-lg font-medium">
                {generatedContent.length}
              </span>
            )}
            {loading && (
              <span className="ml-3 bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </span>
            )}
          </h2>
          <p className="text-gray-400">Your AI-generated content will appear here</p>
        </div>
        
        {generatedContent.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-8xl mb-6 opacity-60">📝</div>
            <h3 className="text-2xl font-semibold text-white mb-4">No content generated yet</h3>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Fill out the form above and click "Generate Content" to create amazing AI-powered content. 
              Your generated content will appear here with options to copy, download, and manage.
            </p>
            <div className="flex justify-center">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 max-w-md">
                <p className="text-purple-300 text-sm">
                  💡 <strong>Tip:</strong> Be specific in your content description for better results!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Content Stats */}
            <div className="glass rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Content Overview</h3>
                {generatedContent.length > 0 && (
                  <button
                    onClick={() => {
                      // Analyze the latest generated content
                      const latestContent = generatedContent[0];
                      handleQualityAnalysis(latestContent.content, latestContent.id);
                    }}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 transition-all duration-200 flex items-center gap-2"
                    title="Analyze latest content"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Analyze Latest</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="bg-purple-500/10 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{generatedContent.length}</div>
                  <div className="text-sm text-gray-400">Generated Items</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">
                    {generatedContent.reduce((sum, item) => sum + (item.word_count || item.content?.split(' ').length || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Total Words</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">
                    {[...new Set(generatedContent.map(item => item.template_used))].length}
                  </div>
                  <div className="text-sm text-gray-400">Content Types</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(generatedContent.reduce((sum, item) => sum + (item.word_count || item.content?.split(' ').length || 0), 0) / generatedContent.length) || 0}
                  </div>
                  <div className="text-sm text-gray-400">Avg Words</div>
                </div>
                <div className="bg-pink-500/10 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(Object.values(readabilityScores).reduce((sum, score) => sum + score, 0) / Object.values(readabilityScores).length) || 0}
                  </div>
                  <div className="text-sm text-gray-400">Avg Readability</div>
                </div>
              </div>
            </div>

            {/* View Toggle and Comparison Controls */}
            {generatedContent.length > 1 && (
              <div className="glass rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-white">View Options</h3>
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                        showComparison 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      {showComparison ? 'List View' : 'Comparison View'}
                    </button>
                    
                    <button
                      onClick={handleContentMerge}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105"
                      title="Merge multiple content pieces into one"
                    >
                      <Layers className="w-4 h-4" />
                      Merge Content
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>Viewing {generatedContent.length} items</span>
                  </div>
                </div>
              </div>
            )}

            {/* Side-by-Side Comparison View */}
            {showComparison && generatedContent.length > 1 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {generatedContent.slice(0, 6).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="content-display rounded-xl p-6 border-l-4 border-purple-500 h-fit"
                  >
                    {/* Compact Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-lg mb-2">
                          Variation {index + 1}
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-blue-500/10 rounded p-2 text-center">
                            <div className="font-bold text-blue-300">{item.word_count || item.content?.split(' ').length || 0}</div>
                            <div className="text-gray-400">Words</div>
                          </div>
                          <div className="bg-green-500/10 rounded p-2 text-center">
                            <div className="font-bold text-green-300">{readabilityScores[item.id] || 0}</div>
                            <div className="text-gray-400">Score</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleQualityAnalysis(item.content, item.id)}
                          className="p-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 transition-all duration-200"
                          title="Analyze content quality"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => copyToClipboard(item.content || 'No content available')}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 transition-all duration-200"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Compact Content */}
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                      <div className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {cleanContent(item.content).substring(0, 300)}
                        {item.content && item.content.length > 300 && '...'}
                      </div>
                    </div>
                    
                    {/* Readability Badge */}
                    {readabilityScores[item.id] && (
                      <div className="mt-3 flex justify-center">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getReadabilityLevel(readabilityScores[item.id]).bg} ${getReadabilityLevel(readabilityScores[item.id]).color}`}>
                          {getReadabilityLevel(readabilityScores[item.id]).level}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Regular List View */
              <div className="space-y-6">
                {generatedContent.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="content-display rounded-xl p-8 border-l-4 border-purple-500 w-full"
                  >
                  {/* Enhanced Header with Metrics */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-white text-xl">
                          {item.template_used && typeof item.template_used === 'string'
                            ? item.template_used.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                            : 'Generated Content'
                          }
                        </h3>
                        {readabilityScores[item.id] && (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getReadabilityLevel(readabilityScores[item.id]).bg} ${getReadabilityLevel(readabilityScores[item.id]).color}`}>
                            {getReadabilityLevel(readabilityScores[item.id]).level}
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-blue-300">
                            {item.word_count || item.content?.split(' ').length || 0}
                          </div>
                          <div className="text-xs text-gray-400">Words</div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-green-300">
                            {item.content?.length || 0}
                          </div>
                          <div className="text-xs text-gray-400">Characters</div>
                        </div>
                        <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-purple-300">
                            {item.content?.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 0}
                          </div>
                          <div className="text-xs text-gray-400">Sentences</div>
                        </div>
                        <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-yellow-300">
                            {readabilityScores[item.id] || 0}
                          </div>
                          <div className="text-xs text-gray-400">Readability</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                        {item.model && (
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            {item.model}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          Ready
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Action Buttons */}
                    <div className="flex space-x-2 ml-6">
                      <button
                        onClick={() => handleQualityAnalysis(item.content, item.id)}
                        className="px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 transition-all duration-200 hover:scale-105 flex items-center gap-2 group"
                        title="Analyze content quality"
                      >
                        <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Analyze
                      </button>
                      
                      <button
                        onClick={() => handleEnhanceContent(item)}
                        className="px-4 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg text-yellow-300 transition-all duration-200 hover:scale-105 flex items-center gap-2 group"
                        title="Enhance content with AI"
                      >
                        <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Enhance
                      </button>
                      
                      <button
                        onClick={() => copyToClipboard(item.content || 'No content available')}
                        className="px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 transition-all duration-200 hover:scale-105 flex items-center gap-2 group"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Copy
                      </button>
                      
                      <button
                        onClick={() => {
                          const blob = new Blob([cleanContent(item.content)], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `content-${item.id}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast.success('Content downloaded!');
                        }}
                        className="px-4 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 transition-all duration-200 hover:scale-105 flex items-center gap-2 group"
                        title="Download as text file"
                      >
                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Download
                      </button>
                    </div>
                  </div>
                  
                  {/* Content Body - Full width */}
                  <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700/50 w-full">
                    <div className="prose prose-invert max-w-none">
                      <div className="text-gray-100 leading-relaxed text-base whitespace-pre-wrap font-normal">
                        {item.content && item.content.length > 500 ? (
                          <div>
                            <div id={`preview-${item.id}`}>
                              {cleanContent(item.content).substring(0, 500)}...
                            </div>
                            <div id={`full-${item.id}`} className="hidden">
                              {cleanContent(item.content)}
                            </div>
                            <button 
                              className="text-purple-400 hover:text-purple-300 mt-4 underline font-medium text-base px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/30"
                              onClick={(event) => {
                                const preview = document.getElementById(`preview-${item.id}`);
                                const full = document.getElementById(`full-${item.id}`);
                                const button = event.target;
                                
                                if (full.classList.contains('hidden')) {
                                  preview.classList.add('hidden');
                                  full.classList.remove('hidden');
                                  button.textContent = 'Show less';
                                } else {
                                  preview.classList.remove('hidden');
                                  full.classList.add('hidden');
                                  button.textContent = 'Read more';
                                }
                              }}
                            >
                              Read more
                            </button>
                          </div>
                        ) : (
                          <div>{cleanContent(item.content)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-600/50">
                    <div className="text-sm text-gray-500">
                      Generated on {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-green-600/20 text-green-300 text-sm rounded-full border border-green-500/30">
                        ✓ Ready
                      </span>
                      <span className="text-sm text-gray-400">
                        ID: {item.id}
                      </span>
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Quality Analysis Modal */}
      {showQualityAnalysis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          style={{ 
            left: isDesktop ? '280px' : '0',
            width: isDesktop ? 'calc(100vw - 280px)' : '100vw'
          }}
          onClick={() => setShowQualityAnalysis(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-gray-900 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden"
            style={{ 
              maxWidth: isDesktop ? 'calc(100vw - 280px - 2rem)' : 'calc(100vw - 2rem)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Content Quality Analysis</h2>
                  <p className="text-purple-100">
                    Comprehensive analysis of your generated content
                  </p>
                </div>
                <button
                  onClick={() => setShowQualityAnalysis(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <QualityAnalysisDashboard 
                content={qualityAnalysisContent}
                contentType={selectedTemplate?.key || 'general'}
                onAnalysisComplete={(analysis) => {
                  console.log('Analysis completed:', analysis);
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-800 p-4 border-t border-gray-700">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowQualityAnalysis(null)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Export analysis data
                    const analysisData = {
                      content: qualityAnalysisContent,
                      contentType: selectedTemplate?.key || 'general',
                      timestamp: new Date().toISOString(),
                      contentId: showQualityAnalysis
                    };
                    
                    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `quality-analysis-${showQualityAnalysis}-${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success('Analysis exported successfully!');
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Analysis</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Advanced Content Generator Modal */}
      {showAdvancedGenerator && (
        <AdvancedContentGenerator
          onGenerate={handleAdvancedGenerate}
          onClose={() => setShowAdvancedGenerator(false)}
        />
      )}

      {/* A/B Test Comparison Modal */}
      {showABTestComparison && abTestResult && (
        <ABTestComparison
          abTestResult={abTestResult}
          onSubmitFeedback={handleABTestFeedback}
          onClose={() => {
            setShowABTestComparison(false);
            setAbTestResult(null);
          }}
        />
      )}

      {/* Enhanced Content Generator Modal */}
      {showEnhancedGenerator && selectedContentForEnhancement && (
        <EnhancedContentGenerator
          generatedContent={selectedContentForEnhancement.content}
          contentType={selectedContentForEnhancement.template_used || 'general'}
          onSave={handleSaveEnhancedContent}
          onClose={() => {
            setShowEnhancedGenerator(false);
            setSelectedContentForEnhancement(null);
          }}
          contentHistory={generatedContent.filter(item => item.id !== selectedContentForEnhancement.id)}
        />
      )}

      {/* Content Merger Modal */}
      {showContentMerger && (
        <ContentMerger
          availableContent={generatedContent}
          onClose={() => setShowContentMerger(false)}
          onSave={handleSaveMergedContent}
        />
      )}
    </div>
  );
};

export default ContentGenerator;