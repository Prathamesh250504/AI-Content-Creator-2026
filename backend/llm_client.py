import os
import requests
import json
import sys
import re
from dotenv import load_dotenv

# Add path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

try:
    from backend.content_templates import template_manager
    from backend.parameter_engine import parameter_engine
    from backend.multi_content_engine import MultiContentGenerator, ContentPostProcessor, ContentValidator
    from backend.multi_model_manager import multi_model_manager, ContentMode
    from backend.parameter_enforcer import parameter_enforcer
except ImportError:
    # Fallback import
    import importlib.util
    spec = importlib.util.spec_from_file_location("content_templates", 
                                                  os.path.join(current_dir, "content_templates.py"))
    content_templates = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(content_templates)
    template_manager = content_templates.template_manager
    
    # Import parameter engine
    spec = importlib.util.spec_from_file_location("parameter_engine", 
                                                  os.path.join(current_dir, "parameter_engine.py"))
    param_engine = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(param_engine)
    parameter_engine = param_engine.parameter_engine
    
    # Import multi-content engine
    spec = importlib.util.spec_from_file_location("multi_content_engine", 
                                                  os.path.join(current_dir, "multi_content_engine.py"))
    multi_content = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(multi_content)
    MultiContentGenerator = multi_content.MultiContentGenerator
    ContentPostProcessor = multi_content.ContentPostProcessor
    ContentValidator = multi_content.ContentValidator
    
    # Import multi-model manager
    spec = importlib.util.spec_from_file_location("multi_model_manager", 
                                                  os.path.join(current_dir, "multi_model_manager.py"))
    multi_model = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(multi_model)
    multi_model_manager = multi_model.multi_model_manager
    ContentMode = multi_model.ContentMode
    
    # Import parameter enforcer
    spec = importlib.util.spec_from_file_location("parameter_enforcer", 
                                                  os.path.join(current_dir, "parameter_enforcer.py"))
    param_enforcer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(param_enforcer)
    parameter_enforcer = param_enforcer.parameter_enforcer

load_dotenv()

