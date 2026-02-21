import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Calendar, 
  TrendingUp, 
  Eye, 
  Trophy,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';
import authService from '../services/authService';
import ABTestResults from '../components/ABTestResults';

const ABTestHistory = () => {
  const [abTests, setAbTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadABTests();
  }, []);

  const loadABTests = async () => {
    const token = authService.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load both A/B tests and their results
      const [testsResponse, resultsResponse] = await Promise.all([
        fetch('/api/ab-tests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/ab-test-results', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);
      
      let tests = [];
      let results = [];
      
      if (testsResponse.ok) {
        const testsData = await testsResponse.json();
        tests = testsData.ab_tests || [];
      }
      
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        results = resultsData.results || [];
      }
      
      // Group results by test ID
      const resultsByTestId = {};
      results.forEach(result => {
        if (!resultsByTestId[result.ab_test_id]) {
          resultsByTestId[result.ab_test_id] = [];
        }
        resultsByTestId[result.ab_test_id].push(result);
      });
      
      // Merge tests with their results
      const testsWithResults = tests.map(test => {
        const testResults = resultsByTestId[test.id] || [];
        return {
          ...test,
          results: testResults,
          hasResults: testResults.length > 0,
          // Calculate summary from results
          resultsSummary: testResults.length > 0 ? {
            total_results: testResults.length,
            template_a_wins: testResults.filter(r => r.winner === 'a').length,
            template_b_wins: testResults.filter(r => r.winner === 'b').length,
            ties: testResults.filter(r => r.winner === 'tie').length,
            latest_result: testResults[0] // Results are sorted by date desc
          } : null
        };
      });
      
      setAbTests(testsWithResults);
      
    } catch (error) {
      console.error('Error loading A/B tests:', error);
      // Fallback: just load the tests without results
      try {
        const response = await fetch('/api/ab-tests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAbTests(data.ab_tests || []);
        }
      } catch (fallbackError) {
        console.error('Fallback loading failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTests = () => {
    let filtered = abTests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(test => 
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(test => test.status === filterStatus);
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filtered;
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

  const getWinnerInfo = (test) => {
    if (!test.results || test.results.length === 0) {
      return { winner: 'No results yet', confidence: 0, reason: 'No test results available' };
    }

    const summary = test.resultsSummary;
    if (!summary) {
      return { winner: 'No results yet', confidence: 0, reason: 'No test results available' };
    }

    // Determine winner based on actual results
    let winner = 'Tie';
    let confidence = 0;
    let reason = 'Based on user feedback';

    if (summary.template_a_wins > summary.template_b_wins) {
      winner = 'Template A';
      confidence = Math.round((summary.template_a_wins / summary.total_results) * 100);
    } else if (summary.template_b_wins > summary.template_a_wins) {
      winner = 'Template B';
      confidence = Math.round((summary.template_b_wins / summary.total_results) * 100);
    } else {
      winner = 'Tie';
      confidence = 50;
    }

    // Add more detailed reason
    if (summary.total_results === 1) {
      reason = `Single test result: ${winner.toLowerCase()} selected`;
    } else {
      reason = `${summary.total_results} tests: ${summary.template_a_wins} A wins, ${summary.template_b_wins} B wins, ${summary.ties} ties`;
    }

    return { winner, confidence, reason };
  };

  const handleViewResults = (test) => {
    if (test.results && test.results.length > 0) {
      // Use the latest result for display
      const latestResult = test.results[0]; // Results are sorted by date desc
      
      // Transform the test data to match what ABTestResults expects
      const transformedResult = {
        ab_test_id: test.id,
        ab_test_name: test.name,
        template_a: {
          template_name: test.template_a_name || 'Template A',
          content: 'Content generated during test',
          word_count: 0
        },
        template_b: {
          template_name: test.template_b_name || 'Template B', 
          content: 'Content generated during test',
          word_count: 0
        },
        automatic_winner: {
          predicted_winner: latestResult.winner || 'none',
          confidence: latestResult.template_a_score && latestResult.template_b_score 
            ? Math.abs(latestResult.template_a_score - latestResult.template_b_score) * 10
            : 0,
          reasoning: latestResult.user_feedback || 'User selected winner based on manual evaluation',
          score_difference: latestResult.template_a_score && latestResult.template_b_score 
            ? Math.abs(latestResult.template_a_score - latestResult.template_b_score)
            : 0
        },
        // Add the actual MongoDB results data
        mongodb_results: test.results,
        results_summary: test.resultsSummary
      };
      
      setSelectedTest(transformedResult);
      setShowResults(true);
    }
  };

  const exportResults = async (test) => {
    try {
      const dataStr = JSON.stringify(test, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ab-test-${test.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const filteredTests = getFilteredTests();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="bg-hero-gradient rounded-3xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🧪 A/B Test Results</h1>
          <p className="text-xl text-white/90">View and analyze your A/B test performance</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search A/B tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full input-cosmic rounded-lg pl-10 pr-4 py-3"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-cosmic rounded-lg pl-10 pr-4 py-3 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{abTests.length}</div>
            <div className="text-sm text-gray-400">Total Tests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {abTests.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {abTests.filter(t => t.hasResults).length}
            </div>
            <div className="text-sm text-gray-400">With Results</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{filteredTests.length}</div>
            <div className="text-sm text-gray-400">Filtered Results</div>
          </div>
        </div>
      </motion.div>

      {/* A/B Tests List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading A/B tests...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4 opacity-60">🧪</div>
            <h3 className="text-xl font-bold text-white mb-2">No A/B Tests Found</h3>
            <p className="text-gray-400 mb-6">
              {abTests.length === 0 
                ? "You haven't created any A/B tests yet. Start testing to see results here!"
                : "No tests match your current filters. Try adjusting your search or filters."
              }
            </p>
            {abTests.length === 0 && (
              <a
                href="/generator"
                className="inline-flex items-center px-6 py-3 btn-cosmic text-white font-medium rounded-lg"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Create A/B Test
              </a>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTests.map((test, index) => {
              const winnerInfo = getWinnerInfo(test);
              
              return (
                <motion.div
                  key={test.test_id || `test-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-xl p-6 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(test.status)}`}>
                          {test.status.toUpperCase()}
                        </span>
                        {winnerInfo.winner !== 'No results yet' && (
                          <span className="px-2 py-1 bg-yellow-600/30 text-yellow-300 text-xs rounded-full flex items-center">
                            <Trophy className="w-3 h-3 mr-1" />
                            Winner: {winnerInfo.winner}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-300 mb-3">{test.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(test.created_at).toLocaleDateString()}
                        </div>
                        {winnerInfo.confidence > 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {winnerInfo.confidence.toFixed(1)}% confidence
                          </div>
                        )}
                      </div>

                      {/* Templates Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-black/20 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-purple-300 mb-1">Template A</h4>
                          <p className="text-xs text-gray-400">{test.template_a?.name || 'Template A'}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-purple-300 mb-1">Template B</h4>
                          <p className="text-xs text-gray-400">{test.template_b?.name || 'Template B'}</p>
                        </div>
                      </div>

                      {/* Results Summary */}
                      {test.hasResults && test.resultsSummary && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-300">Test Results Summary</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-white font-medium">{test.resultsSummary.total_results}</div>
                              <div className="text-gray-400">Total Tests</div>
                            </div>
                            <div className="text-center">
                              <div className="text-purple-300 font-medium">{test.resultsSummary.template_a_wins}</div>
                              <div className="text-gray-400">A Wins</div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-300 font-medium">{test.resultsSummary.template_b_wins}</div>
                              <div className="text-gray-400">B Wins</div>
                            </div>
                            <div className="text-center">
                              <div className="text-yellow-300 font-medium">{test.resultsSummary.ties}</div>
                              <div className="text-gray-400">Ties</div>
                            </div>
                          </div>
                          {test.resultsSummary.latest_result && (
                            <div className="mt-2 pt-2 border-t border-gray-600">
                              <div className="text-xs text-gray-300">
                                Latest: {new Date(test.resultsSummary.latest_result.created_at).toLocaleDateString()}
                                {test.resultsSummary.latest_result.user_feedback && (
                                  <span className="ml-2 italic">"{test.resultsSummary.latest_result.user_feedback.substring(0, 50)}..."</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Winner Analysis */}
                      {winnerInfo.winner !== 'No results yet' && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium text-green-300">Results Analysis</span>
                          </div>
                          <p className="text-xs text-gray-300">{winnerInfo.reason}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {test.hasResults && (
                        <button
                          onClick={() => handleViewResults(test)}
                          className="p-2 glass glass-hover rounded-lg text-blue-400 hover:text-blue-300"
                          title="View detailed results"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => exportResults(test)}
                        className="p-2 glass glass-hover rounded-lg text-green-400 hover:text-green-300"
                        title="Export results"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Results Modal */}
      {showResults && selectedTest && (
        <ABTestResults
          abTestResult={selectedTest}
          onClose={() => {
            setShowResults(false);
            setSelectedTest(null);
          }}
        />
      )}
    </div>
  );
};

export default ABTestHistory;