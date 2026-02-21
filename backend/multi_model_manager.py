"""
Multi-Model Manager for OpenRouter AI Integration
Supports multiple LLM providers with fallback mechanisms and mode-based selection
"""

import os
import requests
import json
import time
from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

class ContentMode(Enum):
    """Content generation modes with specific model assignments"""
    DEFAULT = "default"
    HIGH_QUALITY = "high_quality"
    STRUCTURED = "structured"
    CREATIVE = "creative"

@dataclass
class ModelConfig:
    """Configuration for each LLM model"""
    name: str
    model_id: str
    description: str
    strengths: List[str]
    optimal_temperature: float
    max_tokens: int
    cost_tier: str  # low, medium, high
    speed_tier: str  # fast, medium, slow
    quality_tier: str  # good, high, excellent
    
class MultiModelManager:
    """Manages multiple LLM models with intelligent selection and fallback"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")
        self.site_url = os.getenv("OPENROUTER_SITE_URL", "http://localhost:3000")
        self.app_name = os.getenv("OPENROUTER_APP_NAME", "AI Content Creator")
        
        # Configuration settings
        self.enable_fallback = os.getenv("ENABLE_MODEL_FALLBACK", "true").lower() == "true"
        self.max_consecutive_failures = int(os.getenv("MAX_CONSECUTIVE_FAILURES", "3"))
        self.request_timeout = int(os.getenv("MODEL_REQUEST_TIMEOUT", "60"))
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")
        
        # Initialize model configurations
        self.models = self._initialize_models()
        self.mode_mappings = self._initialize_mode_mappings()
        self.fallback_chains = self._initialize_fallback_chains()
        
        # Track model performance
        self.model_stats = {
            model_id: {
                'success_count': 0,
                'failure_count': 0,
                'avg_response_time': 0,
                'last_used': None,
                'consecutive_failures': 0
            }
            for model_id in self.models.keys()
        }
    
    def _initialize_models(self) -> Dict[str, ModelConfig]:
        """Initialize all available models with their configurations from environment variables"""
        return {
            # Default/Fast Mode - GPT-OSS-20B
            os.getenv("DEFAULT_MODEL_ID", "openai/gpt-oss-20b"): ModelConfig(
                name=os.getenv("DEFAULT_MODEL_NAME", "GPT-OSS 20B"),
                model_id=os.getenv("DEFAULT_MODEL_ID", "openai/gpt-oss-20b"),
                description="Fast, efficient model for general content generation",
                strengths=["Speed", "General Purpose", "Cost Effective", "Reliable"],
                optimal_temperature=float(os.getenv("DEFAULT_MODEL_TEMPERATURE", "0.7")),
                max_tokens=int(os.getenv("DEFAULT_MODEL_MAX_TOKENS", "2000")),
                cost_tier="low",
                speed_tier="fast",
                quality_tier="good"
            ),
            
            # High Quality Mode - Llama 3.3 70B
            os.getenv("HIGH_QUALITY_MODEL_ID", "meta-llama/llama-3.3-70b-instruct"): ModelConfig(
                name=os.getenv("HIGH_QUALITY_MODEL_NAME", "Llama 3.3 70B Instruct"),
                model_id=os.getenv("HIGH_QUALITY_MODEL_ID", "meta-llama/llama-3.3-70b-instruct"),
                description="High-quality model for premium content generation",
                strengths=["High Quality", "Detailed Responses", "Complex Reasoning", "Professional Content"],
                optimal_temperature=float(os.getenv("HIGH_QUALITY_MODEL_TEMPERATURE", "0.6")),
                max_tokens=int(os.getenv("HIGH_QUALITY_MODEL_MAX_TOKENS", "3000")),
                cost_tier="high",
                speed_tier="medium",
                quality_tier="excellent"
            ),
            
            # Structured/Tech Mode - Gemma 2 27B
            os.getenv("STRUCTURED_MODEL_ID", "google/gemma-2-27b-it"): ModelConfig(
                name=os.getenv("STRUCTURED_MODEL_NAME", "Gemma 2 27B IT"),
                model_id=os.getenv("STRUCTURED_MODEL_ID", "google/gemma-2-27b-it"),
                description="Optimized for structured, technical, and analytical content",
                strengths=["Technical Writing", "Structured Content", "Analysis", "Documentation"],
                optimal_temperature=float(os.getenv("STRUCTURED_MODEL_TEMPERATURE", "0.5")),
                max_tokens=int(os.getenv("STRUCTURED_MODEL_MAX_TOKENS", "2500")),
                cost_tier="medium",
                speed_tier="medium",
                quality_tier="high"
            ),
            
            # Creative Mode - Hermes 3 405B
            os.getenv("CREATIVE_MODEL_ID", "nousresearch/hermes-3-llama-3.1-405b"): ModelConfig(
                name=os.getenv("CREATIVE_MODEL_NAME", "Hermes 3 Llama 405B"),
                model_id=os.getenv("CREATIVE_MODEL_ID", "nousresearch/hermes-3-llama-3.1-405b"),
                description="Ultra-creative model for innovative and engaging content",
                strengths=["Creativity", "Storytelling", "Innovation", "Engaging Content"],
                optimal_temperature=float(os.getenv("CREATIVE_MODEL_TEMPERATURE", "0.8")),
                max_tokens=int(os.getenv("CREATIVE_MODEL_MAX_TOKENS", "3500")),
                cost_tier="high",
                speed_tier="slow",
                quality_tier="excellent"
            )
        }
    
    def _initialize_mode_mappings(self) -> Dict[ContentMode, str]:
        """Map content modes to their primary models"""
        return {
            ContentMode.DEFAULT: os.getenv("DEFAULT_MODEL_ID", "openai/gpt-oss-20b"),
            ContentMode.HIGH_QUALITY: os.getenv("HIGH_QUALITY_MODEL_ID", "meta-llama/llama-3.3-70b-instruct"),
            ContentMode.STRUCTURED: os.getenv("STRUCTURED_MODEL_ID", "google/gemma-2-27b-it"),
            ContentMode.CREATIVE: os.getenv("CREATIVE_MODEL_ID", "nousresearch/hermes-3-llama-3.1-405b")
        }
    
    def _initialize_fallback_chains(self) -> Dict[str, List[str]]:
        """Define fallback chains for each model"""
        return {
            "openai/gpt-oss-20b": [
                "google/gemma-2-27b-it",
                "meta-llama/llama-3.3-70b-instruct"
            ],
            "meta-llama/llama-3.3-70b-instruct": [
                "google/gemma-2-27b-it",
                "openai/gpt-oss-20b"
            ],
            "google/gemma-2-27b-it": [
                "openai/gpt-oss-20b",
                "meta-llama/llama-3.3-70b-instruct"
            ],
            "nousresearch/hermes-3-llama-3.1-405b": [
                "meta-llama/llama-3.3-70b-instruct",
                "google/gemma-2-27b-it",
                "openai/gpt-oss-20b"
            ]
        }
    
    def get_model_for_mode(self, mode: ContentMode) -> str:
        """Get the primary model for a given content mode"""
        return self.mode_mappings.get(mode, self.mode_mappings[ContentMode.DEFAULT])
    
    def get_available_models(self) -> Dict[str, Dict]:
        """Get all available models with their information"""
        return {
            model_id: {
                'name': config.name,
                'description': config.description,
                'strengths': config.strengths,
                'cost_tier': config.cost_tier,
                'speed_tier': config.speed_tier,
                'quality_tier': config.quality_tier,
                'stats': self.model_stats[model_id]
            }
            for model_id, config in self.models.items()
        }
    
    def get_model_recommendations(self, content_type: str, user_preferences: Dict) -> List[Dict]:
        """Get model recommendations based on content type and user preferences"""
        recommendations = []
        
        # Priority mapping based on content type
        content_priorities = {
            'blog_post': [ContentMode.HIGH_QUALITY, ContentMode.STRUCTURED, ContentMode.DEFAULT],
            'social_media': [ContentMode.CREATIVE, ContentMode.DEFAULT, ContentMode.HIGH_QUALITY],
            'technical_doc': [ContentMode.STRUCTURED, ContentMode.HIGH_QUALITY, ContentMode.DEFAULT],
            'marketing_copy': [ContentMode.CREATIVE, ContentMode.HIGH_QUALITY, ContentMode.DEFAULT],
            'email': [ContentMode.DEFAULT, ContentMode.HIGH_QUALITY, ContentMode.CREATIVE],
            'press_release': [ContentMode.STRUCTURED, ContentMode.HIGH_QUALITY, ContentMode.DEFAULT]
        }
        
        # Get priority modes for content type
        priority_modes = content_priorities.get(content_type, [ContentMode.DEFAULT])
        
        # User preference factors
        speed_preference = user_preferences.get('speed_priority', 'medium')
        quality_preference = user_preferences.get('quality_priority', 'high')
        cost_preference = user_preferences.get('cost_priority', 'medium')
        
        for mode in priority_modes:
            model_id = self.get_model_for_mode(mode)
            config = self.models[model_id]
            stats = self.model_stats[model_id]
            
            # Calculate recommendation score
            score = self._calculate_recommendation_score(
                config, stats, speed_preference, quality_preference, cost_preference
            )
            
            recommendations.append({
                'mode': mode.value,
                'model_id': model_id,
                'name': config.name,
                'description': config.description,
                'score': score,
                'strengths': config.strengths,
                'tiers': {
                    'cost': config.cost_tier,
                    'speed': config.speed_tier,
                    'quality': config.quality_tier
                }
            })
        
        # Sort by score (highest first)
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations
    
    def _calculate_recommendation_score(self, config: ModelConfig, stats: Dict, 
                                      speed_pref: str, quality_pref: str, cost_pref: str) -> float:
        """Calculate recommendation score based on preferences and model performance"""
        score = 0.0
        
        # Speed scoring
        speed_scores = {'fast': 3, 'medium': 2, 'slow': 1}
        speed_weights = {'high': 0.4, 'medium': 0.3, 'low': 0.2}
        score += speed_scores.get(config.speed_tier, 1) * speed_weights.get(speed_pref, 0.3)
        
        # Quality scoring
        quality_scores = {'excellent': 3, 'high': 2, 'good': 1}
        quality_weights = {'high': 0.4, 'medium': 0.3, 'low': 0.2}
        score += quality_scores.get(config.quality_tier, 1) * quality_weights.get(quality_pref, 0.4)
        
        # Cost scoring (inverted - lower cost = higher score)
        cost_scores = {'low': 3, 'medium': 2, 'high': 1}
        cost_weights = {'high': 0.4, 'medium': 0.3, 'low': 0.2}
        score += cost_scores.get(config.cost_tier, 1) * cost_weights.get(cost_pref, 0.3)
        
        # Performance bonus based on success rate
        total_attempts = stats['success_count'] + stats['failure_count']
        if total_attempts > 0:
            success_rate = stats['success_count'] / total_attempts
            score += success_rate * 0.5  # Up to 0.5 bonus for high success rate
        
        # Penalty for consecutive failures
        score -= stats['consecutive_failures'] * 0.1
        
        return round(score, 2)
    
    def generate_content_with_model(self, model_id: str, system_prompt: str, 
                                  user_prompt: str, **kwargs) -> Tuple[bool, str, Dict]:
        """Generate content using a specific model with performance tracking"""
        start_time = time.time()
        
        try:
            config = self.models.get(model_id)
            if not config:
                return False, f"Model {model_id} not found", {}
            
            # Prepare request parameters
            temperature = kwargs.get('temperature', config.optimal_temperature)
            max_tokens = kwargs.get('max_tokens', config.max_tokens)
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": self.site_url,
                "X-Title": self.app_name
            }
            
            data = {
                "model": model_id,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
                "top_p": kwargs.get('top_p', 0.9),
                "frequency_penalty": kwargs.get('frequency_penalty', 0.1),
                "presence_penalty": kwargs.get('presence_penalty', 0.1)
            }
            
            # Make API request
            response = requests.post(self.base_url, headers=headers, json=data, timeout=self.request_timeout)
            response.raise_for_status()
            
            result = response.json()
            
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                
                # Update success stats
                response_time = time.time() - start_time
                self._update_model_stats(model_id, True, response_time)
                
                # Return success with metadata
                metadata = {
                    'model_used': model_id,
                    'model_name': config.name,
                    'response_time': response_time,
                    'tokens_used': result.get('usage', {}).get('total_tokens', 0),
                    'mode': self._get_mode_for_model(model_id)
                }
                
                return True, content, metadata
            else:
                self._update_model_stats(model_id, False, time.time() - start_time)
                return False, "No content generated", {}
                
        except requests.exceptions.RequestException as e:
            self._update_model_stats(model_id, False, time.time() - start_time)
            return False, f"API request error: {str(e)}", {}
        except Exception as e:
            self._update_model_stats(model_id, False, time.time() - start_time)
            return False, f"Unexpected error: {str(e)}", {}
    
    def generate_content_with_fallback(self, primary_model: str, system_prompt: str, 
                                     user_prompt: str, **kwargs) -> Tuple[bool, str, Dict]:
        """Generate content with automatic fallback to alternative models"""
        
        # Try primary model first
        success, content, metadata = self.generate_content_with_model(
            primary_model, system_prompt, user_prompt, **kwargs
        )
        
        if success:
            return success, content, metadata
        
        # Check if fallback is enabled
        if not self.enable_fallback:
            return success, content, metadata
        
        # Try fallback models
        fallback_models = self.fallback_chains.get(primary_model, [])
        
        for fallback_model in fallback_models:
            # Skip if model has too many consecutive failures
            if self.model_stats[fallback_model]['consecutive_failures'] >= self.max_consecutive_failures:
                continue
                
            success, content, metadata = self.generate_content_with_model(
                fallback_model, system_prompt, user_prompt, **kwargs
            )
            
            if success:
                # Add fallback information to metadata
                metadata['fallback_used'] = True
                metadata['primary_model_failed'] = primary_model
                return success, content, metadata
        
        # All models failed
        return False, f"All models failed. Primary: {primary_model}, Fallbacks: {fallback_models}", {}
    
    def generate_content_by_mode(self, mode: ContentMode, system_prompt: str, 
                               user_prompt: str, **kwargs) -> Tuple[bool, str, Dict]:
        """Generate content using the optimal model for a specific mode"""
        primary_model = self.get_model_for_mode(mode)
        
        # Add mode-specific optimizations
        config = self.models[primary_model]
        
        # Override parameters based on mode
        if mode == ContentMode.CREATIVE:
            kwargs['temperature'] = kwargs.get('temperature', 0.8)
            kwargs['top_p'] = kwargs.get('top_p', 0.95)
        elif mode == ContentMode.STRUCTURED:
            kwargs['temperature'] = kwargs.get('temperature', 0.5)
            kwargs['top_p'] = kwargs.get('top_p', 0.85)
        elif mode == ContentMode.HIGH_QUALITY:
            kwargs['temperature'] = kwargs.get('temperature', 0.6)
            kwargs['max_tokens'] = kwargs.get('max_tokens', 3000)
        
        return self.generate_content_with_fallback(
            primary_model, system_prompt, user_prompt, **kwargs
        )
    
    def _update_model_stats(self, model_id: str, success: bool, response_time: float):
        """Update performance statistics for a model"""
        stats = self.model_stats[model_id]
        
        if success:
            stats['success_count'] += 1
            stats['consecutive_failures'] = 0
            
            # Update average response time
            total_successes = stats['success_count']
            current_avg = stats['avg_response_time']
            stats['avg_response_time'] = ((current_avg * (total_successes - 1)) + response_time) / total_successes
        else:
            stats['failure_count'] += 1
            stats['consecutive_failures'] += 1
        
        stats['last_used'] = time.time()
    
    def _get_mode_for_model(self, model_id: str) -> str:
        """Get the mode associated with a model"""
        for mode, mapped_model in self.mode_mappings.items():
            if mapped_model == model_id:
                return mode.value
        return ContentMode.DEFAULT.value
    
    def get_model_health_status(self) -> Dict[str, Dict]:
        """Get health status of all models"""
        health_status = {}
        
        for model_id, stats in self.model_stats.items():
            config = self.models[model_id]
            total_attempts = stats['success_count'] + stats['failure_count']
            
            if total_attempts == 0:
                status = "untested"
                success_rate = 0
            else:
                success_rate = (stats['success_count'] / total_attempts) * 100
                
                if stats['consecutive_failures'] >= self.max_consecutive_failures:
                    status = "unhealthy"
                elif success_rate >= 90:
                    status = "excellent"
                elif success_rate >= 75:
                    status = "good"
                elif success_rate >= 50:
                    status = "fair"
                else:
                    status = "poor"
            
            health_status[model_id] = {
                'name': config.name,
                'status': status,
                'success_rate': round(success_rate, 1),
                'avg_response_time': round(stats['avg_response_time'], 2),
                'consecutive_failures': stats['consecutive_failures'],
                'total_attempts': total_attempts,
                'last_used': stats['last_used']
            }
        
        return health_status

# Global instance
multi_model_manager = MultiModelManager()