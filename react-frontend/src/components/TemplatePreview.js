import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const TemplatePreview = ({ template, onClose, onUseTemplate }) => {
  const [showVariables, setShowVariables] = useState(false);
  const { isDarkMode } = useTheme();

  const renderPreview = () => {
    let previewContent = template.template_content || '';
    
    // Replace variables with example values for preview
    if (template.variables && Array.isArray(template.variables)) {
      template.variables.forEach(variable => {
        // Check if variable and variable.name exist
        if (!variable || !variable.name) {
          return; // Skip this variable if name is undefined
        }
        
        const placeholder = `{{${variable.name}}}`;
        let exampleValue = variable.default_value || `[${variable.name}]`;
        
        if (variable.type === 'select' && variable.options && variable.options.length > 0) {
          exampleValue = variable.options[0];
        } else if (variable.type === 'boolean') {
          exampleValue = 'true';
        } else if (variable.type === 'number') {
          exampleValue = '42';
        }
        
        // Ensure exampleValue is a string
        exampleValue = String(exampleValue);
        
        previewContent = previewContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), exampleValue);
      });
    }

    return previewContent;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:left-[280px]">
      <div className={`${isDarkMode ? 'glass' : 'bg-white border border-gray-300'} rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{template.name}</h2>
                {template.rating > 0 && (
                  <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-sm rounded-full flex items-center">
                    ⭐ {template.rating}
                  </span>
                )}
              </div>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>{template.description}</p>
              <div className="flex items-center space-x-4">
                <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                  {template.category ? template.category.replace('_', ' ') : 'General'}
                </span>
                {template.user_id === 'system_templates' && (
                  <span className="px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded">
                    Proven Template
                  </span>
                )}
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {template.variables ? template.variables.length : 0} variables
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} ml-4`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Template Preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Template Preview</h3>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className={`px-3 py-1 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded text-sm transition-colors`}
              >
                {showVariables ? 'Hide Variables' : 'Show Variables'}
              </button>
            </div>
            
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-300'} p-4 rounded-lg border`}>
              <pre className={`whitespace-pre-wrap text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} font-mono`}>
                {renderPreview()}
              </pre>
            </div>
          </div>

          {/* Variables Section */}
          {showVariables && template.variables && template.variables.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                Template Variables ({template.variables.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.variables.map((variable, index) => (
                  <div key={index} className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'} p-4 rounded-lg border`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{variable.name || 'Unnamed Variable'}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                          {variable.type || 'text'}
                        </span>
                        {variable.required && (
                          <span className="px-2 py-1 bg-red-600 text-red-100 text-xs rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {variable.description && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{variable.description}</p>
                    )}
                    
                    {variable.default_value && (
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Default: {variable.default_value}
                      </div>
                    )}
                    
                    {variable.options && variable.options.length > 0 && (
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        Options: {variable.options.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Tags</h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map(tag => (
                  <span key={tag} className={`px-3 py-1 ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} text-sm rounded-full`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Usage Stats */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Usage Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg text-center`}>
                <div className="text-2xl font-bold text-blue-400">{template.variables ? template.variables.length : 0}</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Variables</div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg text-center`}>
                <div className="text-2xl font-bold text-green-400">{template.usage_count || 0}</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Times Used</div>
              </div>
              {template.rating > 0 && (
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg text-center`}>
                  <div className="text-2xl font-bold text-yellow-400">{template.rating}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rating</div>
                </div>
              )}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-3 rounded-lg text-center`}>
                <div className="text-2xl font-bold text-purple-400">{template.tags?.length || 0}</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tags</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-700' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'} rounded-md transition-colors`}
            >
              Close
            </button>
            <button
              onClick={() => onUseTemplate(template)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;