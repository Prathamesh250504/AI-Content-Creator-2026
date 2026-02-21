/**
 * Suggestions Panel Component
 * Displays actionable suggestions for content improvement
 */

import React, { useState } from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Filter,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  FileText,
  Target,
  Brain,
  BarChart3,
  Hash
} from 'lucide-react';

const SuggestionsPanel = ({ suggestions = [] }) => {
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter suggestions based on selected filters
  const filteredSuggestions = suggestions.filter(suggestion => {
    const priorityMatch = selectedPriority === 'all' || suggestion.priority === selectedPriority;
    const categoryMatch = selectedCategory === 'all' || suggestion.category === selectedCategory;
    return priorityMatch && categoryMatch;
  });

  // Group suggestions by category
  const groupedSuggestions = filteredSuggestions.reduce((groups, suggestion) => {
    const category = suggestion.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(suggestion);
    return groups;
  }, {});

  // Get priority icon and color
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high':
        return {
          icon: ArrowUp,
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200'
        };
      case 'medium':
        return {
          icon: ArrowRight,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          border: 'border-yellow-200'
        };
      case 'low':
        return {
          icon: ArrowDown,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          border: 'border-blue-200'
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          border: 'border-gray-200'
        };
    }
  };

  // Get category icon and color
  const getCategoryConfig = (category) => {
    switch (category) {
      case 'readability':
        return {
          icon: FileText,
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        };
      case 'engagement':
        return {
          icon: Target,
          color: 'text-green-600',
          bg: 'bg-green-50'
        };
      case 'tone':
      case 'sentiment':
        return {
          icon: Brain,
          color: 'text-purple-600',
          bg: 'bg-purple-50'
        };
      case 'structure':
        return {
          icon: BarChart3,
          color: 'text-orange-600',
          bg: 'bg-orange-50'
        };
      case 'vocabulary':
      case 'keywords':
        return {
          icon: Hash,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50'
        };
      case 'length':
        return {
          icon: FileText,
          color: 'text-gray-600',
          bg: 'bg-gray-50'
        };
      default:
        return {
          icon: Lightbulb,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50'
        };
    }
  };

  // Get unique categories for filters
  const categories = [...new Set(suggestions.map(s => s.category))];

  // Count suggestions by priority
  const priorityCounts = {
    high: suggestions.filter(s => s.priority === 'high').length,
    medium: suggestions.filter(s => s.priority === 'medium').length,
    low: suggestions.filter(s => s.priority === 'low').length
  };

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Great Content!</h3>
        <p className="text-gray-600">No improvement suggestions needed at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Improvement Suggestions</h3>
          <p className="text-gray-600">
            {filteredSuggestions.length} of {suggestions.length} suggestions
          </p>
        </div>
        
        {/* Priority Summary */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{priorityCounts.high} High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{priorityCounts.medium} Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{priorityCounts.low} Low</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Suggestions by Category */}
      {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => {
        const categoryConfig = getCategoryConfig(category);
        const CategoryIcon = categoryConfig.icon;

        return (
          <div key={category} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <div className={`px-6 py-4 ${categoryConfig.bg} border-b border-gray-200`}>
              <div className="flex items-center space-x-3">
                <CategoryIcon className={`w-5 h-5 ${categoryConfig.color}`} />
                <h4 className="text-lg font-semibold text-gray-800 capitalize">
                  {category} Suggestions
                </h4>
                <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
                  {categorySuggestions.length}
                </span>
              </div>
            </div>

            {/* Category Suggestions */}
            <div className="p-6 space-y-4">
              {categorySuggestions.map((suggestion, index) => {
                const priorityConfig = getPriorityConfig(suggestion.priority);
                const PriorityIcon = priorityConfig.icon;

                return (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${priorityConfig.border} ${priorityConfig.bg}`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Priority Icon */}
                      <div className={`p-2 rounded-full bg-white ${priorityConfig.color}`}>
                        <PriorityIcon className="w-4 h-4" />
                      </div>

                      {/* Suggestion Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-800">
                            {suggestion.suggestion}
                          </h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color} bg-white`}>
                            {suggestion.priority} priority
                          </span>
                        </div>
                        
                        {suggestion.detail && (
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {suggestion.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* No Results Message */}
      {filteredSuggestions.length === 0 && suggestions.length > 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Suggestions Match Filters</h3>
          <p className="text-gray-500">Try adjusting your filter settings to see more suggestions.</p>
          <button
            onClick={() => {
              setSelectedPriority('all');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Action Summary */}
      {filteredSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Quick Action Guide</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-sm font-medium text-gray-800">High Priority</div>
              <div className="text-xs text-gray-600">Address these first</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Info className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-sm font-medium text-gray-800">Medium Priority</div>
              <div className="text-xs text-gray-600">Improve when possible</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-gray-800">Low Priority</div>
              <div className="text-xs text-gray-600">Nice to have improvements</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionsPanel;