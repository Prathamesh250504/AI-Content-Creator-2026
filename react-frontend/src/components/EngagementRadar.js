/**
 * Engagement Radar Component
 * Visualizes engagement potential metrics using radar charts
 */

import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Target, MessageCircle, Zap, Heart, TrendingUp } from 'lucide-react';

const EngagementRadar = ({ data }) => {
  // Prepare radar chart data
  const radarData = [
    {
      factor: 'Emotional Appeal',
      score: data.factors?.emotional_appeal || 0,
      fullMark: 100
    },
    {
      factor: 'Power Words',
      score: data.factors?.power_words_usage || 0,
      fullMark: 100
    },
    {
      factor: 'Urgency',
      score: data.factors?.urgency_factor || 0,
      fullMark: 100
    },
    {
      factor: 'Interactivity',
      score: data.factors?.interactivity || 0,
      fullMark: 100
    },
    {
      factor: 'Content Type',
      score: data.factors?.content_type_bonus || 0,
      fullMark: 100
    }
  ];

  // Prepare bar chart data for individual metrics
  const metricsData = [
    {
      name: 'Emotional Words',
      count: data.emotional_words || 0,
      color: '#EF4444'
    },
    {
      name: 'Power Words',
      count: data.power_words || 0,
      color: '#F59E0B'
    },
    {
      name: 'Questions',
      count: data.question_count || 0,
      color: '#3B82F6'
    },
    {
      name: 'CTAs',
      count: data.call_to_action_count || 0,
      color: '#10B981'
    },
    {
      name: 'Urgency Indicators',
      count: data.urgency_indicators || 0,
      color: '#8B5CF6'
    }
  ];

  const getEngagementLevel = (score) => {
    if (score >= 80) return { level: 'High', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 40) return { level: 'Low', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Very Low', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const engagementLevel = getEngagementLevel(data.score || 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600">
            Count: <span className="font-medium">{payload[0].value}</span>
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
        <h3 className="text-xl font-semibold text-gray-800">Engagement Analysis</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${engagementLevel.bg}`}>
          <Target className={`w-4 h-4 ${engagementLevel.color}`} />
          <span className={`text-sm font-medium ${engagementLevel.color}`}>
            {engagementLevel.level} Engagement
          </span>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">Overall Engagement Score</h4>
            <p className="text-gray-600">Based on multiple engagement factors</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${engagementLevel.color}`}>
              {(data.score || 0).toFixed(0)}
            </div>
            <div className="text-gray-500">out of 100</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Heart className="w-6 h-6 text-red-600" />
            <div>
              <div className="text-sm text-red-600 font-medium">Emotional Words</div>
              <div className="text-2xl font-bold text-red-800">
                {data.emotional_words || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-orange-600" />
            <div>
              <div className="text-sm text-orange-600 font-medium">Power Words</div>
              <div className="text-2xl font-bold text-orange-800">
                {data.power_words || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-sm text-blue-600 font-medium">Questions</div>
              <div className="text-2xl font-bold text-blue-800">
                {data.question_count || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <div>
              <div className="text-sm text-green-600 font-medium">CTAs</div>
              <div className="text-2xl font-bold text-green-800">
                {data.call_to_action_count || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Engagement Factors</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="factor" fontSize={11} />
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

        {/* Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Engagement Elements</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={11}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {metricsData.map((entry, index) => (
                  <Bar key={`cell-${index}`} dataKey="count" fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Factor Breakdown</h4>
        <div className="space-y-4">
          {radarData.map((factor, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{factor.factor}</span>
                  <span className="text-sm text-gray-500">{factor.score.toFixed(0)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${factor.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Tips */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Engagement Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Heart className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium text-gray-800">Use Emotional Language</div>
                <div className="text-sm text-gray-600">
                  Words like "amazing", "incredible", "love" create emotional connection
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <div className="font-medium text-gray-800">Ask Questions</div>
                <div className="text-sm text-gray-600">
                  Questions encourage interaction and comments
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <div className="font-medium text-gray-800">Add Power Words</div>
                <div className="text-sm text-gray-600">
                  "Free", "exclusive", "proven" grab attention
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium text-gray-800">Include Call-to-Actions</div>
                <div className="text-sm text-gray-600">
                  Clear CTAs guide readers to take action
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Level Guide */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Engagement Level Guide</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded">
            <span className="text-green-800 font-medium">80-100: High Engagement</span>
            <span className="text-green-600 text-sm">Likely to generate strong response</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded">
            <span className="text-yellow-800 font-medium">60-79: Medium Engagement</span>
            <span className="text-yellow-600 text-sm">Good potential for interaction</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded">
            <span className="text-orange-800 font-medium">40-59: Low Engagement</span>
            <span className="text-orange-600 text-sm">May need more engaging elements</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded">
            <span className="text-red-800 font-medium">0-39: Very Low Engagement</span>
            <span className="text-red-600 text-sm">Requires significant improvement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementRadar;