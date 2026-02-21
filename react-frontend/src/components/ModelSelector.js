import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Zap, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Layers,
  HelpCircle
} from 'lucide-react';
import api from '../services/api';

const ModelSelector = ({ 
  selectedModel, 
  onModelSelect, 
  contentType = 'general',
  userPreferences = {},
  showModeSelector = true,
  className = '' 
}) => {
  const [models, setModels] = useState({});
  const [modes, setModes] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [healthStatus, setHealthStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState('default');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);

  const loadModelData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all model data in parallel
      const [modesRes, modelsRes, healthRes, recommendationsRes] = await Promise.all([
        api.get('/models/modes'),
        api.get('/models/available'),
        api.get('/models/health'),
        api.post('/models/recommendations', {
          content_type: contentType,
          user_preferences: userPreferences
        })
      ]);

      if (modesRes.data.success) setModes(modesRes.data.modes);
      if (modelsRes.data.success) setModels(modelsRes.data.models);
      if (healthRes.data.success) setHealthStatus(healthRes.data.health_status);
      if (recommendationsRes.data.success) setRecommendations(recommendationsRes.data.recommendations);

    } catch (error) {
      console.error('Failed to load model data:', error);
    } finally {
      setLoading(false);
    }
  }, [contentType, userPreferences]);

  useEffect(() => {
    loadModelData();
  }, [loadModelData]);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    const modeConfig = modes[mode];
    if (modeConfig && onModelSelect) {
      onModelSelect({
        mode: mode,
        model_id: null, // Let backend choose based on mode
        model_name: modeConfig.model,
        selection_type: 'mode'
      });
    }
  };

  const handleModelSelect = (modelId) => {
    const modelConfig = models[modelId];
    if (modelConfig && onModelSelect) {
      onModelSelect({
        mode: null,
        model_id: modelId,
        model_name: modelConfig.name,
        selection_type: 'specific'
      });
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'fair': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'poor': return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'unhealthy': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'low': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const Tooltip = ({ content, children, id }) => (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(id)}
        onMouseLeave={() => setShowTooltip(null)}
        className="cursor-help"
      >
        {children}
      </div>
      {showTooltip === id && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 w-80 p-4 bg-gray-900 border border-purple-500/30 rounded-lg shadow-xl -top-2 left-full ml-2"
        >
          <div className="text-sm text-gray-200 leading-relaxed">
            {content}
          </div>
          <div className="absolute top-3 -left-2 w-4 h-4 bg-gray-900 border-l border-b border-purple-500/30 transform rotate-45"></div>
        </motion.div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={`glass rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
          <span className="text-gray-300">Loading models...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-xl p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">AI Model Selection</h3>
            <p className="text-gray-400 text-sm">Choose the best model for your content</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 transition-all duration-200 flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Star className="w-4 h-4 text-blue-400" />
            <h4 className="text-blue-300 font-medium">Recommended for {contentType}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={rec.model_id}
                className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-300 font-medium text-sm">{rec.name}</span>
                  <span className="text-blue-400 text-xs">Score: {rec.score}</span>
                </div>
                <p className="text-blue-200 text-xs">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode Selection (Simple) */}
      {showModeSelector && !showAdvanced && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white flex items-center">
            <Layers className="w-5 h-5 mr-2 text-green-400" />
            Content Modes
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(modes).map(([modeKey, mode]) => (
              <motion.div
                key={modeKey}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedMode === modeKey
                    ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/25'
                    : 'border-gray-600 bg-gray-800/50 hover:border-purple-400 hover:bg-purple-500/10'
                }`}
                onClick={() => handleModeSelect(modeKey)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{mode.icon}</span>
                    <div>
                      <h5 className="font-semibold text-white">{mode.name}</h5>
                      <p className="text-sm text-gray-400">{mode.model}</p>
                    </div>
                  </div>
                  {selectedMode === modeKey && (
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                
                <p className="text-gray-300 text-sm mb-3">{mode.description}</p>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {mode.strengths.map((strength, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    <strong>Best for:</strong> {mode.best_for.join(', ')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Model Selection */}
      {showAdvanced && (
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-orange-400" />
            Advanced Model Selection
          </h4>

          <div className="space-y-4">
            {Object.entries(models).map(([modelId, model]) => {
              const health = healthStatus[modelId] || {};
              
              return (
                <motion.div
                  key={modelId}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedModel?.model_id === modelId
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                  onClick={() => handleModelSelect(modelId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="font-semibold text-white">{model.name}</h5>
                        {getHealthIcon(health.status)}
                        <Tooltip
                          id={`health-${modelId}`}
                          content={
                            <div>
                              <p className="font-medium mb-2">Model Health Status</p>
                              <p>Status: {health.status || 'Unknown'}</p>
                              <p>Success Rate: {health.success_rate || 0}%</p>
                              <p>Avg Response Time: {health.avg_response_time || 0}s</p>
                              <p>Total Attempts: {health.total_attempts || 0}</p>
                            </div>
                          }
                        >
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                        </Tooltip>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3">{model.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="text-xs text-gray-400">Cost</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${getTierColor(model.cost_tier)}`}>
                            {model.cost_tier}
                          </span>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Zap className="w-3 h-3" />
                            <span className="text-xs text-gray-400">Speed</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${getTierColor(model.speed_tier)}`}>
                            {model.speed_tier}
                          </span>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs text-gray-400">Quality</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${getTierColor(model.quality_tier)}`}>
                            {model.quality_tier}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {model.strengths?.map((strength, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {selectedModel?.model_id === modelId && (
                      <CheckCircle className="w-5 h-5 text-purple-400 ml-4" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {(selectedModel || selectedMode) && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            <h4 className="text-purple-300 font-medium">Current Selection</h4>
          </div>
          
          {selectedModel?.selection_type === 'specific' ? (
            <div>
              <p className="text-white font-medium">{selectedModel.model_name}</p>
              <p className="text-gray-400 text-sm">Specific model selected</p>
            </div>
          ) : selectedMode && modes[selectedMode] ? (
            <div>
              <p className="text-white font-medium">{modes[selectedMode].name}</p>
              <p className="text-gray-400 text-sm">Using {modes[selectedMode].model}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;