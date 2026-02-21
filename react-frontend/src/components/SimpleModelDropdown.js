import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Cpu, Zap, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import api from '../services/api';

const SimpleModelDropdown = ({ 
  selectedModel, 
  onModelSelect, 
  contentType = 'general',
  className = '' 
}) => {
  const [models, setModels] = useState({});
  const [modes, setModes] = useState({});
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const loadModelData = useCallback(async () => {
    setLoading(true);
    try {
      const [modesRes, modelsRes] = await Promise.all([
        api.get('/models/modes'),
        api.get('/models/available')
      ]);

      if (modesRes.data.success) setModes(modesRes.data.modes);
      if (modelsRes.data.success) setModels(modelsRes.data.models);

    } catch (error) {
      console.error('Failed to load model data:', error);
      // Fallback data
      setModes({
        default: { name: 'Default (Fast)', model: 'GPT-OSS 20B', icon: '⚡' },
        high_quality: { name: 'High Quality', model: 'Llama 3.3 70B', icon: '💎' },
        structured: { name: 'Structured', model: 'Gemma 2 27B', icon: '📊' },
        creative: { name: 'Creative', model: 'Hermes 3 405B', icon: '🎨' }
      });
      setModels({
        'openai/gpt-oss-20b': { name: 'GPT-OSS 20B', cost_tier: 'low', speed_tier: 'fast', quality_tier: 'good' },
        'meta-llama/llama-3.3-70b-instruct': { name: 'Llama 3.3 70B', cost_tier: 'high', speed_tier: 'medium', quality_tier: 'excellent' },
        'google/gemma-2-27b-it': { name: 'Gemma 2 27B', cost_tier: 'medium', speed_tier: 'medium', quality_tier: 'high' },
        'nousresearch/hermes-3-llama-3.1-405b': { name: 'Hermes 3 405B', cost_tier: 'high', speed_tier: 'slow', quality_tier: 'excellent' }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModelData();
  }, [loadModelData]);

  // Create dropdown options combining modes and specific models
  const getDropdownOptions = () => {
    const options = [];
    
    // Add content modes first
    Object.entries(modes).forEach(([modeKey, mode]) => {
      options.push({
        id: `mode_${modeKey}`,
        type: 'mode',
        value: modeKey,
        label: mode.name,
        description: `${mode.icon} ${mode.model}`,
        recommended: modeKey === 'default' || modeKey === 'high_quality'
      });
    });

    // Add separator
    if (Object.keys(modes).length > 0 && Object.keys(models).length > 0) {
      options.push({ type: 'separator', label: 'Specific Models' });
    }

    // Add specific models
    Object.entries(models).forEach(([modelId, model]) => {
      options.push({
        id: `model_${modelId}`,
        type: 'model',
        value: modelId,
        label: model.name,
        description: `${getTierIcon(model.cost_tier)} ${getTierIcon(model.speed_tier)} ${getTierIcon(model.quality_tier)}`,
        cost: model.cost_tier,
        speed: model.speed_tier,
        quality: model.quality_tier
      });
    });

    return options;
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'low': return '💚';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      case 'fast': return '⚡';
      case 'slow': return '🐌';
      case 'good': return '👍';
      case 'excellent': return '⭐';
      default: return '⚪';
    }
  };

  const handleOptionSelect = (option) => {
    if (option.type === 'separator') return;
    
    setSelectedOption(option);
    setIsOpen(false);

    if (onModelSelect) {
      if (option.type === 'mode') {
        // Mode selection
        const modeConfig = modes[option.value];
        onModelSelect({
          mode: option.value,
          model_id: null,
          model_name: modeConfig?.model || option.label,
          selection_type: 'mode'
        });
      } else {
        // Specific model selection
        const modelConfig = models[option.value];
        onModelSelect({
          mode: null,
          model_id: option.value,
          model_name: modelConfig?.name || option.label,
          selection_type: 'specific'
        });
      }
    }
  };

  const getSelectedLabel = () => {
    if (selectedOption) {
      return selectedOption.label;
    }
    if (selectedModel?.selection_type === 'specific') {
      return selectedModel.model_name;
    }
    if (selectedModel?.mode && modes[selectedModel.mode]) {
      return modes[selectedModel.mode].name;
    }
    return 'Select AI Model';
  };

  const getSelectedDescription = () => {
    if (selectedOption) {
      return selectedOption.description;
    }
    if (selectedModel?.selection_type === 'specific') {
      const model = models[selectedModel.model_id];
      if (model) {
        return `${getTierIcon(model.cost_tier)} ${getTierIcon(model.speed_tier)} ${getTierIcon(model.quality_tier)}`;
      }
    }
    if (selectedModel?.mode && modes[selectedModel.mode]) {
      const mode = modes[selectedModel.mode];
      return `${mode.icon} ${mode.model}`;
    }
    return 'Choose the AI model for content generation';
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <label className="block text-sm font-medium text-white flex items-center">
          <Cpu className="w-4 h-4 mr-2 text-purple-400" />
          AI Model Selection
        </label>
        <div className="w-full input-cosmic rounded-lg px-4 py-3 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-purple-400 animate-pulse mr-2" />
          <span className="text-gray-400">Loading models...</span>
        </div>
      </div>
    );
  }

  const options = getDropdownOptions();

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-white flex items-center">
        <Cpu className="w-4 h-4 mr-2 text-purple-400" />
        AI Model Selection
        <span className="ml-2 text-xs text-gray-400">
          ({options.filter(o => o.type !== 'separator').length} available)
        </span>
      </label>
      
      <div className="relative">
        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full input-cosmic rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-purple-400 transition-colors"
        >
          <div className="flex-1">
            <div className="text-white font-medium">{getSelectedLabel()}</div>
            <div className="text-gray-400 text-sm">{getSelectedDescription()}</div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {options.map((option, index) => {
              if (option.type === 'separator') {
                return (
                  <div key={index} className="px-4 py-2 border-t border-gray-600">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {option.label}
                    </div>
                  </div>
                );
              }

              const isSelected = selectedOption?.id === option.id ||
                (selectedModel?.selection_type === 'mode' && selectedModel.mode === option.value) ||
                (selectedModel?.selection_type === 'specific' && selectedModel.model_id === option.value);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-purple-600/20 border-l-4 border-purple-500' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{option.label}</span>
                      {option.recommended && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                          Recommended
                        </span>
                      )}
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">{option.description}</div>
                    
                    {/* Show tier info for specific models */}
                    {option.type === 'model' && (
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500 capitalize">{option.cost}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500 capitalize">{option.speed}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500 capitalize">{option.quality}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selection Info */}
      {selectedOption && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 font-medium text-sm">Selected Model</span>
          </div>
          <div className="text-white font-medium">{selectedOption.label}</div>
          <div className="text-gray-400 text-sm">
            {selectedOption.type === 'mode' ? 'Content Mode' : 'Specific Model'}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SimpleModelDropdown;