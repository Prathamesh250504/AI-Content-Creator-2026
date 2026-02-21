"""
Enhanced Multi-Content Generation Engine with Advanced Prompt Templates
Supports custom prompt templates, A/B testing, and advanced prompt engineering
"""

import json
import time
import random
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from dataclasses import dataclass

# Import existing modules
from content_templates import template_manager
from parameter_engine import parameter_engine
from content_quality_analyzer import quality_analyzer
# Import prompt_template_manager only when needed to avoid circular imports

class ContentGenerationMode(Enum):
    """Content generation modes"""
    STANDARD = "standard"  # Use existing template system
    ADVANCED = "advanced"  # Use custom prompt templates
    AB_TEST = "ab_test"    # A/B test between two templates

@dataclass
class AdvancedGenerationRequest:
    """Request for advanced content generation"""
    mode: ContentGenerationMode
    template_id: Optional[str] = None  # For advanced mode
    ab_test_id: Optional[str] = None   # For A/B testing
    variables: Dict[str, Any] = None   # Template variables
    fallback_template_key: str = "linkedin_post"  # Fallback to standard templates
    
    def __post_init__(self):
        if self.variables is None:
            self.variables = {}

class EnhancedMultiContentGenerator:
    """Enhanced content generator with prompt template support"""
    
    def __init__(self, llm_client):
        self.llm_client = llm_client
        self.validator = ContentValidator()
    
    def generate_content_advanced(self, request: AdvancedGenerationRequest, 
                                user_prompt: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate content using advanced prompt templates"""
        
        if request.mode == ContentGenerationMode.STANDARD:
            # Use existing template system
            return self.generate_single_content(
                request.fallback_template_key, user_prompt, parameters
            )
        
        elif request.mode == ContentGenerationMode.ADVANCED:
            # Use custom prompt template
            return self._generate_with_custom_template(
                request.template_id, request.variables, user_prompt, parameters
            )
        
        elif request.mode == ContentGenerationMode.AB_TEST:
            # Perform A/B test
            return self._generate_ab_test(
                request.ab_test_id, request.variables, user_prompt, parameters
            )
        
        else:
            raise ValueError(f"Unsupported generation mode: {request.mode}")
    
    def _generate_with_custom_template(self, template_id: str, variables: Dict[str, Any],
                                     user_prompt: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate content using a custom prompt template"""
        
        try:
            # Import locally to avoid circular imports
            from prompt_template_manager import prompt_template_manager
            
            # Get the template
            template = prompt_template_manager.get_template(template_id)
            if not template:
                return {
                    'success': False,
                    'error': f'Template {template_id} not found',
                    'fallback_used': False
                }
            
            # Validate variables
            is_valid, validation_errors = prompt_template_manager.validate_template_variables(
                template_id, variables
            )
            
            if not is_valid:
                return {
                    'success': False,
                    'error': f'Variable validation failed: {", ".join(validation_errors)}',
                    'validation_errors': validation_errors
                }
            
            # Merge user prompt into variables if not already provided
            if 'user_prompt' not in variables and user_prompt:
                variables['user_prompt'] = user_prompt
            
            # Render the template
            rendered_prompt = prompt_template_manager.render_template(template_id, variables)
            
            # Generate content using the rendered prompt
            generation_result = self._generate_with_rendered_prompt(
                rendered_prompt, parameters, template.name
            )
            
            # Add template metadata to result
            generation_result.update({
                'template_id': template_id,
                'template_name': template.name,
                'template_category': template.category.value,
                'rendered_prompt': rendered_prompt,
                'variables_used': variables,
                'generation_mode': 'advanced'
            })
            
            return generation_result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Advanced generation failed: {str(e)}',
                'fallback_used': False
            }
    
    def _generate_ab_test(self, ab_test_id: str, variables: Dict[str, Any],
                         user_prompt: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate content for A/B testing"""
        
        try:
            # Import locally to avoid circular imports
            from prompt_template_manager import prompt_template_manager
            
            # Get the A/B test configuration
            ab_test = prompt_template_manager.get_ab_test(ab_test_id)
            if not ab_test:
                return {
                    'success': False,
                    'error': f'A/B test {ab_test_id} not found'
                }
            
            # Generate content with both templates
            result_a = self._generate_with_custom_template(
                ab_test.template_a_id, variables.copy(), user_prompt, parameters.copy()
            )
            
            result_b = self._generate_with_custom_template(
                ab_test.template_b_id, variables.copy(), user_prompt, parameters.copy()
            )
            
            if not result_a['success'] or not result_b['success']:
                return {
                    'success': False,
                    'error': 'One or both A/B test templates failed to generate content',
                    'result_a': result_a,
                    'result_b': result_b
                }
            
            # Return both results for comparison
            return {
                'success': True,
                'generation_mode': 'ab_test',
                'ab_test_id': ab_test_id,
                'ab_test_name': ab_test.name,
                'template_a': {
                    'id': ab_test.template_a_id,
                    'content': result_a['content'],
                    'quality_score': result_a.get('quality_score', 0),
                    'word_count': result_a.get('word_count', 0),
                    'rendered_prompt': result_a.get('rendered_prompt', '')
                },
                'template_b': {
                    'id': ab_test.template_b_id,
                    'content': result_b['content'],
                    'quality_score': result_b.get('quality_score', 0),
                    'word_count': result_b.get('word_count', 0),
                    'rendered_prompt': result_b.get('rendered_prompt', '')
                },
                'variables_used': variables,
                'comparison_metrics': {
                    'length_difference': abs(result_a.get('word_count', 0) - result_b.get('word_count', 0)),
                    'quality_difference': abs(result_a.get('quality_score', 0) - result_b.get('quality_score', 0))
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'A/B test generation failed: {str(e)}'
            }
    
    def _generate_with_rendered_prompt(self, rendered_prompt: str, parameters: Dict[str, Any],
                                     template_name: str = "Custom Template") -> Dict[str, Any]:
        """Generate content using a fully rendered prompt"""
        
        try:
            # Enhance the prompt with parameter requirements
            enhanced_prompt = self._enhance_prompt_with_parameters(rendered_prompt, parameters)
            
            # Generate content
            start_time = time.time()
            
            print(f"DEBUG: About to call LLM with prompt length: {len(enhanced_prompt)}")
            
            response = self.llm_client.generate_content(
                enhanced_prompt,
                max_tokens=parameters.get('max_tokens', 2000)
            )
            
            print(f"DEBUG: LLM response: {response[:100] if response else 'None'}...")
            
            generation_time = time.time() - start_time
            
            # Check if response is an error message
            if not response or response.startswith("Error"):
                return {
                    'success': False,
                    'error': response if response else 'No content generated from LLM'
                }
            
            content = response.strip()
            
            # Validate and analyze content
            word_count = len(content.split())
            char_count = len(content)
            
            # Quality analysis
            quality_score = self._calculate_quality_score(content, parameters)
            
            # Content validation
            validation_result = self._validate_generated_content(content, parameters)
            
            return {
                'success': True,
                'content': content,
                'word_count': word_count,
                'char_count': char_count,
                'quality_score': quality_score,
                'generation_time': generation_time,
                'model_used': self.llm_client.model,
                'template_used': template_name,
                'validation': validation_result,
                'enhanced_prompt_used': True
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Content generation failed: {str(e)}'
            }
    
    def _enhance_prompt_with_parameters(self, base_prompt: str, parameters: Dict[str, Any]) -> str:
        """Enhance the base prompt with parameter requirements"""
        
        enhancements = []
        
        # Length requirements
        if 'length' in parameters:
            length_spec = parameters['length']
            if 'short' in length_spec.lower():
                enhancements.append("Keep the response concise and to the point (50-150 words).")
            elif 'medium' in length_spec.lower():
                enhancements.append("Provide a moderate length response (150-400 words).")
            elif 'long' in length_spec.lower():
                enhancements.append("Provide a comprehensive, detailed response (400+ words).")
        
        # Tone requirements
        if 'tone' in parameters:
            tone = parameters['tone']
            enhancements.append(f"Use a {tone} tone throughout the content.")
        
        # Quality requirements
        if 'creativity' in parameters:
            creativity = parameters.get('creativity', 50)
            if creativity > 75:
                enhancements.append("Be highly creative and original in your approach.")
            elif creativity > 50:
                enhancements.append("Include creative elements while maintaining professionalism.")
            else:
                enhancements.append("Focus on clarity and straightforward communication.")
        
        # Content mode requirements
        if 'content_mode' in parameters:
            mode = parameters['content_mode']
            if mode == 'high_quality':
                enhancements.append("Ensure the highest quality output with attention to detail.")
            elif mode == 'creative':
                enhancements.append("Prioritize creativity and unique perspectives.")
            elif mode == 'structured':
                enhancements.append("Use clear structure and logical organization.")
        
        # Combine base prompt with enhancements
        if enhancements:
            enhanced_prompt = f"{base_prompt}\n\nAdditional Requirements:\n" + "\n".join(f"- {req}" for req in enhancements)
        else:
            enhanced_prompt = base_prompt
        
        return enhanced_prompt
    
    def _calculate_quality_score(self, content: str, parameters: Dict[str, Any]) -> float:
        """Calculate quality score for generated content"""
        
        try:
            # Use existing quality analyzer
            analysis = quality_analyzer.analyze_content(content)
            
            base_score = analysis.get('overall_score', 0.5)
            
            # Adjust based on parameter compliance
            length_compliance = self._check_length_compliance(content, parameters)
            tone_compliance = self._check_tone_compliance(content, parameters)
            
            # Weighted quality score
            quality_score = (
                base_score * 0.6 +
                length_compliance * 0.2 +
                tone_compliance * 0.2
            )
            
            return min(1.0, max(0.0, quality_score))
            
        except Exception:
            return 0.5  # Default score if analysis fails
    
    def _check_length_compliance(self, content: str, parameters: Dict[str, Any]) -> float:
        """Check if content meets length requirements"""
        
        word_count = len(content.split())
        length_param = parameters.get('length', '').lower()
        
        if 'short' in length_param:
            target_range = (50, 150)
        elif 'medium' in length_param:
            target_range = (150, 400)
        elif 'long' in length_param:
            target_range = (400, 1000)
        else:
            return 1.0  # No specific requirement
        
        min_words, max_words = target_range
        
        if min_words <= word_count <= max_words:
            return 1.0
        elif word_count < min_words:
            return max(0.0, word_count / min_words)
        else:
            return max(0.0, 1.0 - (word_count - max_words) / max_words)
    
    def _check_tone_compliance(self, content: str, parameters: Dict[str, Any]) -> float:
        """Check if content matches the requested tone"""
        
        # This is a simplified implementation
        # In a real system, you might use sentiment analysis or tone detection
        
        tone = parameters.get('tone', '').lower()
        content_lower = content.lower()
        
        tone_indicators = {
            'professional': ['expertise', 'experience', 'professional', 'industry', 'business'],
            'casual': ['hey', 'awesome', 'cool', 'fun', 'easy'],
            'friendly': ['welcome', 'happy', 'glad', 'excited', 'love'],
            'authoritative': ['must', 'should', 'important', 'critical', 'essential'],
            'enthusiastic': ['amazing', 'fantastic', 'incredible', 'exciting', 'wonderful']
        }
        
        if tone in tone_indicators:
            indicators = tone_indicators[tone]
            matches = sum(1 for indicator in indicators if indicator in content_lower)
            return min(1.0, matches / len(indicators) * 2)  # Scale up to make it achievable
        
        return 0.8  # Default good score if tone not specified or recognized
    
    def _validate_generated_content(self, content: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate generated content against requirements"""
        
        validation_result = {
            'is_valid': True,
            'messages': [],
            'warnings': []
        }
        
        # Length validation
        word_count = len(content.split())
        length_param = parameters.get('length', '').lower()
        
        if 'short' in length_param and word_count > 200:
            validation_result['warnings'].append(f"Content is longer than expected for 'short' ({word_count} words)")
        elif 'medium' in length_param and (word_count < 100 or word_count > 500):
            validation_result['warnings'].append(f"Content length ({word_count} words) may not be optimal for 'medium'")
        elif 'long' in length_param and word_count < 300:
            validation_result['warnings'].append(f"Content is shorter than expected for 'long' ({word_count} words)")
        
        # Content quality checks
        if len(content.strip()) < 10:
            validation_result['is_valid'] = False
            validation_result['messages'].append("Content is too short to be useful")
        
        if content.count('\n\n') == 0 and word_count > 100:
            validation_result['warnings'].append("Content might benefit from paragraph breaks")
        
        return validation_result
    
    # Keep existing methods from the original MultiContentGenerator
    def generate_single_content(self, template_key: str, user_prompt: str, 
                              parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate single content using existing template system (for backward compatibility)"""
        
        try:
            # Get template
            template = template_manager.get_template(template_key)
            if not template:
                return {'success': False, 'error': f'Template {template_key} not found'}
            
            # Process parameters
            processed_params = parameter_engine.process_parameters(template_key, parameters)
            
            # Generate enhanced prompt
            enhanced_prompt = self._create_enhanced_prompt(template, user_prompt, processed_params)
            
            # Generate content
            result = self._generate_with_rendered_prompt(enhanced_prompt, processed_params, template.name)
            
            # Add template metadata
            result.update({
                'template_key': template_key,
                'template_name': template.name,
                'generation_mode': 'standard'
            })
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Content generation failed: {str(e)}'
            }
    
    def _create_enhanced_prompt(self, template, user_prompt: str, parameters: Dict[str, Any]) -> str:
        """Create enhanced prompt using existing template system"""
        
        # Build the prompt using template structure
        prompt_parts = [
            f"Create {template.description.lower()}",
            f"Topic/Content: {user_prompt}",
        ]
        
        # Add parameter-specific instructions
        if parameters.get('tone'):
            prompt_parts.append(f"Tone: {parameters['tone']}")
        
        if parameters.get('length'):
            prompt_parts.append(f"Length: {parameters['length']}")
        
        if parameters.get('target_audience'):
            prompt_parts.append(f"Target Audience: {parameters['target_audience']}")
        
        # Add template-specific guidelines
        if hasattr(template, 'formatting_guidelines') and template.formatting_guidelines:
            prompt_parts.append(f"Guidelines: {template.formatting_guidelines}")
        
        return "\n\n".join(prompt_parts)

# Keep existing ContentValidator and other classes for backward compatibility
class ContentValidator:
    """Content validation and quality checking"""
    
    def validate_content(self, content: str, content_type: str, parameters: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate content against type-specific requirements"""
        
        messages = []
        
        # Basic validation
        if not content or len(content.strip()) < 10:
            messages.append("Content is too short")
            return False, messages
        
        # Length validation
        word_count = len(content.split())
        
        if content_type == 'linkedin_post':
            if word_count > 300:
                messages.append("LinkedIn post is too long (recommended: under 300 words)")
            elif word_count < 20:
                messages.append("LinkedIn post is too short (recommended: 20+ words)")
        
        elif content_type == 'blog_post':
            if word_count < 300:
                messages.append("Blog post is too short (recommended: 300+ words)")
        
        elif content_type == 'email':
            if word_count > 200:
                messages.append("Email is quite long (recommended: under 200 words)")
        
        # Quality checks
        if content.count('!') > 5:
            messages.append("Too many exclamation marks - consider reducing for professionalism")
        
        if len(set(content.lower().split())) / len(content.split()) < 0.7:
            messages.append("Content has too much repetition")
        
        return len(messages) == 0, messages