class OpenRouterClient:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")
        self.model = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-20b")  # Default model
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")
        
        # Initialize multi-model manager
        self.multi_model = multi_model_manager
    
    def get_available_models(self):
        """Get all available models with their information"""
        return self.multi_model.get_available_models()
    
    def get_model_recommendations(self, content_type: str, user_preferences: dict = None):
        """Get model recommendations based on content type and preferences"""
        if user_preferences is None:
            user_preferences = {}
        return self.multi_model.get_model_recommendations(content_type, user_preferences)
    
    def get_model_health_status(self):
        """Get health status of all models"""
        return self.multi_model.get_model_health_status()
    
    def generate_content_with_template(self, template_key, user_prompt, **template_params):
        """
        Generate content using a specific template with multi-model support,
        quality enhancement, and strict parameter enforcement
        
        Args:
            template_key (str): The template identifier
            user_prompt (str): User's content request
            **template_params: Parameters for the template (including model selection)
            
        Returns:
            str: Generated content or error message
        """
        
        # Validate parameters first
        is_valid, validation_message = parameter_enforcer.validate_parameters(template_params)
        if not is_valid:
            return f"Parameter validation failed: {validation_message}"
        
        # Get the template from the new template library
        from api_server import get_template_by_key
        template = get_template_by_key(template_key)
        if not template:
            return f"Template '{template_key}' not found"
        
        # Extract advanced parameters
        advanced_params = {
            'target_audience': template_params.get('target_audience', 'general audience'),
            'keywords': template_params.get('keywords', ''),
            'writing_style': template_params.get('writing_style', 'Standard'),
            'content_format': template_params.get('content_format', 'Paragraph'),
            'language_style': template_params.get('language_style', 'Moderate'),
            'emotional_appeal': template_params.get('emotional_appeal', 'Balanced'),
            'industry_context': template_params.get('industry_context', ''),
            'brand_voice': template_params.get('brand_voice', ''),
            'include_statistics': template_params.get('include_statistics', False),
            'include_cta': template_params.get('include_cta', True),
            'include_questions': template_params.get('include_questions', False),
            'creativity': template_params.get('creativity', 70),
            'tone': template_params.get('tone', 'professional'),
            'length': template_params.get('length', 'medium')
        }
        
        # Determine content mode and model
        # Use user-specified content_mode if provided, otherwise determine automatically
        user_content_mode = template_params.get('content_mode', 'default')
        if user_content_mode and user_content_mode != 'default':
            # Convert string to ContentMode enum
            mode_mapping = {
                'default': ContentMode.DEFAULT,
                'high_quality': ContentMode.HIGH_QUALITY,
                'structured': ContentMode.STRUCTURED,
                'creative': ContentMode.CREATIVE
            }
            content_mode = mode_mapping.get(user_content_mode, ContentMode.DEFAULT)
        else:
            # Auto-determine based on template and parameters
            content_mode = self._determine_content_mode(template_key, advanced_params)
        
        selected_model = template_params.get('selected_model')
        
        # Build enhanced prompt using parameter engine
        enhanced_prompt = parameter_engine.build_enhanced_prompt(user_prompt, advanced_params)
        
        # Generate system prompt from template
        base_system_prompt = template_manager.generate_system_prompt(template_key, **template_params)
        if base_system_prompt and base_system_prompt.startswith("Missing required parameter"):
            # If still missing parameters, create a basic system prompt
            base_system_prompt = f"""You are a professional content creator specializing in {template.name.lower()}. 
            Create {template_params.get('tone', 'professional').lower()} content with a {template_params.get('length', 'medium').lower()} length.
            
            Content Type: {template.name}
            Description: {template.description}
            
            Follow these guidelines:
            {chr(10).join('- ' + guideline for guideline in template.formatting_guidelines)}
            
            Generate engaging, high-quality content that meets the user's requirements."""
        
        # Create enforced system prompt that strictly follows parameters
        system_prompt = parameter_enforcer.create_enforced_system_prompt(base_system_prompt, advanced_params)
        
        # Get enforced generation parameters
        generation_params = parameter_enforcer.get_enforced_generation_params(advanced_params)
        
        # Try multiple generations for quality improvement and parameter compliance
        max_attempts = template_params.get('quality_iterations', 1)  # Reduced to 1 for faster response
        best_content = None
        best_score = 0
        
        for attempt in range(max_attempts):
            # Generate content using multi-model manager with enforced parameters
            if selected_model:
                # Use specific model if selected
                success, content, metadata = self.multi_model.generate_content_with_fallback(
                    selected_model, system_prompt, enhanced_prompt, **generation_params
                )
            else:
                # Use mode-based selection
                success, content, metadata = self.multi_model.generate_content_by_mode(
                    content_mode, system_prompt, enhanced_prompt, **generation_params
                )
            
            if not success:
                if attempt == max_attempts - 1:  # Last attempt
                    return f"Error: {content}"
                continue
            
            # Post-process content to enforce parameters
            processed_content = parameter_enforcer.post_process_content(content, advanced_params)
            
            # Check if content meets length requirements
            length_compliant, length_message = parameter_enforcer.check_length_compliance(processed_content, advanced_params)
            
            # If content doesn't meet length requirements and we have more attempts, try again
            if not length_compliant and attempt < max_attempts - 1:
                print(f"Attempt {attempt + 1}: {length_message}. Retrying...")
                
                # Adjust the system prompt for next attempt
                if "too short" in length_message:
                    system_prompt += f"\n\nIMPORTANT: Previous attempt was too short. You MUST write more content to reach the minimum word count."
                elif "too long" in length_message:
                    system_prompt += f"\n\nIMPORTANT: Previous attempt was too long. You MUST write less content to stay within the maximum word count."
                
                continue
            
            # Calculate quality score
            try:
                quality_score = self._calculate_content_quality(processed_content, template_key, advanced_params)
                
                # Add bonus for meeting length requirements
                if length_compliant:
                    quality_score += 20  # Significant bonus for meeting length requirements
                
                if quality_score > best_score:
                    best_score = quality_score
                    best_content = processed_content
                    
                # If we get a very high score and meet length requirements, no need to continue
                if quality_score > 85 and length_compliant:
                    break
                    
            except Exception as e:
                print(f"Quality analysis failed for attempt {attempt + 1}: {e}")
                # If quality analysis fails, use the processed content if it meets length requirements
                if length_compliant and not best_content:
                    best_content = processed_content
                # For single attempt, always use the content even if quality analysis fails
                elif max_attempts == 1 and not best_content:
                    best_content = processed_content
        
        # Always return the best content available, or the last generated content if no best content
        if best_content:
            return best_content
        elif 'processed_content' in locals():
            return processed_content
        else:
            return "Error: Failed to generate quality content"
    
    def _determine_content_mode(self, template_key: str, params: dict) -> ContentMode:
        """Determine the best content mode based on template and parameters"""
        
        # Template-based mode mapping
        template_modes = {
            'blog_post': ContentMode.HIGH_QUALITY,
            'technical_doc': ContentMode.STRUCTURED,
            'social_media': ContentMode.CREATIVE,
            'marketing_copy': ContentMode.CREATIVE,
            'email_marketing': ContentMode.DEFAULT,
            'press_release': ContentMode.STRUCTURED,
            'product_description': ContentMode.HIGH_QUALITY,
            'linkedin_post': ContentMode.DEFAULT
        }
        
        # Get base mode from template
        base_mode = template_modes.get(template_key, ContentMode.DEFAULT)
        
        # Override based on parameters
        creativity = params.get('creativity', 70)
        writing_style = params.get('writing_style', '').lower()
        
        # High creativity suggests creative mode
        if creativity > 80:
            return ContentMode.CREATIVE
        
        # Technical/structured writing suggests structured mode
        if writing_style in ['technical', 'academic', 'data-driven']:
            return ContentMode.STRUCTURED
        
        # High quality requirements
        if params.get('include_statistics') or writing_style == 'professional':
            return ContentMode.HIGH_QUALITY
        
        return base_mode
    
    def _generate_single_attempt(self, system_prompt, enhanced_prompt, temperature, top_p):
        """Generate a single content attempt with enhanced parameters"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8501",
            "X-Title": "AI Content Creator Backend"
        }
        
        data = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": enhanced_prompt}
            ],
            "temperature": temperature,
            "max_tokens": 2500,  # Increased for better content
            "top_p": top_p,
            "frequency_penalty": 0.15,  # Slightly increased to reduce repetition
            "presence_penalty": 0.12,   # Encourage topic diversity
            "stop": None  # Let the model complete naturally
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=data, timeout=45)  # Increased timeout
            response.raise_for_status()
            
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                
                # Post-process to ensure quality
                content = self._post_process_generated_content(content)
                return content
            else:
                return "Error: No content generated"
                
        except requests.exceptions.RequestException as e:
            return f"API request error: {str(e)}"
        except json.JSONDecodeError:
            return "Error: Invalid response format"
        except Exception as e:
            return f"Unexpected error: {str(e)}"
    
    def _post_process_generated_content(self, content):
        """Post-process generated content for better quality"""
        if not content:
            return content
            
        # Remove excessive line breaks
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        # Fix spacing issues
        content = re.sub(r'[ \t]+', ' ', content)
        
        # Ensure proper sentence endings
        content = re.sub(r'([.!?])\s*([A-Z])', r'\1 \2', content)
        
        # Remove incomplete sentences at the end
        sentences = content.split('.')
        if len(sentences) > 1 and len(sentences[-1].strip()) < 10:
            content = '.'.join(sentences[:-1]) + '.'
        
        return content.strip()
    
    def _calculate_content_quality(self, content, template_key, params):
        """Calculate content quality score using various metrics"""
        try:
            # Import quality analyzer
            from content_quality_analyzer import ContentQualityAnalyzer
            analyzer = ContentQualityAnalyzer()
            
            # Analyze content
            analysis = analyzer.analyze_content(content, template_key)
            
            if analysis.get('success'):
                metrics = analysis.get('metrics', {})
                
                # Calculate composite quality score
                readability_score = metrics.get('readability', {}).get('flesch_kincaid_score', 50)
                sentiment_score = abs(metrics.get('sentiment', {}).get('compound', 0)) * 100
                keyword_score = min(metrics.get('keyword_density', {}).get('total_density', 0) * 10, 100)
                engagement_score = metrics.get('engagement_potential', {}).get('score', 50)
                
                # Weighted average with enhanced scoring
                quality_score = (
                    readability_score * 0.25 +
                    sentiment_score * 0.15 +
                    keyword_score * 0.15 +
                    engagement_score * 0.25 +
                    self._calculate_structure_score(content) * 0.20
                )
                
                return quality_score
            
        except Exception as e:
            print(f"Quality analysis failed: {e}")
        
        # Enhanced fallback: comprehensive quality metrics
        return self._calculate_comprehensive_quality_score(content, template_key, params)
    
    def _calculate_structure_score(self, content):
        """Calculate structural quality score"""
        score = 100.0
        
        # Check for proper paragraph structure
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        if len(paragraphs) < 2:
            score -= 20  # Single paragraph content is less structured
        
        # Check for varied sentence lengths
        sentences = [s.strip() for s in content.split('.') if s.strip()]
        if sentences:
            sentence_lengths = [len(s.split()) for s in sentences]
            avg_length = sum(sentence_lengths) / len(sentence_lengths)
            
            # Penalize if all sentences are too similar in length
            length_variance = sum((length - avg_length) ** 2 for length in sentence_lengths) / len(sentence_lengths)
            if length_variance < 10:  # Very low variance
                score -= 15
        
        # Check for engagement elements
        has_questions = '?' in content
        has_lists = any(marker in content for marker in ['•', '-', '1.', '2.'])
        has_emphasis = any(marker in content for marker in ['**', '*', 'important', 'key'])
        
        engagement_elements = sum([has_questions, has_lists, has_emphasis])
        score += engagement_elements * 5  # Bonus for engagement elements
        
        return max(0, min(100, score))
    
    def _calculate_comprehensive_quality_score(self, content, template_key, params):
        """Comprehensive fallback quality scoring"""
        word_count = len(content.split())
        sentence_count = len([s for s in content.split('.') if s.strip()])
        paragraph_count = len([p for p in content.split('\n\n') if p.strip()])
        
        # Base scoring
        if sentence_count == 0:
            return 0
            
        avg_sentence_length = word_count / sentence_count
        
        # Length scoring (template-specific optimal ranges)
        length_score = 100
        if template_key == 'linkedin_post':
            optimal_range = (100, 300)
        elif template_key == 'email_marketing':
            optimal_range = (150, 500)
        elif template_key == 'ad_copy':
            optimal_range = (25, 100)
        else:
            optimal_range = (100, 400)
        
        if word_count < optimal_range[0]:
            length_score = (word_count / optimal_range[0]) * 100
        elif word_count > optimal_range[1]:
            length_score = max(50, 100 - ((word_count - optimal_range[1]) / optimal_range[1]) * 50)
        
        # Sentence structure scoring
        sentence_score = 100
        if avg_sentence_length < 8:
            sentence_score -= 20  # Too choppy
        elif avg_sentence_length > 25:
            sentence_score -= 15  # Too complex
        
        # Paragraph structure scoring
        paragraph_score = 100
        if paragraph_count == 1 and word_count > 100:
            paragraph_score -= 25  # Wall of text
        elif paragraph_count > word_count / 30:
            paragraph_score -= 15  # Too fragmented
        
        # Content richness scoring
        richness_score = 100
        
        # Check for specific elements
        has_numbers = bool(re.search(r'\d+', content))
        has_questions = '?' in content
        has_calls_to_action = any(cta in content.lower() for cta in ['click', 'learn more', 'sign up', 'get started', 'contact'])
        has_emotional_words = any(word in content.lower() for word in ['amazing', 'incredible', 'transform', 'breakthrough', 'revolutionary'])
        
        richness_elements = sum([has_numbers, has_questions, has_calls_to_action, has_emotional_words])
        richness_score += richness_elements * 5
        
        # Combine all scores
        final_score = (
            length_score * 0.3 +
            sentence_score * 0.25 +
            paragraph_score * 0.25 +
            richness_score * 0.2
        )
        
        return max(0, min(100, final_score))
    
    def generate_multiple_content_types(self, content_requests):
        """
        Generate multiple content types simultaneously
        
        Args:
            content_requests: List of dictionaries, each containing:
                - template_key: Template identifier
                - user_prompt: User's content request
                - template_params: Parameters for template
                
        Returns:
            List of content generation results with post-processing and validation
        """
        generator = MultiContentGenerator(self)
        return generator.generate_multiple_content(content_requests)
    
    def generate_content(self, prompt, content_type="general", tone="professional", max_tokens=2000):
        """
        Legacy function for backward compatibility
        """
        try:
            system_prompt = f"""You are a professional content creator. Generate high-quality {content_type} content with a {tone} tone. 
            Focus on clarity, engagement, and value for the target audience."""
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8501",
                "X-Title": "AI Content Creator Backend"
            }
            
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": max_tokens,
                "top_p": 0.9
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            print(f"DEBUG: OpenRouter response: {result}")
            
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                print(f"DEBUG: Generated content length: {len(content) if content else 0}")
                return content
            else:
                print(f"DEBUG: No choices in response. Keys: {list(result.keys())}")
                return "Error: No content generated"
                
        except Exception as e:
            return f"Error occurred: {str(e)}"

# Initialize client
client = OpenRouterClient()

def generate_content(prompt, content_type="general", tone="professional"):
    """
    Legacy function for backward compatibility
    """
    try:
        return client.generate_content(prompt, content_type, tone)
    except Exception as e:
        return f"Error occurred: {str(e)}"

def generate_content_with_template(template_key, user_prompt, **template_params):
    """
    Generate content using template system
    """
    try:
        return client.generate_content_with_template(template_key, user_prompt, **template_params)
    except Exception as e:
        return f"Error occurred: {str(e)}"

def generate_multiple_content_types(content_requests):
    """
    Generate multiple content types simultaneously with post-processing and validation
    
    Args:
        content_requests: List of dictionaries with template_key, user_prompt, template_params
        
    Returns:
        List of content generation results
    """
    try:
        return client.generate_multiple_content_types(content_requests)
    except Exception as e:
        return [{'success': False, 'error': str(e)} for _ in content_requests]
