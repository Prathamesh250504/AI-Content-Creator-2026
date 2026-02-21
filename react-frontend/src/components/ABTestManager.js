import { useState, useEffect } from 'react';
import authService from '../services/authService';

const ABTestManager = ({ onClose, onSelectTest }) => {
  const [abTests, setAbTests] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    template_a_id: '',
    template_b_id: ''
  });

  useEffect(() => {
    loadAbTests();
    loadTemplates();
  }, []);

  const loadAbTests = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch('/api/ab-tests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAbTests(data.ab_tests || []);
      }
    } catch (error) {
      console.error('Failed to load A/B tests:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

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
  };

  const createAbTest = async () => {
    if (!newTest.name || !newTest.template_a_id || !newTest.template_b_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (newTest.template_a_id === newTest.template_b_id) {
      alert('Template A and Template B must be different');
      return;
    }

    setLoading(true);
    try {
      const token = authService.getToken();
      console.log('Creating A/B test with data:', newTest);
      
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTest)
      });

      console.log('A/B test creation response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('A/B test creation result:', result);
        setAbTests(prev => [result.ab_test, ...prev]);
        setNewTest({ name: '', description: '', template_a_id: '', template_b_id: '' });
        setShowCreateForm(false);
        alert('A/B test created successfully!');
      } else {
        const errorText = await response.text();
        console.error('A/B test creation error:', errorText);
        alert(`Failed to create A/B test: ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
      alert('Failed to create A/B test');
    } finally {
      setLoading(false);
    }
  };

  const startAbTest = async (testId) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`/api/ab-tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadAbTests(); // Refresh the list
        alert('A/B test started successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to start A/B test: ${error.error}`);
      }
    } catch (error) {
      console.error('Error starting A/B test:', error);
      alert('Failed to start A/B test');
    }
  };

  const pauseAbTest = async (testId) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`/api/ab-tests/${testId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadAbTests(); // Refresh the list
        alert('A/B test paused successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to pause A/B test: ${error.error}`);
      }
    } catch (error) {
      console.error('Error pausing A/B test:', error);
      alert('Failed to pause A/B test');
    }
  };

  const deleteAbTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this A/B test? This will also delete all results.')) {
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch(`/api/ab-tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAbTests(prev => prev.filter(test => test.id !== testId));
        alert('A/B test deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete A/B test: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting A/B test:', error);
      alert('Failed to delete A/B test');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-900 text-green-200',
      paused: 'bg-yellow-900 text-yellow-200',
      completed: 'bg-blue-900 text-blue-200',
      draft: 'bg-gray-700 text-gray-300'
    };
    
    return colors[status] || colors.draft;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:left-[280px]">
      <div className="glass rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">A/B Test Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Create New Test Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showCreateForm ? 'Cancel' : 'Create New A/B Test'}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Create New A/B Test</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={newTest.name}
                    onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="e.g., LinkedIn Post Comparison"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newTest.description}
                    onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Brief description of the test"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Template A *
                  </label>
                  <select
                    value={newTest.template_a_id}
                    onChange={(e) => setNewTest(prev => ({ ...prev, template_a_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">Select Template A</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Template B *
                  </label>
                  <select
                    value={newTest.template_b_id}
                    onChange={(e) => setNewTest(prev => ({ ...prev, template_b_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">Select Template B</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={createAbTest}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create A/B Test'}
                </button>
              </div>
            </div>
          )}

          {/* A/B Tests List */}
          <div className="space-y-4">
            {abTests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No A/B tests found. Create your first A/B test to get started!</p>
              </div>
            ) : (
              abTests.map(test => (
                <div key={test.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                      {test.description && (
                        <p className="text-gray-400 text-sm">{test.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(test.status)}`}>
                      {test.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">Template A:</span> {test.template_a_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">Template B:</span> {test.template_b_name}
                      </p>
                    </div>
                  </div>

                  {/* Results Summary */}
                  {test.results && test.results.total_tests > 0 && (
                    <div className="mb-4 p-3 bg-gray-700 rounded">
                      <h4 className="text-sm font-medium text-white mb-2">Results Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Total Tests:</span>
                          <span className="text-white ml-1">{test.results.total_tests}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">A Wins:</span>
                          <span className="text-green-400 ml-1">{test.results.template_a_wins}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">B Wins:</span>
                          <span className="text-blue-400 ml-1">{test.results.template_b_wins}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Ties:</span>
                          <span className="text-yellow-400 ml-1">{test.results.ties}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {test.status === 'draft' && (
                      <button
                        onClick={() => startAbTest(test.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Start Test
                      </button>
                    )}
                    
                    {test.status === 'active' && (
                      <>
                        <button
                          onClick={() => onSelectTest(test)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Run Test
                        </button>
                        <button
                          onClick={() => pauseAbTest(test.id)}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                        >
                          Pause
                        </button>
                      </>
                    )}
                    
                    {test.status === 'paused' && (
                      <button
                        onClick={() => startAbTest(test.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteAbTest(test.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABTestManager;