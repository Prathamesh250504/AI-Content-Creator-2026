import { useState, useEffect } from 'react';
import authService from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';

const ABTestResults = ({ abTestResult, onClose, onSubmitResult }) => {
  const { theme } = useTheme();
  const [winner, setWinner] = useState('');
  const [templateAScore, setTemplateAScore] = useState(5);
  const [templateBScore, setTemplateBScore] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showManualSelection, setShowManualSelection] = useState(false);

  // Set automatic winner when component loads
  useEffect(() => {
    if (abTestResult?.automatic_winner?.predicted_winner) {
      const predictedWinner = abTestResult.automatic_winner.predicted_winner;
      if (predictedWinner !== 'error' && predictedWinner !== 'tie') {
        setWinner(predictedWinner);
      }
      
      // Set scores based on analysis
      if (abTestResult.template_a?.analysis?.overall_score) {
        setTemplateAScore(Math.round(abTestResult.template_a.analysis.overall_score / 10));
      }
      if (abTestResult.template_b?.analysis?.overall_score) {
        setTemplateBScore(Math.round(abTestResult.template_b.analysis.overall_score / 10));
      }
    }
  }, [abTestResult]);

  const handleSubmitResult = async () => {
    if (!winner) {
      alert('Please select a winner');
      return;
    }

    setSubmitting(true);
    try {
      const token = authService.getToken();
      const response = await fetch(`/api/ab-tests/${abTestResult.ab_test_id || abTestResult.test_id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          winner: winner,
          template_a_score: templateAScore,
          template_b_score: templateBScore,
          user_feedback: feedback
        })
      });

      if (response.ok) {
        alert('Result submitted successfully!');
        onSubmitResult();
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to submit result: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting result:', error);
      alert('Failed to submit result');
    } finally {
      setSubmitting(false);
    }
  };

  const getWinnerBadge = (predictedWinner, confidence) => {
    const colors = {
      high: 'bg-green-900 text-green-200 border-green-600',
      medium: 'bg-yellow-900 text-yellow-200 border-yellow-600',
      low: 'bg-gray-700 text-gray-300 border-gray-600'
    };
    
    // Handle numeric confidence values
    if (typeof confidence === 'number') {
      if (confidence >= 80) return colors.high;
      if (confidence >= 60) return colors.medium;
      return colors.low;
    }
    
    // Handle string confidence values
    return colors[confidence] || colors.low;
  };

  const getWinnerBadgeLight = (predictedWinner, confidence) => {
    const colors = {
      high: 'bg-green-100 text-green-800 border-green-400',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-400',
      low: 'bg-gray-100 text-gray-800 border-gray-400'
    };
    
    // Handle numeric confidence values
    if (typeof confidence === 'number') {
      if (confidence >= 80) return colors.high;
      if (confidence >= 60) return colors.medium;
      return colors.low;
    }
    
    // Handle string confidence values
    return colors[confidence] || colors.low;
  };

  const getScoreColor = (score) => {
    if (theme === 'light') {
      // Light mode - use darker colors for visibility
      if (score >= 80) return 'text-green-700';
      if (score >= 60) return 'text-yellow-700';
      return 'text-red-700';
    } else {
      // Dark mode - keep original colors
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  if (!abTestResult) return null;

  const automaticWinner = abTestResult.automatic_winner;
  const hasAutomaticAnalysis = automaticWinner && automaticWinner.predicted_winner !== 'error';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:left-[280px]">
      <div className={`${theme === 'dark' ? 'glass' : 'bg-white'} rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto ${theme === 'light' ? 'border border-gray-200' : ''}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>A/B Test Results</h2>
            <button
              onClick={onClose}
              className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>{abTestResult.ab_test_name || 'A/B Test Results'}</h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>AI-powered content analysis and comparison</p>
          </div>

          {/* Automatic Winner Prediction */}
          {hasAutomaticAnalysis && (
            <div className={`mb-6 p-4 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-blue-900 to-purple-900 border-blue-600' 
                : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center`}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Prediction
                </h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  theme === 'dark' 
                    ? getWinnerBadge(automaticWinner.predicted_winner, automaticWinner.confidence)
                    : getWinnerBadgeLight(automaticWinner.predicted_winner, automaticWinner.confidence)
                }`}>
                  {typeof automaticWinner.confidence === 'number' 
                    ? `${automaticWinner.confidence.toFixed(1)}% CONFIDENCE`
                    : `${automaticWinner.confidence || 'UNKNOWN'} CONFIDENCE`
                  }
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {automaticWinner.predicted_winner === 'tie' ? 'TIE' : 
                     automaticWinner.predicted_winner === 'a' ? 'TEMPLATE A' : 'TEMPLATE B'}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Predicted Winner</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mb-1`}>
                    {(automaticWinner.score_difference || 0).toFixed(1)}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Score Difference</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} mb-1`}>
                    {typeof automaticWinner.confidence === 'number' 
                      ? `${automaticWinner.confidence.toFixed(1)}%`
                      : automaticWinner.confidence === 'high' ? '95%' : 
                        automaticWinner.confidence === 'medium' ? '75%' : '50%'
                    }
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Confidence</div>
                </div>
              </div>
              
              <div className={`mt-4 p-3 rounded ${theme === 'dark' ? 'bg-black bg-opacity-30' : 'bg-white bg-opacity-50'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  <strong>AI Reasoning:</strong> {automaticWinner.reasoning || 'No reasoning provided'}
                </p>
              </div>
            </div>
          )}

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Template A */}
            <div className={`rounded-lg p-4 border-2 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            } ${
              hasAutomaticAnalysis && automaticWinner.predicted_winner === 'a' 
                ? 'border-green-500' : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  Template A: {abTestResult.template_a?.template_name || abTestResult.template_a?.name || 'Template A'}
                  {hasAutomaticAnalysis && automaticWinner.predicted_winner === 'a' && (
                    <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">WINNER</span>
                  )}
                </h4>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {abTestResult.template_a?.word_count || 0} words
                </span>
              </div>
              
              {/* AI Analysis Scores */}
              {abTestResult.template_a?.analysis && (
                <div className={`mb-3 p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>AI Quality Score</span>
                    <span className={`text-lg font-bold ${getScoreColor(abTestResult.template_a.analysis.overall_score || 0)}`}>
                      {(abTestResult.template_a.analysis.overall_score || 0).toFixed(1)}/100
                    </span>
                  </div>
                  
                  {abTestResult.template_a.analysis.strengths?.length > 0 && (
                    <div className="mb-2">
                      <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Strengths:</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {abTestResult.template_a.analysis.strengths.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {abTestResult.template_a.analysis.weaknesses?.length > 0 && (
                    <div>
                      <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Areas for Improvement:</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {abTestResult.template_a.analysis.weaknesses.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {abTestResult.template_a?.error ? (
                <div className={`p-4 rounded ${theme === 'dark' ? 'text-red-400 bg-red-900 bg-opacity-20' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                  Error: {abTestResult.template_a.error}
                </div>
              ) : (
                <div className={`p-4 rounded max-h-64 overflow-y-auto ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                  <pre className={`whitespace-pre-wrap text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    {abTestResult.template_a?.content || 'No content available'}
                  </pre>
                </div>
              )}

              {/* Manual Score for Template A */}
              <div className="mt-4">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Your Rating (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={templateAScore}
                  onChange={(e) => setTemplateAScore(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className={`flex justify-between text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  <span>1 (Poor)</span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{templateAScore}</span>
                  <span>10 (Excellent)</span>
                </div>
              </div>
            </div>

            {/* Template B */}
            <div className={`rounded-lg p-4 border-2 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            } ${
              hasAutomaticAnalysis && automaticWinner.predicted_winner === 'b' 
                ? 'border-green-500' : theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  Template B: {abTestResult.template_b?.template_name || abTestResult.template_b?.name || 'Template B'}
                  {hasAutomaticAnalysis && automaticWinner.predicted_winner === 'b' && (
                    <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">WINNER</span>
                  )}
                </h4>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {abTestResult.template_b?.word_count || 0} words
                </span>
              </div>
              
              {/* AI Analysis Scores */}
              {abTestResult.template_b?.analysis && (
                <div className={`mb-3 p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>AI Quality Score</span>
                    <span className={`text-lg font-bold ${getScoreColor(abTestResult.template_b.analysis.overall_score || 0)}`}>
                      {(abTestResult.template_b.analysis.overall_score || 0).toFixed(1)}/100
                    </span>
                  </div>
                  
                  {abTestResult.template_b.analysis.strengths?.length > 0 && (
                    <div className="mb-2">
                      <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Strengths:</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {abTestResult.template_b.analysis.strengths.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {abTestResult.template_b.analysis.weaknesses?.length > 0 && (
                    <div>
                      <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Areas for Improvement:</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {abTestResult.template_b.analysis.weaknesses.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {abTestResult.template_b?.error ? (
                <div className={`p-4 rounded ${theme === 'dark' ? 'text-red-400 bg-red-900 bg-opacity-20' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                  Error: {abTestResult.template_b.error}
                </div>
              ) : (
                <div className={`p-4 rounded max-h-64 overflow-y-auto ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                  <pre className={`whitespace-pre-wrap text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    {abTestResult.template_b?.content || 'No content available'}
                  </pre>
                </div>
              )}

              {/* Manual Score for Template B */}
              <div className="mt-4">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Your Rating (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={templateBScore}
                  onChange={(e) => setTemplateBScore(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className={`flex justify-between text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  <span>1 (Poor)</span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{templateBScore}</span>
                  <span>10 (Excellent)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Winner Selection */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Final Decision</h4>
              <button
                onClick={() => setShowManualSelection(!showManualSelection)}
                className={`text-sm ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                {showManualSelection ? 'Use AI Prediction' : 'Manual Override'}
              </button>
            </div>
            
            {showManualSelection ? (
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="winner"
                    value="a"
                    checked={winner === 'a'}
                    onChange={(e) => setWinner(e.target.value)}
                    className="mr-2"
                  />
                  <span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>Template A Wins</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="winner"
                    value="b"
                    checked={winner === 'b'}
                    onChange={(e) => setWinner(e.target.value)}
                    className="mr-2"
                  />
                  <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>Template B Wins</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="winner"
                    value="tie"
                    checked={winner === 'tie'}
                    onChange={(e) => setWinner(e.target.value)}
                    className="mr-2"
                  />
                  <span className={theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}>It's a Tie</span>
                </label>
              </div>
            ) : (
              <div className={`p-3 rounded border ${
                theme === 'dark' 
                  ? 'bg-blue-900 bg-opacity-30 border-blue-600' 
                  : 'bg-blue-50 border-blue-300'
              }`}>
                <p className={theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}>
                  Using AI prediction: <strong>
                    {automaticWinner?.predicted_winner === 'tie' ? 'Tie' : 
                     automaticWinner?.predicted_winner === 'a' ? 'Template A' : 'Template B'}
                  </strong>
                </p>
              </div>
            )}
          </div>

          {/* Feedback */}
          <div className="mb-6">
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Additional Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Any additional observations or feedback about the AI analysis?"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-md transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-600 text-gray-200 hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitResult}
              disabled={submitting || !winner}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Result'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABTestResults;