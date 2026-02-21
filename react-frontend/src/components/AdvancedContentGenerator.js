import { useState, useEffect, useCallback } from 'react';
import { useContent } from '../contexts/ContentContext';
import authService from '../services/authService';
import ABTestManager from './ABTestManager';
import ABTestResults from './ABTestResults';

const AdvancedContentGenerator = ({ onGenerate, onClose }) => {
  const { generateAdvancedContent } = useContent();
  
  const [mode, setMode] = useState('standard');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [abTests, setAbTests] = useState([]);
  const [selectedABTest, setSelectedABTest] = useState(null);
  const [variables, setVariables] = useState({});
  const [userPrompt, setUserPrompt] = useState('');
  const [parameters, setParameters] = useState({
    tone: 'professional',
    length: 'medium',
    creativity: 50,
    content_mode: 'high_quality'
  });
  const [loading, setLoading] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [renderedPrompt, setRenderedPrompt] = useState('');
  const [showABTestManager, setShowABTestManager] = useState(false);
  const [abTestResult, setAbTestResult] = useState(null);
  const [showABTestResults, setShowABTestResults] = useState(false);

  const loadTemplates = useCallback(async () => {
    const token = authService.getToken();
    if (!token) {
      console.log('User not authenticated, skipping template load');
      return;
    }

    try {
      const response = await fetch('/api/prompt-templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  const loadABTests = useCallback(async () => {
    const token = authService.getToken();
    if (!token) {
      console.log('User not authenticated, skipping A/B tests load');
      return;
    }

    try {
      console.log('Loading A/B tests...');
      const response = await fetch('/api/ab-tests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('A/B tests response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('A/B tests data:', data);
        setAbTests(data.ab_tests || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to load A/B tests:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Failed to load A/B tests:', error);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadABTests();
  }, [loadTemplates, loadABTests]);

  useEffect(() => {
    if (selectedTemplate && mode === 'advanced') {
      // Initialize variables with default values
      const initialVariables = {};
      selectedTemplate.variables.forEach(variable => {
        initialVariables[variable.name] = variable.default_value || '';
      });
      setVariables(initialVariables);
    }
  }, [selectedTemplate, mode]);

  const handleVariableChange = (variableName, value) => {
    setVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const previewPrompt = () => {
    if (!selectedTemplate) return;
    
    let preview = selectedTemplate.template_content;
    
    // Replace variables with current values
    Object.entries(variables).forEach(([name, value]) => {
      const placeholder = `{{${name}}}`;
      preview = preview.replace(new RegExp(placeholder, 'g'), value || `[${name}]`);
    });
    
    setRenderedPrompt(preview);
    setShowPromptPreview(true);
  };

  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      const requestData = {
        mode,
        user_prompt: userPrompt,
        parameters,
        variables
      };

      if (mode === 'advanced' && selectedTemplate) {
        requestData.template_id = selectedTemplate.id;
      } else if (mode === 'ab_test' && selectedABTest) {
        requestData.ab_test_id = selectedABTest.id;
      }

      const result = await generateAdvancedContent(requestData);
      
      if (result.success) {
        if (mode === 'ab_test') {
          // For A/B tests, show the comparison results
          setAbTestResult(result);
          setShowABTestResults(true);
        } else {
          // For standard and advanced modes, pass result to parent
          onGenerate(result);
        }
      } else {
        alert(`Generation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderVariableInput = (variable) => {
    const value = variables[variable.name] || '';
    
    switch (variable.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
            placeholder={variable.placeholder || variable.description}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="">Select {variable.name}</option>
            {variable.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleVariableChange(variable.name, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
            />
            <label className="ml-2 text-sm text-gray-300">
              {variable.description}
            </label>
          </div>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
            placeholder={variable.placeholder || variable.description}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
          />
        );
      
      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
            placeholder={variable.placeholder || variable.description}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:left-[280px]">
      <div className="glass rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Advanced Content Generator</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Generation Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Generation Mode
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setMode('standard')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  mode === 'standard' 
                    ? 'border-blue-500 bg-blue-900 text-blue-100' 
                    : 'border-gray-600 hover:border-gray-500 text-gray-300'
                }`}
              >
                <div className="font-medium">Standard</div>
                <div className="text-sm text-gray-400">Use built-in templates</div>
              </button>
              
              <button
                onClick={() => setMode('advanced')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  mode === 'advanced' 
                    ? 'border-blue-500 bg-blue-900 text-blue-100' 
                    : 'border-gray-600 hover:border-gray-500 text-gray-300'
                }`}
              >
                <div className="font-medium">Advanced</div>
                <div className="text-sm text-gray-400">Use custom prompt templates</div>
              </button>
              
              <button
                onClick={() => setMode('ab_test')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  mode === 'ab_test' 
                    ? 'border-blue-500 bg-blue-900 text-blue-100' 
                    : 'border-gray-600 hover:border-gray-500 text-gray-300'
                }`}
              >
                <div className="font-medium">A/B Test</div>
                <div className="text-sm text-gray-400">Compare two templates</div>
              </button>
            </div>
          </div>

          {/* Template Selection for Advanced Mode */}
          {mode === 'advanced' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Prompt Template
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  setSelectedTemplate(template);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="">Choose a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </select>
              
              {selectedTemplate && (
                <div className="mt-2 p-3 bg-gray-800 rounded-md">
                  <p className="text-sm text-gray-300">{selectedTemplate.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-400">
                      {selectedTemplate.variables.length} variables • {selectedTemplate.category}
                    </div>
                    <button
                      onClick={previewPrompt}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Preview Prompt
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* A/B Test Selection */}
          {mode === 'ab_test' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select A/B Test
              </label>
              <select
                value={selectedABTest?.id || ''}
                onChange={(e) => {
                  const test = abTests.find(t => t.id === e.target.value);
                  setSelectedABTest(test);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              >
                <option value="">
                  {abTests.length === 0 ? 'No A/B tests available' : 'Choose an A/B test...'}
                </option>
                {abTests.map(test => (
                  <option key={test.id} value={test.id}>
                    {test.name}
                  </option>
                ))}
              </select>
              
              {abTests.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-900 border border-yellow-600 rounded-md">
                  <p className="text-sm text-yellow-200">
                    No A/B tests found. Create A/B tests to compare different prompt variations.
                  </p>
                  <button
                    onClick={() => setShowABTestManager(true)}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Manage A/B Tests
                  </button>
                </div>
              )}
              
              {selectedABTest && (
                <div className="mt-2 p-3 bg-gray-800 rounded-md">
                  <p className="text-sm text-gray-300">{selectedABTest.description}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    Status: {selectedABTest.status} • 
                    Tests: {selectedABTest.results?.total_tests || 0}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content Topic/Prompt
            </label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              placeholder="Describe what content you want to generate..."
            />
          </div>

          {/* Template Variables */}
          {mode === 'advanced' && selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Template Variables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.variables.map(variable => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {variable.name}
                      {variable.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {renderVariableInput(variable)}
                    {variable.description && (
                      <p className="text-xs text-gray-400 mt-1">{variable.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generation Parameters */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Generation Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tone
                </label>
                <select
                  value={parameters.tone}
                  onChange={(e) => setParameters(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Length
                </label>
                <select
                  value={parameters.length}
                  onChange={(e) => setParameters(prev => ({ ...prev, length: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="short">Short (50-150 words)</option>
                  <option value="medium">Medium (150-400 words)</option>
                  <option value="long">Long (400+ words)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Creativity ({parameters.creativity}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={parameters.creativity}
                  onChange={(e) => setParameters(prev => ({ ...prev, creativity: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Quality Mode
                </label>
                <select
                  value={parameters.content_mode}
                  onChange={(e) => setParameters(prev => ({ ...prev, content_mode: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="default">Default</option>
                  <option value="high_quality">High Quality</option>
                  <option value="creative">Creative</option>
                  <option value="structured">Structured</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              {mode === 'advanced' && selectedTemplate && (
                <button
                  onClick={previewPrompt}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Preview Prompt
                </button>
              )}
              {mode === 'ab_test' && (
                <button
                  onClick={() => setShowABTestManager(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Manage A/B Tests
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || (mode === 'advanced' && !selectedTemplate) || (mode === 'ab_test' && !selectedABTest)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Preview Modal */}
      {showPromptPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 lg:left-[280px]">
          <div className="glass rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Prompt Preview</h3>
                <button
                  onClick={() => setShowPromptPreview(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-200">
                  {renderedPrompt}
                </pre>
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowPromptPreview(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A/B Test Manager Modal */}
      {showABTestManager && (
        <ABTestManager
          onClose={() => setShowABTestManager(false)}
          onSelectTest={(test) => {
            setSelectedABTest(test);
            setShowABTestManager(false);
          }}
        />
      )}

      {/* A/B Test Results Modal */}
      {showABTestResults && abTestResult && (
        <ABTestResults
          abTestResult={abTestResult}
          onClose={() => {
            setShowABTestResults(false);
            setAbTestResult(null);
          }}
          onSubmitResult={() => {
            // Refresh A/B tests list
            loadABTests();
          }}
        />
      )}
    </div>
  );
};

export default AdvancedContentGenerator;