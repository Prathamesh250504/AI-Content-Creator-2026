/**
 * Keyword Cloud Component
 * Visualizes keyword density and important terms
 */

import React from 'react';
import { Tag, Hash, TrendingUp, BarChart3 } from 'lucide-react';

const KeywordCloud = ({ data }) => {
  // Prepare keyword data for visualization
  const keywords = data.top_keywords || [];
  const keywordDensity = data.keyword_density || {};
  const mostFrequent = data.most_frequent_words || [];

  const getKeywordSize = (density) => {
    if (density >= 3) return 'text-2xl';
    if (density >= 2) return 'text-xl';
    if (density >= 1) return 'text-lg';
    return 'text-base';
  };

  const getKeywordColor = (density) => {
    if (density >= 3) return 'text-red-600 bg-red-100';
    if (density >= 2) return 'text-orange-600 bg-orange-100';
    if (density >= 1) return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-600 bg-blue-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">Keyword Analysis</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Hash className="w-4 h-4" />
          <span>Lexical Diversity: {(data.lexical_diversity * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Keyword Cloud */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Top Keywords</h4>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {keywords.map((keyword, index) => {
              const density = keywordDensity[keyword] || 0;
              return (
                <span
                  key={index}
                  className={`px-3 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105 ${getKeywordSize(density)} ${getKeywordColor(density)}`}
                >
                  {keyword}
                  <span className="ml-2 text-xs opacity-75">
                    {density.toFixed(1)}%
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No keywords identified</p>
          </div>
        )}
      </div>

      {/* Keyword Density Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Keyword Density</h4>
        {Object.keys(keywordDensity).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(keywordDensity)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([keyword, density], index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {keyword}
                      </span>
                      <span className="text-sm text-gray-500">
                        {density.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(density * 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No keyword density data available</p>
          </div>
        )}
      </div>

      {/* Most Frequent Words */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Most Frequent Words</h4>
        {mostFrequent.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mostFrequent.slice(0, 12).map(([word, count], index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {word}
                </span>
                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                  {count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No frequency data available</p>
          </div>
        )}
      </div>

      {/* Vocabulary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Hash className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-sm text-blue-600 font-medium">Unique Words</div>
              <div className="text-2xl font-bold text-blue-800">
                {data.total_unique_words || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <div>
              <div className="text-sm text-green-600 font-medium">Lexical Diversity</div>
              <div className="text-2xl font-bold text-green-800">
                {((data.lexical_diversity || 0) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <div>
              <div className="text-sm text-purple-600 font-medium">Stop Word Ratio</div>
              <div className="text-2xl font-bold text-purple-800">
                {((data.stop_word_ratio || 0) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyword Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Keyword Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Tag className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <div className="font-medium text-gray-800">Keyword Density</div>
                <div className="text-sm text-gray-600">
                  {data.lexical_diversity > 0.4 
                    ? "Good keyword variety - content uses diverse vocabulary"
                    : "Limited keyword variety - consider using more varied terms"
                  }
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Hash className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium text-gray-800">Vocabulary Richness</div>
                <div className="text-sm text-gray-600">
                  {data.total_unique_words > 50
                    ? "Rich vocabulary with good word variety"
                    : "Consider expanding vocabulary for better engagement"
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <div className="font-medium text-gray-800">Word Frequency</div>
                <div className="text-sm text-gray-600">
                  {mostFrequent.length > 0
                    ? `Most used word: "${mostFrequent[0][0]}" (${mostFrequent[0][1]} times)`
                    : "No frequency data available"
                  }
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <BarChart3 className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <div className="font-medium text-gray-800">Stop Words</div>
                <div className="text-sm text-gray-600">
                  {data.stop_word_ratio < 0.5
                    ? "Good balance of content words vs stop words"
                    : "High stop word ratio - content may lack substance"
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyword Recommendations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Keyword Recommendations</h4>
        <div className="space-y-2">
          {data.lexical_diversity < 0.3 && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-800">
                Use more varied vocabulary to improve lexical diversity
              </span>
            </div>
          )}
          
          {Object.values(keywordDensity).some(d => d > 5) && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-red-800">
                Some keywords are overused - consider reducing repetition
              </span>
            </div>
          )}
          
          {keywords.length < 3 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-800">
                Add more relevant keywords to improve content focus
              </span>
            </div>
          )}
          
          {data.stop_word_ratio > 0.6 && (
            <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-orange-800">
                Reduce stop words and add more meaningful content words
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeywordCloud;