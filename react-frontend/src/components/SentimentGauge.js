/**
 * Sentiment Gauge Component
 * Visualizes sentiment analysis with gauges and charts
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Smile, Meh, Frown, Heart, Brain } from 'lucide-react';

const SentimentGauge = ({ data }) => {
  // Normalize polarity to 0-100 scale for display
  const normalizedPolarity = ((data.polarity + 1) / 2) * 100;
  const normalizedSubjectivity = data.subjectivity * 100;

  // Prepare data for sentiment breakdown
  const sentimentData = [
    { name: 'Positive', value: (data.positive || 0) * 100, color: '#10B981' },
    { name: 'Neutral', value: (data.neutral || 0) * 100, color: '#6B7280' },
    { name: 'Negative', value: (data.negative || 0) * 100, color: '#EF4444' }
  ];

  // Prepare data for polarity vs subjectivity
  const analysisData = [
    {
      name: 'Polarity',
      value: normalizedPolarity,
      description: 'How positive or negative',
      color: '#3B82F6'
    },
    {
      name: 'Subjectivity',
      value: normalizedSubjectivity,
      description: 'How subjective vs objective',
      color: '#8B5CF6'
    },
    {
      name: 'Confidence',
      value: Math.abs(data.polarity) * 100,
      description: 'Confidence in sentiment',
      color: '#F59E0B'
    }
  ];

  const getSentimentIcon = (label) => {
    switch (label) {
      case 'positive':
        return <Smile className="w-6 h-6 text-green-600" />;
      case 'negative':
        return <Frown className="w-6 h-6 text-red-600" />;
      default:
        return <Meh className="w-6 h-6 text-gray-600" />;
    }
  };

  const getSentimentColor = (label) => {
    switch (label) {
      case 'positive':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
      case 'negative':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    }
  };

  const sentimentColor = getSentimentColor(data.label);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600">
            Value: <span className="font-medium">{payload[0].value.toFixed(1)}%</span>
          </p>
          <p className="text-gray-600 text-sm">{payload[0].payload.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">Sentiment Analysis</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${sentimentColor.bg} ${sentimentColor.border} border`}>
          {getSentimentIcon(data.label)}
          <span className={`text-sm font-medium ${sentimentColor.text} capitalize`}>
            {data.label}
          </span>
        </div>
      </div>

      {/* Main Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Polarity Gauge */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Polarity</h4>
          <div className="w-32 h-32 mx-auto mb-4">
            <CircularProgressbar
              value={normalizedPolarity}
              text={`${normalizedPolarity.toFixed(0)}%`}
              styles={buildStyles({
                textSize: '16px',
                pathColor: normalizedPolarity > 50 ? '#10B981' : normalizedPolarity < 50 ? '#EF4444' : '#6B7280',
                textColor: '#374151',
                trailColor: '#E5E7EB',
              })}
            />
          </div>
          <div className="text-sm text-gray-600">
            {data.polarity > 0.1 ? 'Positive' : data.polarity < -0.1 ? 'Negative' : 'Neutral'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Raw: {data.polarity.toFixed(3)}
          </div>
        </div>

        {/* Subjectivity Gauge */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Subjectivity</h4>
          <div className="w-32 h-32 mx-auto mb-4">
            <CircularProgressbar
              value={normalizedSubjectivity}
              text={`${normalizedSubjectivity.toFixed(0)}%`}
              styles={buildStyles({
                textSize: '16px',
                pathColor: '#8B5CF6',
                textColor: '#374151',
                trailColor: '#E5E7EB',
              })}
            />
          </div>
          <div className="text-sm text-gray-600">
            {data.subjectivity > 0.5 ? 'Subjective' : 'Objective'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Raw: {data.subjectivity.toFixed(3)}
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Confidence</h4>
          <div className="w-32 h-32 mx-auto mb-4">
            <CircularProgressbar
              value={Math.abs(data.polarity) * 100}
              text={`${(Math.abs(data.polarity) * 100).toFixed(0)}%`}
              styles={buildStyles({
                textSize: '16px',
                pathColor: '#F59E0B',
                textColor: '#374151',
                trailColor: '#E5E7EB',
              })}
            />
          </div>
          <div className="text-sm text-gray-600">
            {Math.abs(data.polarity) > 0.3 ? 'High' : Math.abs(data.polarity) > 0.1 ? 'Medium' : 'Low'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Strength: {Math.abs(data.polarity).toFixed(3)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Breakdown Pie Chart */}
        {(data.positive || data.negative || data.neutral) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Sentiment Breakdown</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Percentage']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {sentimentData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Metrics Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Analysis Metrics</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analysisData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {analysisData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Detailed Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-medium text-gray-800">Emotional Tone</div>
                <div className="text-sm text-gray-600">
                  {data.polarity > 0.3 ? 'Very Positive' : 
                   data.polarity > 0.1 ? 'Positive' :
                   data.polarity < -0.3 ? 'Very Negative' :
                   data.polarity < -0.1 ? 'Negative' : 'Neutral'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Brain className="w-5 h-5 text-purple-500" />
              <div>
                <div className="font-medium text-gray-800">Content Style</div>
                <div className="text-sm text-gray-600">
                  {data.subjectivity > 0.7 ? 'Highly Subjective' :
                   data.subjectivity > 0.4 ? 'Somewhat Subjective' :
                   data.subjectivity > 0.2 ? 'Balanced' : 'Objective'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Polarity Score:</span>
              <span className="font-medium">{data.polarity.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subjectivity Score:</span>
              <span className="font-medium">{data.subjectivity.toFixed(3)}</span>
            </div>
            {data.compound !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Compound Score:</span>
                <span className="font-medium">{data.compound.toFixed(3)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Interpretation Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Polarity Scale</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>+1.0</span>
                <span className="text-green-600">Very Positive</span>
              </div>
              <div className="flex justify-between">
                <span>+0.5</span>
                <span className="text-green-500">Positive</span>
              </div>
              <div className="flex justify-between">
                <span>0.0</span>
                <span className="text-gray-600">Neutral</span>
              </div>
              <div className="flex justify-between">
                <span>-0.5</span>
                <span className="text-red-500">Negative</span>
              </div>
              <div className="flex justify-between">
                <span>-1.0</span>
                <span className="text-red-600">Very Negative</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Subjectivity Scale</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>1.0</span>
                <span className="text-purple-600">Highly Subjective</span>
              </div>
              <div className="flex justify-between">
                <span>0.7</span>
                <span className="text-purple-500">Subjective</span>
              </div>
              <div className="flex justify-between">
                <span>0.5</span>
                <span className="text-gray-600">Balanced</span>
              </div>
              <div className="flex justify-between">
                <span>0.3</span>
                <span className="text-blue-500">Mostly Objective</span>
              </div>
              <div className="flex justify-between">
                <span>0.0</span>
                <span className="text-blue-600">Completely Objective</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentGauge;