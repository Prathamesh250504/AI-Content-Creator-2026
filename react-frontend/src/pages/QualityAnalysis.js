/**
 * Quality Analysis Page
 * Standalone page for analyzing content quality with comprehensive metrics
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  CheckCircle,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import QualityAnalysisDashboard from '../components/QualityAnalysisDashboard';
import { useContent } from '../contexts/ContentContext';

const QualityAnalysis = () => {
  const [analysisContent, setAnalysisContent] = useState('');
  const [contentType, setContentType] = useState('general');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { generatedContent } = useContent();

  const handleAnalyze = () => {
    if (!analysisContent.trim()) {
      return;
    }
    setShowAnalysis(true);
  };

  const handleLoadFromHistory = (content) => {
    setAnalysisContent(content);
    setShowAnalysis(false);
  };

  const contentTypes = [
    { value: 'general', label: 'General Content' },
    { value: 'blog', label: 'Blog Post' },
    { value: 'social', label: 'Social Media' },
    { value: 'email', label: 'Email Marketing' },
    { value: 'ad', label: 'Advertisement' },
    { value: 'press_release', label: 'Press Release' },
    { value: 'product_description', label: 'Product Description' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="bg-hero-gradient rounded-3xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 mr-3" />
            Content Quality Analysis
          </h1>
          <p className="text-xl text-white/90">
            Analyze your content for readability, engagement, sentiment, and more
          </p>
        </div>
      </motion.div>

      {!showAnalysis ? (
        <>
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8"
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Content Input</h2>
                  <p className="text-gray-400">Enter or paste your content for analysis</p>
                </div>
              </div>

              {/* Content Type Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full input-cosmic rounded-lg px-4 py-3"
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white">
                  Content to Analyze
                </label>
                <textarea
                  value={analysisContent}
                  onChange={(e) => setAnalysisContent(e.target.value)}
                  rows={12}
                  className="w-full input-cosmic rounded-lg px-4 py-3 resize-none"
                  placeholder="Paste your content here for quality analysis..."
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>
                    {analysisContent.split(' ').filter(word => word.length > 0).length} words, {analysisContent.length} characters
                  </span>
                  <span>
                    {analysisContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length} sentences
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!analysisContent.trim()}
                  className="flex-1 btn-cosmic text-white py-4 px-8 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                >
                  <TrendingUp className="w-6 h-6 mr-3" />
                  Analyze Content Quality
                </button>
                
                <button
                  onClick={() => {
                    setAnalysisContent('');
                    setShowAnalysis(false);
                  }}
                  className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Clear
                </button>
              </div>
            </div>
          </motion.div>

          {/* Load from History Section */}
          {generatedContent.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Load from History</h2>
                  <p className="text-gray-400">Analyze previously generated content</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedContent.slice(0, 6).map((item, index) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-purple-500 transition-all duration-300"
                    onClick={() => handleLoadFromHistory(item.content)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm">
                        {item.template_used?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Generated Content'}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {item.word_count || item.content?.split(' ').length || 0} words
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-xs leading-relaxed mb-3">
                      {item.content?.substring(0, 100)}...
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                      <button className="text-purple-400 hover:text-purple-300 text-xs font-medium">
                        Analyze →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Features Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Analysis Features</h2>
              <p className="text-gray-400">Comprehensive content quality metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Readability</h3>
                <p className="text-gray-400 text-sm">
                  Flesch-Kincaid grade level, reading ease, and sentence complexity analysis
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Engagement</h3>
                <p className="text-gray-400 text-sm">
                  Emotional words, power words, questions, and call-to-action analysis
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Sentiment</h3>
                <p className="text-gray-400 text-sm">
                  Polarity, subjectivity, and emotional tone detection
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Suggestions</h3>
                <p className="text-gray-400 text-sm">
                  Actionable recommendations for content improvement
                </p>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        /* Analysis Results */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAnalysis(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Input</span>
            </button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Analysis Complete</span>
            </div>
          </div>

          {/* Quality Analysis Dashboard */}
          <QualityAnalysisDashboard 
            content={analysisContent}
            contentType={contentType}
            onAnalysisComplete={(analysis) => {
              console.log('Analysis completed:', analysis);
            }}
          />

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setAnalysisContent('');
                setShowAnalysis(false);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>Analyze New Content</span>
            </button>
            
            <button
              onClick={() => {
                const analysisData = {
                  content: analysisContent,
                  contentType: contentType,
                  timestamp: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `quality-analysis-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Analysis</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QualityAnalysis;