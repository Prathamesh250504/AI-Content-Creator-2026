/**
 * Readability Chart Component
 * Visualizes readability metrics using charts
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BookOpen, Clock, Users } from 'lucide-react';

const ReadabilityChart = ({ data }) => {
  // Prepare data for bar chart
  const barData = [
    {
      name: 'Flesch Reading Ease',
      score: Math.max(0, data.flesch_reading_ease || 0),
      target: 70,
      color: '#3B82F6'
    },
    {
      name: 'Flesch-Kincaid Grade',
      score: Math.max(0, 20 - (data.flesch_kincaid_grade || 0)) * 5, // Convert to 0-100 scale
      target: 60,
      color: '#10B981'
    },
    {
      name: 'Gunning Fog',
      score: Math.max(0, 20 - (data.gunning_fog || 0)) * 5, // Convert to 0-100 scale
      target: 65,
      color: '#F59E0B'
    },
    {
      name: 'ARI',
      score: Math.max(0, 20 - (data.automated_readability_index || 0)) * 5,
      target: 65,
      color: '#8B5CF6'
    }
  ];

  // Prepare data for radar chart
  const radarData = [
    {
      metric: 'Reading Ease',
      score: Math.max(0, data.flesch_reading_ease || 0),
      fullMark: 100
    },
    {
      metric: 'Grade Level',
      score: Math.max(0, Math.min(100, (20 - (data.flesch_kincaid_grade || 0)) * 5)),
      fullMark: 100
    },
    {
      metric: 'Sentence Length',
      score: Math.max(0, Math.min(100, (30 - (data.average_sentence_length || 0)) * 3.33)),
      fullMark: 100
    },
    {
      metric: 'Word Length',
      score: Math.max(0, Math.min(100, (10 - (data.average_word_length || 0)) * 10)),
      fullMark: 100
    }
  ];

  const getReadabilityLevel = (score) => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { level: 'Easy', color: 'text-green-500', bg: 'bg-green-50' };
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 60) return { level: 'Standard', color: 'text-yellow-500', bg: 'bg-yellow-50' };
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (score >= 30) return { level: 'Difficult', color: 'text-red-600', bg: 'bg-red-100' };
    return { level: 'Very Difficult', color: 'text-red-700', bg: 'bg-red-200' };
  };

  const readabilityLevel = getReadabilityLevel(data.flesch_reading_ease || 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600">
            Score: <span className="font-medium">{payload[0].value.toFixed(1)}</span>
          </p>
          <p className="text-gray-600">
            Target: <span className="font-medium">{payload[0].payload.target}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">Readability Analysis</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${readabilityLevel.bg} ${readabilityLevel.color}`}>
          {readabilityLevel.level}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-sm text-blue-600 font-medium">Reading Ease</div>
              <div className="text-2xl font-bold text-blue-800">
                {(data.flesch_reading_ease || 0).toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-green-600" />
            <div>
              <div className="text-sm text-green-600 font-medium">Grade Level</div>
              <div className="text-2xl font-bold text-green-800">
                {(data.flesch_kincaid_grade || 0).toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-orange-600" />
            <div>
              <div className="text-sm text-orange-600 font-medium">Avg Sentence</div>
              <div className="text-2xl font-bold text-orange-800">
                {(data.average_sentence_length || 0).toFixed(1)} words
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Readability Scores</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" fill="#E5E7EB" radius={[4, 4, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Readability Profile</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" fontSize={12} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                fontSize={10}
                tickCount={5}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Detailed Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {(data.flesch_reading_ease || 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Flesch Reading Ease</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {(data.flesch_kincaid_grade || 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Grade Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {(data.gunning_fog || 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Gunning Fog</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {(data.automated_readability_index || 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">ARI</div>
          </div>
        </div>
      </div>

      {/* Reading Level Guide */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Reading Level Guide</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded">
            <span className="text-green-800 font-medium">90-100: Very Easy</span>
            <span className="text-green-600 text-sm">5th grade level</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded">
            <span className="text-yellow-800 font-medium">60-70: Standard</span>
            <span className="text-yellow-600 text-sm">8th-9th grade level</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded">
            <span className="text-orange-800 font-medium">30-50: Difficult</span>
            <span className="text-orange-600 text-sm">College level</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded">
            <span className="text-red-800 font-medium">0-30: Very Difficult</span>
            <span className="text-red-600 text-sm">Graduate level</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadabilityChart;