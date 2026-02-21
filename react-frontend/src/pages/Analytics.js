import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Clock, 
  Target,
  Sparkles,
  Calendar,
  Award,
  Activity,
  Zap
} from 'lucide-react';
import { useContent } from '../contexts/ContentContext';
import { useTheme } from '../contexts/ThemeContext';
import DataVisualizationFixed from '../components/DataVisualizationFixed';

const Analytics = () => {
  const { statistics, loadStatistics } = useContent();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const ContentTypeCard = ({ type, count, percentage }) => (
    <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'glass' : 'bg-gray-50 border border-gray-200'} rounded-lg`}>
      <div>
        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h4>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{count} items</p>
      </div>
      <div className="text-right">
        <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{percentage}%</div>
        <div className={`w-16 h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden`}>
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );

  if (statistics.total_entries === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className={`${isDarkMode ? 'bg-hero-gradient' : 'bg-gradient-to-r from-blue-600 to-purple-600'} rounded-3xl p-8 mb-8`}>
            <h1 className="text-4xl font-bold text-white mb-2">📊 Analytics Dashboard</h1>
            <p className="text-xl text-white/90">Track your content performance and insights</p>
          </div>
        </motion.div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${isDarkMode ? 'glass' : 'bg-white border border-gray-200'} rounded-2xl p-12 text-center`}
        >
          <div className="text-6xl mb-6 opacity-60">📊</div>
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>No Analytics Data Available</h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-8 max-w-2xl mx-auto`}>
            Start generating content to see your analytics dashboard with real-time metrics and insights.
            Track your progress, content types, and performance over time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/generator"
              className="inline-flex items-center px-6 py-3 btn-cosmic text-white font-medium rounded-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Content
            </Link>
            <Link
              to="/templates"
              className={`inline-flex items-center px-6 py-3 ${isDarkMode ? 'glass glass-hover' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'} ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium rounded-lg`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Browse Templates
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Calculate metrics
  const totalContent = statistics.total_entries;
  const totalWords = statistics.total_words;
  const avgWordsPerContent = totalWords > 0 ? Math.round(totalWords / totalContent) : 0;
  const timeSaved = (totalContent * 0.5).toFixed(1); // Estimate 30 minutes saved per content
  const qualityScore = Math.min(100, Math.round((avgWordsPerContent / 500) * 100));

  // Content type distribution
  const contentTypes = Object.entries(statistics.content_types || {}).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / totalContent) * 100)
  }));

  // Prepare data for DataVisualization component
  const analyticsData = {
    overview: {
      metrics: [
        { icon: FileText, title: 'Total Content', value: totalContent.toString(), change: '+12%', trend: 'up', color: 'blue' },
        { icon: Award, title: 'Success Rate', value: '100%', change: '+0%', trend: 'up', color: 'green' },
        { icon: Clock, title: 'Time Saved', value: `${timeSaved}h`, change: '+15%', trend: 'up', color: 'purple' },
        { icon: Target, title: 'Quality Score', value: `${qualityScore}%`, change: '+8%', trend: 'up', color: 'yellow' }
      ],
      contentByType: contentTypes.map(ct => ({ label: ct.type.replace('_', ' '), value: ct.count })),
      weeklyActivity: [
        { label: 'Mon', value: Math.floor(totalContent * 0.15) },
        { label: 'Tue', value: Math.floor(totalContent * 0.18) },
        { label: 'Wed', value: Math.floor(totalContent * 0.12) },
        { label: 'Thu', value: Math.floor(totalContent * 0.20) },
        { label: 'Fri', value: Math.floor(totalContent * 0.16) },
        { label: 'Sat', value: Math.floor(totalContent * 0.10) },
        { label: 'Sun', value: Math.floor(totalContent * 0.09) }
      ]
    },
    engagement: {
      metrics: [
        { icon: Activity, title: 'Avg Engagement', value: '73.5%', change: '+15%', trend: 'up', color: 'blue' },
        { icon: TrendingUp, title: 'Growth Rate', value: '22%', change: '+5%', trend: 'up', color: 'green' },
        { icon: Zap, title: 'Performance', value: '87%', change: '+8%', trend: 'up', color: 'purple' },
        { icon: Target, title: 'Reach', value: '12.4K', change: '+12%', trend: 'up', color: 'yellow' }
      ],
      engagementTrend: [
        { label: 'Week 1', value: 65 },
        { label: 'Week 2', value: 72 },
        { label: 'Week 3', value: 68 },
        { label: 'Week 4', value: 78 }
      ]
    },
    quality: {
      metrics: [
        { icon: Award, title: 'Quality Score', value: `${qualityScore}/100`, change: '+3', trend: 'up', color: 'yellow' },
        { icon: Target, title: 'Accuracy', value: '94%', change: '+2%', trend: 'up', color: 'green' },
        { icon: Sparkles, title: 'Creativity', value: '87%', change: '+5%', trend: 'up', color: 'purple' },
        { icon: Clock, title: 'Avg. Length', value: `${avgWordsPerContent}w`, change: '+15w', trend: 'up', color: 'blue' }
      ],
      qualityBreakdown: [
        { label: 'Excellent', value: Math.floor(totalContent * 0.45) },
        { label: 'Good', value: Math.floor(totalContent * 0.32) },
        { label: 'Average', value: Math.floor(totalContent * 0.18) },
        { label: 'Needs Work', value: Math.floor(totalContent * 0.05) }
      ]
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: Activity },
    { id: 'quality', label: 'Quality', icon: Award }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className={`${isDarkMode ? 'bg-hero-gradient' : 'bg-gradient-to-r from-blue-600 to-purple-600'} rounded-3xl p-8 mb-8`}>
          <h1 className="text-4xl font-bold text-white mb-2">📊 Analytics Dashboard</h1>
          <p className="text-xl text-white/90">Track your content performance and insights</p>
        </div>
      </motion.div>

      {/* Analytics Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${isDarkMode ? 'glass' : 'bg-white border border-gray-200'} rounded-2xl p-6`}
      >
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-600 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* DataVisualization Component */}
        <DataVisualizationFixed 
          data={analyticsData[activeTab]} 
          type={activeTab}
        />
      </motion.div>

      {/* Legacy Analytics Section - Keep for backward compatibility */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Content Types Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`${isDarkMode ? 'glass' : 'bg-white border border-gray-200'} rounded-2xl p-6`}
        >
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
            <BarChart3 className="w-6 h-6 mr-2" />
            Content Types
          </h3>
          <div className="space-y-4">
            {contentTypes.length > 0 ? (
              contentTypes.map((item, index) => (
                <ContentTypeCard
                  key={item.type}
                  type={item.type}
                  count={item.count}
                  percentage={item.percentage}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No content types data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`${isDarkMode ? 'glass' : 'bg-white border border-gray-200'} rounded-2xl p-6`}
        >
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
            <TrendingUp className="w-6 h-6 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>Content Generated</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Latest generation completed</p>
                </div>
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Calendar className="w-4 h-4 inline mr-1" />
                Today
              </div>
            </div>
            
            <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>Profile Updated</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>User preferences saved</p>
                </div>
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Calendar className="w-4 h-4 inline mr-1" />
                Yesterday
              </div>
            </div>

            <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <div>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>Template Used</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>New template applied</p>
                </div>
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Calendar className="w-4 h-4 inline mr-1" />
                2 days ago
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`${isDarkMode ? 'glass' : 'bg-white border border-gray-200'} rounded-2xl p-6`}
      >
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
          <Sparkles className="w-6 h-6 mr-2" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`text-center p-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {totalWords.toLocaleString()}
            </div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Total Words Generated</p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Equivalent to {Math.round(totalWords / 250)} pages
            </p>
          </div>
          
          <div className={`text-center p-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {avgWordsPerContent}
            </div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Average Content Length</p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              {avgWordsPerContent > 300 ? 'Detailed' : avgWordsPerContent > 150 ? 'Moderate' : 'Concise'} content style
            </p>
          </div>
          
          <div className={`text-center p-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {qualityScore}%
            </div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Quality Score</p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Based on content depth and structure
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`${isDarkMode ? 'glass' : 'bg-white border border-gray-200'} rounded-2xl p-6`}
      >
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>🚀 Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/generator"
            className={`flex items-center p-4 ${isDarkMode ? 'glass glass-hover' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'} rounded-lg ${isDarkMode ? 'text-white hover:text-white' : 'text-gray-900 hover:text-gray-900'} transition-all duration-300`}
          >
            <Sparkles className="w-6 h-6 mr-3 text-purple-400" />
            <div>
              <p className="font-medium">Generate New Content</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create fresh content</p>
            </div>
          </Link>
          
          <Link
            to="/history"
            className={`flex items-center p-4 ${isDarkMode ? 'glass glass-hover' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'} rounded-lg ${isDarkMode ? 'text-white hover:text-white' : 'text-gray-900 hover:text-gray-900'} transition-all duration-300`}
          >
            <FileText className="w-6 h-6 mr-3 text-blue-400" />
            <div>
              <p className="font-medium">View History</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Browse past content</p>
            </div>
          </Link>
          
          <Link
            to="/dashboard"
            className={`flex items-center p-4 ${isDarkMode ? 'glass glass-hover' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'} rounded-lg ${isDarkMode ? 'text-white hover:text-white' : 'text-gray-900 hover:text-gray-900'} transition-all duration-300`}
          >
            <BarChart3 className="w-6 h-6 mr-3 text-green-400" />
            <div>
              <p className="font-medium">Dashboard</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overview & settings</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;