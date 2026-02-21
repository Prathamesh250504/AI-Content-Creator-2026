/**
 * Quality Metrics Card Component
 * Displays individual quality metrics with visual indicators
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const QualityMetricsCard = ({ title, score, level, icon: Icon, color = 'blue' }) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        progress: '#3B82F6'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600',
        progress: '#10B981'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-800',
        icon: 'text-purple-600',
        progress: '#8B5CF6'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        icon: 'text-orange-600',
        progress: '#F59E0B'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600',
        progress: '#EF4444'
      }
    };
    return colors[color] || colors.blue;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const colorClasses = getColorClasses(getScoreColor(score));
  const normalizedScore = Math.max(0, Math.min(100, score));

  const formatLevel = (level) => {
    if (typeof level === 'string') {
      return level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return level;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${colorClasses.bg} ${colorClasses.border} border rounded-xl p-6 hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
            <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
          </div>
          <h3 className={`font-semibold ${colorClasses.text}`}>{title}</h3>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={`text-2xl font-bold ${colorClasses.text} mb-1`}>
            {normalizedScore.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">
            {formatLevel(level)}
          </div>
        </div>
        
        <div className="w-16 h-16">
          <CircularProgressbar
            value={normalizedScore}
            text={`${normalizedScore.toFixed(0)}`}
            styles={buildStyles({
              textSize: '24px',
              pathColor: colorClasses.progress,
              textColor: colorClasses.progress,
              trailColor: '#E5E7EB',
              backgroundColor: '#F9FAFB',
            })}
          />
        </div>
      </div>

      {/* Additional metrics */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Score</span>
          <span className="font-medium">{normalizedScore.toFixed(1)}/100</span>
        </div>
      </div>
    </motion.div>
  );
};

export default QualityMetricsCard;