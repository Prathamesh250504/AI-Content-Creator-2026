import { useState } from 'react';

const ABTestComparison = ({ abTestResult, onSubmitFeedback, onClose }) => {
  const [selectedWinner, setSelectedWinner] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!selectedWinner) {
      alert('Please select a winner');
      return;
    }

    setSubmitting(true);
    
    try {
      await onSubmitFeedback({
        winner: selectedWinner,
        feedback,
        template_a_output: abTestResult.template_a.content,
        template_b_output: abTestResult.template_b.content,
        quality_score_a: abTestResult.template_a.quality_score,
        quality_score_b: abTestResult.template_b.quality_score
      });
      
      alert('Feedback submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getWinnerColor = (templateKey) => {
    if (selectedWinner === templateKey) {
      return 'border-green-500 bg-green-900';
    }
    return 'border-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 lg:left-[280px]">
      <div className="glass rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">A/B Test Results</h2>
              <p className="text-gray-300">{abTestResult.ab_test_name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Comparison Metrics */}
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Comparison Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {abTestResult.template_a.word_count}
                </div>
                <div className="text-sm text-gray-300">Template A Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {abTestResult.template_b.word_count}
                </div>
                <div className="text-sm text-gray-300">Template B Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {(abTestResult.template_a.quality_score * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-300">Template A Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {(abTestResult.template_b.quality_score * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-300">Template B Quality</div>
              </div>
            </div>
          </div>

          {/* Side-by-side Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Template A */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${getWinnerColor('a')}`}
              onClick={() => setSelectedWinner('a')}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-blue-400">Template A</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="winner"
                    value="a"
                    checked={selectedWinner === 'a'}
                    onChange={(e) => setSelectedWinner(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-white">Winner</label>
                </div>
              </div>
              
              <div className="bg-gray-900 p-4 rounded border border-gray-600 mb-3">
                <div className="whitespace-pre-wrap text-sm text-gray-200">
                  {abTestResult.template_a.content}
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-300">
                <span>Words: {abTestResult.template_a.word_count}</span>
                <span>Quality: {(abTestResult.template_a.quality_score * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Template B */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${getWinnerColor('b')}`}
              onClick={() => setSelectedWinner('b')}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-purple-400">Template B</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="winner"
                    value="b"
                    checked={selectedWinner === 'b'}
                    onChange={(e) => setSelectedWinner(e.target.value)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <label className="text-sm font-medium text-white">Winner</label>
                </div>
              </div>
              
              <div className="bg-gray-900 p-4 rounded border border-gray-600 mb-3">
                <div className="whitespace-pre-wrap text-sm text-gray-200">
                  {abTestResult.template_b.content}
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-300">
                <span>Words: {abTestResult.template_b.word_count}</span>
                <span>Quality: {(abTestResult.template_b.quality_score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Tie Option */}
          <div className="mb-6">
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${getWinnerColor('tie')}`}
              onClick={() => setSelectedWinner('tie')}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="winner"
                  value="tie"
                  checked={selectedWinner === 'tie'}
                  onChange={(e) => setSelectedWinner(e.target.value)}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500"
                />
                <div>
                  <label className="text-lg font-semibold text-gray-300 cursor-pointer">
                    It's a tie
                  </label>
                  <p className="text-sm text-gray-400">
                    Both templates performed equally well
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              placeholder="Share your thoughts on why you chose this winner, what worked well, or suggestions for improvement..."
            />
          </div>

          {/* Prompt Comparison (Collapsible) */}
          <details className="mb-6">
            <summary className="cursor-pointer text-lg font-semibold text-white mb-3">
              View Prompt Comparison
            </summary>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold text-blue-400 mb-2">Template A Prompt</h4>
                <div className="bg-gray-800 p-3 rounded text-sm font-mono">
                  <pre className="whitespace-pre-wrap text-gray-200">
                    {abTestResult.template_a.rendered_prompt}
                  </pre>
                </div>
              </div>
              <div>
                <h4 className="text-md font-semibold text-purple-400 mb-2">Template B Prompt</h4>
                <div className="bg-gray-800 p-3 rounded text-sm font-mono">
                  <pre className="whitespace-pre-wrap text-gray-200">
                    {abTestResult.template_b.rendered_prompt}
                  </pre>
                </div>
              </div>
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-700 transition-colors"
            >
              Skip Feedback
            </button>
            <button
              onClick={handleSubmitFeedback}
              disabled={!selectedWinner || submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ABTestComparison;