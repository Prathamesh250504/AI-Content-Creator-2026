import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const DataVisualizationSimple = ({ data, type = 'overview', className = '' }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div className={`p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          DataVisualization Component - {type}
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Component loaded successfully! Data type: {type}
        </p>
        {data && data.metrics && (
          <div className="mt-4">
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Found {data.metrics.length} metrics
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualizationSimple;