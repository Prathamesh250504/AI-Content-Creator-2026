import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  Clock,
  Users,
  FileText,
  Sparkles,
  PieChart,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Award,
  Filter
} from 'lucide-react';

// Simple Progress Bar Component
const ProgressBar = ({ value, max, color = 'purple', label, className = '' }) => {
  const { isDarkMode } = useTheme();
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500'
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{value}/{max}</span>
        </div>
      )}
      <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
        <motion.div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// Simple Bar Chart Component
const SimpleBarChart = ({ data = [], height = 200, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ height }}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.value || 0));
  
  return (
    <div className={`${className}`}>
      <div className="flex items-end justify-between space-x-2" style={{ height }}>
        {data.map((item, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center space-y-2 flex-1"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex flex-col items-center justify-end flex-1 w-full">
              <motion.div
                className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t w-full min-h-[4px]"
                initial={{ height: 0 }}
                animate={{ height: `${maxValue > 0 ? (item.value / maxValue) * (height - 60) : 4}px` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            </div>
            <div className="text-center">
              <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.value || 0}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[60px]`}>
                {item.label || ''}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, title, value, change, trend, color = 'blue', className = '' }) => {
  const { isDarkMode } = useTheme();
  
  const colorClasses = {
    blue: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    green: isDarkMode ? 'text-green-400' : 'text-green-600',
    purple: isDarkMode ? 'text-purple-400' : 'text-purple-600',
    yellow: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
    red: isDarkMode ? 'text-red-400' : 'text-red-600',
    indigo: isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
  };
  
  // Safe icon handling
  const IconComponent = icon || FileText;
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  
  return (
    <motion.div
      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <IconComponent className={`w-5 h-5 ${colorClasses[color]}`} />
          </div>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          </div>
        </div>
        {change && (
          <div className={`flex items-center space-x-1 ${trend === 'up' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Donut Chart Component
const DonutChart = ({ data = [], size = 120, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data</p>
      </div>
    );
  }
  
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;
  
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isDarkMode ? '#374151' : '#E5E7EB'}
            strokeWidth="8"
          />
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
            cumulativePercentage += percentage;
            
            const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
            
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{total}</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => {
          const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.label}: {item.value || 0} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main DataVisualization Component
const DataVisualizationFixed = ({ data, type = 'overview', className = '' }) => {
  const { isDarkMode } = useTheme();
  const [timeRange, setTimeRange] = useState('7d');
  
  // Mock data fallback
  const mockData = {
    overview: {
      metrics: [
        { icon: FileText, title: 'Total Content', value: '1,247', change: '+12%', trend: 'up', color: 'blue' },
        { icon: Users, title: 'Active Users', value: '89', change: '+5%', trend: 'up', color: 'green' },
        { icon: Activity, title: 'Engagement Rate', value: '73.5%', change: '+8%', trend: 'up', color: 'purple' },
        { icon: Zap, title: 'Content This Week', value: '45', change: '-3%', trend: 'down', color: 'yellow' }
      ],
      contentByType: [
        { label: 'Blog Posts', value: 45 },
        { label: 'Social Media', value: 32 },
        { label: 'Email', value: 28 },
        { label: 'Marketing', value: 15 },
        { label: 'Other', value: 8 }
      ],
      weeklyActivity: [
        { label: 'Mon', value: 12 },
        { label: 'Tue', value: 19 },
        { label: 'Wed', value: 15 },
        { label: 'Thu', value: 22 },
        { label: 'Fri', value: 18 },
        { label: 'Sat', value: 8 },
        { label: 'Sun', value: 6 }
      ]
    },
    engagement: {
      metrics: [
        { icon: Eye, title: 'Total Views', value: '12.4K', change: '+15%', trend: 'up', color: 'blue' },
        { icon: Heart, title: 'Likes', value: '2.1K', change: '+22%', trend: 'up', color: 'red' },
        { icon: MessageCircle, title: 'Comments', value: '456', change: '+8%', trend: 'up', color: 'green' },
        { icon: Share2, title: 'Shares', value: '789', change: '+12%', trend: 'up', color: 'purple' }
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
        { icon: Award, title: 'Quality Score', value: '8.7/10', change: '+0.3', trend: 'up', color: 'yellow' },
        { icon: Target, title: 'Accuracy', value: '94%', change: '+2%', trend: 'up', color: 'green' },
        { icon: Sparkles, title: 'Creativity', value: '87%', change: '+5%', trend: 'up', color: 'purple' },
        { icon: Clock, title: 'Avg. Time', value: '2.3m', change: '-15s', trend: 'up', color: 'blue' }
      ],
      qualityBreakdown: [
        { label: 'Excellent', value: 45 },
        { label: 'Good', value: 32 },
        { label: 'Average', value: 18 },
        { label: 'Needs Work', value: 5 }
      ]
    }
  };
  
  const currentData = data || mockData[type] || mockData.overview;
  
  const timeRangeOptions = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Analytics Dashboard
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Track your content performance and engagement metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`px-3 py-1 rounded-md text-sm border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-300' 
                  : 'bg-white border-gray-300 text-gray-700'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            className={`px-3 py-1 rounded-md text-sm border ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } transition-colors`}
          >
            Export
          </button>
        </div>
      </div>
      
      {/* Metrics Grid */}
      {currentData.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentData.metrics.map((metric, index) => (
            <MetricCard
              key={index}
              icon={metric.icon}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              color={metric.color}
            />
          ))}
        </div>
      )}
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        {(currentData.weeklyActivity || currentData.engagementTrend) && (
          <motion.div
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {type === 'engagement' ? 'Engagement Trend' : 'Weekly Activity'}
              </h3>
              <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <SimpleBarChart 
              data={currentData.weeklyActivity || currentData.engagementTrend} 
              height={200}
            />
          </motion.div>
        )}
        
        {/* Donut Chart */}
        {(currentData.contentByType || currentData.qualityBreakdown) && (
          <motion.div
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {type === 'quality' ? 'Quality Distribution' : 'Content by Type'}
              </h3>
              <PieChart className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <DonutChart 
              data={currentData.contentByType || currentData.qualityBreakdown}
              size={200}
            />
          </motion.div>
        )}
      </div>
      
      {/* Progress Bars Section */}
      {type === 'quality' && (
        <motion.div
          className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Quality Metrics Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProgressBar value={87} max={100} color="purple" label="Creativity Score" />
            <ProgressBar value={94} max={100} color="green" label="Accuracy Rate" />
            <ProgressBar value={76} max={100} color="blue" label="Readability" />
            <ProgressBar value={82} max={100} color="yellow" label="Engagement Potential" />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DataVisualizationFixed;