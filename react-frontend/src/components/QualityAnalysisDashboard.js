/**
 * Quality Analysis Dashboard Component
 * Main dashboard for content quality analysis with visualizations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Target, 
  Brain, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import QualityMetricsCard from './QualityMetricsCard';
import ReadabilityChart from './ReadabilityChart';
import SentimentGauge from './SentimentGauge';
import EngagementRadar from './EngagementRadar';
import SuggestionsPanel from './SuggestionsPanel';
import qualityAnalysisService from '../services/qualityAnalysisService';

const QualityAnalysisDashboard = ({ content, contentType = 'general', onAnalysisComplete }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (content && content.trim()) {
      analyzeContent();
    }
  }, [content, contentType]);

  const analyzeContent = async () => {
    if (!content || !content.trim()) {
      setError('No content provided for analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await qualityAnalysisService.analyzeContentQuality(content, contentType);
      
      if (result.success) {
        setAnalysis(result.analysis);
        if (onAnalysisComplete) {
          onAnalysisComplete(result.analysis);
        }
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze content');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'readability', label: 'Readability', icon: FileText },
    { id: 'sentiment', label: 'Sentiment', icon: Brain },
    { id: 'engagement', label: 'Engagement', icon: Target },
    { id: 'suggestions', label: 'Suggestions', icon: Lightbulb }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">Analyzing content...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Analysis Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={analyzeContent}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center p-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Content to Analyze</h3>
        <p className="text-gray-500">Provide content to see quality analysis</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Content Quality Analysis</h2>
            <p className="text-blue-100">
              {analysis.word_count} words • {analysis.content_type} content
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
              {analysis.overall_score}/100
            </div>
            <div className="text-blue-100">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <QualityMetricsCard
                title="Readability"
                score={analysis.readability.score}
                level={analysis.readability.level}
                icon={FileText}
                color="blue"
              />
              <QualityMetricsCard
                title="Engagement"
                score={analysis.engagement_potential.score}
                level={analysis.engagement_potential.level}
                icon={Target}
                color="green"
              />
              <QualityMetricsCard
                title="Sentiment"
                score={Math.abs(analysis.sentiment.polarity) * 100}
                level={analysis.sentiment.label}
                icon={Brain}
                color="purple"
              />
              <QualityMetricsCard
                title="Structure"
                score={analysis.structure_analysis.formatting_score}
                level={analysis.structure_analysis.structure_quality}
                icon={BarChart3}
                color="orange"
              />
            </div>

            {/* Quick Insights */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">
                    {analysis.keyword_density.lexical_diversity > 0.3 ? 'Good vocabulary diversity' : 'Limited vocabulary diversity'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">
                    {analysis.structure_analysis.paragraph_count > 1 ? 'Well-structured paragraphs' : 'Single paragraph structure'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">
                    {analysis.engagement_potential.question_count > 0 ? 'Contains engaging questions' : 'No questions for engagement'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">
                    {analysis.sentiment.label !== 'neutral' ? `${analysis.sentiment.label} tone detected` : 'Neutral tone'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'readability' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ReadabilityChart data={analysis.readability} />
          </motion.div>
        )}

        {activeTab === 'sentiment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SentimentGauge data={analysis.sentiment} />
          </motion.div>
        )}

        {activeTab === 'engagement' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EngagementRadar data={analysis.engagement_potential} />
          </motion.div>
        )}

        {activeTab === 'suggestions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SuggestionsPanel suggestions={analysis.suggestions} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QualityAnalysisDashboard;