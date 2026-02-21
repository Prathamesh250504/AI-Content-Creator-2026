"""
Advanced Parameter System for Dynamic Prompt Engineering
Handles parameter configuration, validation, and prompt enhancement
"""

class ParameterConfig:
    """Configuration for a single parameter"""
    def __init__(self, name, param_type, description, tooltip, example, default_value=None, 
                 options=None, min_value=None, max_value=None, required=False):
        self.name = name
        self.param_type = param_type  # 'text', 'select', 'slider', 'checkbox', 'textarea'
        self.description = description
        self.tooltip = tooltip
        self.example = example
        self.default_value = default_value
        self.options = options  # For select/radio types
        self.min_value = min_value  # For slider types
        self.max_value = max_value  # For slider types
        self.required = required

class AdvancedParameterEngine:
    """Engine for managing advanced parameters and dynamic prompt engineering"""
    
    def __init__(self):
        self.parameter_configs = self._initialize_parameter_configs()
    
    def _initialize_parameter_configs(self):
        """Initialize all parameter configurations with tooltips and examples"""
        configs = {}
        
        # Tone Parameter
        configs['tone'] = ParameterConfig(
            name='tone',
            param_type='select',
            description='Content Tone',
            tooltip='The overall emotional tone and style of your content. Choose based on your audience and message.',
            example='Professional: "We are pleased to announce..." | Casual: "Hey! Check this out..."',
            default_value='Professional',
            options=['Professional', 'Casual', 'Friendly', 'Formal', 'Conversational', 
                    'Inspirational', 'Educational', 'Persuasive', 'Urgent', 'Friendly']
        )
        
        # Length Parameter
        configs['length'] = ParameterConfig(
            name='length',
            param_type='select',
            description='Content Length',
            tooltip='The desired length of your content. Short is concise, Long is comprehensive.',
            example='Short: Quick updates, social posts | Long: Detailed articles, comprehensive guides',
            default_value='Medium (200-400 words)',
            options=['Short (100-200 words)', 'Medium (200-400 words)', 'Long (400-600 words)']
        )
        
        # Creativity Level
        configs['creativity'] = ParameterConfig(
            name='creativity',
            param_type='slider',
            description='Creativity Level',
            tooltip='Controls how creative and varied the AI output will be. Higher = more creative, Lower = more predictable.',
            example='Low (0-30): Factual, straightforward | High (70-100): Creative, unique angles',
            default_value=70,
            min_value=0,
            max_value=100
        )
        
        # Target Audience
        configs['target_audience'] = ParameterConfig(
            name='target_audience',
            param_type='text',
            description='Target Audience',
            tooltip='Describe your target audience in detail. The more specific, the better the personalization.',
            example='Marketing professionals aged 25-40, interested in digital marketing trends',
            default_value='General audience',
            required=False
        )
        
        # Keywords
        configs['keywords'] = ParameterConfig(
            name='keywords',
            param_type='text',
            description='Keywords to Include',
            tooltip='Comma-separated keywords that should be naturally incorporated into the content for SEO or emphasis.',
            example='innovation, growth, digital transformation, AI technology',
            default_value='',
            required=False
        )
        
        # Writing Style
        configs['writing_style'] = ParameterConfig(
            name='writing_style',
            param_type='select',
            description='Writing Style',
            tooltip='The overall approach to presenting information in your content.',
            example='Storytelling: Narrative-driven | Data-Driven: Statistics and facts focused',
            default_value='Standard',
            options=['Standard', 'Storytelling', 'Data-Driven', 'Conversational', 'Academic', 
                    'Journalistic', 'Persuasive', 'Educational']
        )
        
        # Include Statistics
        configs['include_statistics'] = ParameterConfig(
            name='include_statistics',
            param_type='checkbox',
            description='Include Statistics/Data',
            tooltip='Request the AI to include relevant statistics, data points, or research findings in the content.',
            example='When enabled: "According to recent studies, 73% of marketers..."',
            default_value=False
        )
        
        # Include CTA
        configs['include_cta'] = ParameterConfig(
            name='include_cta',
            param_type='checkbox',
            description='Include Call-to-Action',
            tooltip='Add a clear and compelling call-to-action at the end of your content.',
            example='"Sign up now", "Learn more", "Get started today"',
            default_value=True
        )
        
        # Include Questions
        configs['include_questions'] = ParameterConfig(
            name='include_questions',
            param_type='checkbox',
            description='Include Engagement Questions',
            tooltip='Add questions throughout the content to encourage audience interaction and engagement.',
            example='"What are your thoughts on this?", "Have you experienced this challenge?"',
            default_value=False
        )
        
        # Content Format
        configs['content_format'] = ParameterConfig(
            name='content_format',
            param_type='select',
            description='Content Format',
            tooltip='The structural format you want for your content.',
            example='List: Bullet points | Paragraph: Flowing text | Mixed: Combination of both',
            default_value='Paragraph',
            options=['Paragraph', 'List', 'Mixed', 'Q&A', 'Step-by-Step']
        )
        
        # Language Style
        configs['language_style'] = ParameterConfig(
            name='language_style',
            param_type='select',
            description='Language Complexity',
            tooltip='The complexity level of language used in the content.',
            example='Simple: Easy to understand | Technical: Industry-specific terminology',
            default_value='Moderate',
            options=['Simple', 'Moderate', 'Technical', 'Expert']
        )
        
        # Emotional Appeal
        configs['emotional_appeal'] = ParameterConfig(
            name='emotional_appeal',
            param_type='select',
            description='Emotional Appeal',
            tooltip='The type of emotional connection you want to create with your audience.',
            example='Rational: Logic-based | Emotional: Feelings-based | Balanced: Both',
            default_value='Balanced',
            options=['Rational', 'Emotional', 'Balanced', 'Inspirational', 'Urgent']
        )
        
        # Industry Context
        configs['industry_context'] = ParameterConfig(
            name='industry_context',
            param_type='text',
            description='Industry/Context',
            tooltip='Specify the industry or context to help tailor the content appropriately.',
            example='Technology, Healthcare, Finance, Education, E-commerce',
            default_value='',
            required=False
        )
        
        # Brand Voice
        configs['brand_voice'] = ParameterConfig(
            name='brand_voice',
            param_type='text',
            description='Brand Voice Description',
            tooltip='Describe your brand\'s unique voice and personality to maintain consistency.',
            example='Friendly yet professional, innovative, customer-focused, approachable',
            default_value='',
            required=False
        )
        
        return configs
    
    def get_parameter_config(self, param_name):
        """Get configuration for a specific parameter"""
        return self.parameter_configs.get(param_name)
    
    def get_all_parameter_configs(self):
        """Get all parameter configurations"""
        return self.parameter_configs
    
    def build_enhanced_prompt(self, base_prompt, parameters):
        """
        Build an enhanced prompt by incorporating all advanced parameters
        
        Args:
            base_prompt: The base user prompt
            parameters: Dictionary of parameter values
            
        Returns:
            Enhanced prompt string
        """
        enhancements = []
        
        # Language Instruction - CRITICAL: Must be first
        content_language = parameters.get('content_language', 'english').lower()
        if content_language != 'english':
            language_map = {
                'marathi': 'Marathi (मराठी)',
                'hindi': 'Hindi (हिंदी)'
            }
            language_name = language_map.get(content_language, 'English')
            enhancements.append(f"⚠️ CRITICAL LANGUAGE REQUIREMENT: Generate ALL content in {language_name}. Every word, sentence, and paragraph must be written in {language_name}. Do not use English except for brand names or technical terms that have no translation.")
        
        # Target Audience
        if parameters.get('target_audience') and parameters['target_audience'] != 'general audience':
            enhancements.append(f"Target Audience: {parameters['target_audience']}")
        
        # Keywords
        if parameters.get('keywords'):
            keywords_list = [k.strip() for k in parameters['keywords'].split(',') if k.strip()]
            if keywords_list:
                enhancements.append(f"Keywords to naturally incorporate: {', '.join(keywords_list)}")
        
        # Writing Style
        if parameters.get('writing_style') and parameters['writing_style'] != 'Standard':
            enhancements.append(f"Writing Style: {parameters['writing_style']}")
        
        # Content Format
        if parameters.get('content_format') and parameters['content_format'] != 'Paragraph':
            enhancements.append(f"Content Format: {parameters['content_format']}")
        
        # Language Style
        if parameters.get('language_style') and parameters['language_style'] != 'Moderate':
            enhancements.append(f"Language Complexity: {parameters['language_style']}")
        
        # Emotional Appeal
        if parameters.get('emotional_appeal') and parameters['emotional_appeal'] != 'Balanced':
            enhancements.append(f"Emotional Appeal: {parameters['emotional_appeal']}")
        
        # Industry Context
        if parameters.get('industry_context'):
            enhancements.append(f"Industry/Context: {parameters['industry_context']}")
        
        # Brand Voice
        if parameters.get('brand_voice'):
            enhancements.append(f"Brand Voice: {parameters['brand_voice']}")
        
        # Statistics
        if parameters.get('include_statistics'):
            enhancements.append("Include relevant statistics, data points, or research findings where appropriate")
        
        # CTA
        if parameters.get('include_cta'):
            enhancements.append("Include a clear and compelling call-to-action")
        
        # Engagement Questions
        if parameters.get('include_questions'):
            enhancements.append("Include engaging questions to encourage audience interaction")
        
        # Creativity Level
        if parameters.get('creativity') is not None:
            creativity = parameters['creativity']
            if creativity > 70:
                enhancements.append(f"Use a highly creative and varied approach (creativity level: {creativity}/100)")
            elif creativity < 50:
                enhancements.append(f"Use a more conservative and straightforward approach (creativity level: {creativity}/100)")
        
        # Length Constraint - CRITICAL: This ensures content follows length requirements
        if parameters.get('length'):
            length = parameters['length']
            if 'short' in length.lower():
                enhancements.append(f"CRITICAL LENGTH REQUIREMENT: Write AT LEAST 100-200 words. This must be a complete, well-developed piece of content, not just a few words or hashtags. Target: {length}")
            elif 'long' in length.lower():
                enhancements.append(f"CRITICAL LENGTH REQUIREMENT: Write AT LEAST 400-600 words. Create comprehensive, detailed, well-structured content with multiple paragraphs. Target: {length}")
            elif 'medium' in length.lower():
                enhancements.append(f"CRITICAL LENGTH REQUIREMENT: Write AT LEAST 200-400 words. Create substantial, well-developed content with proper structure and depth. Target: {length}")
            else:
                enhancements.append(f"CRITICAL LENGTH REQUIREMENT: Follow the specified length requirement exactly: {length}. Write complete, substantial content, not just hashtags or brief phrases.")
        else:
            # Default length requirement if none specified
            enhancements.append("CRITICAL LENGTH REQUIREMENT: Write AT LEAST 200-300 words. Create substantial, well-developed content with proper structure and depth.")
        
        # Content Structure Requirements
        enhancements.append("CONTENT STRUCTURE: Write in complete sentences and paragraphs. Include an engaging opening, detailed body content, and a strong conclusion. Do NOT just write hashtags or brief phrases.")
        
        # Tone - IMPORTANT: This ensures content follows tone requirements
        if parameters.get('tone'):
            tone = parameters['tone']
            enhancements.append(f"IMPORTANT: Use a {tone} tone throughout the content")
        
        # Build final prompt
        if enhancements:
            enhanced_prompt = base_prompt + "\n\n" + "="*50 + "\n"
            enhanced_prompt += "ADDITIONAL REQUIREMENTS & PERSONALIZATION:\n"
            enhanced_prompt += "="*50 + "\n"
            for i, enhancement in enumerate(enhancements, 1):
                enhanced_prompt += f"{i}. {enhancement}\n"
        else:
            enhanced_prompt = base_prompt
        
        return enhanced_prompt
    
    def validate_parameters(self, parameters, required_params=None):
        """
        Validate parameter values
        
        Args:
            parameters: Dictionary of parameter values
            required_params: List of required parameter names
            
        Returns:
            Tuple (is_valid, error_messages)
        """
        errors = []
        
        if required_params:
            for param in required_params:
                if param not in parameters or not parameters[param]:
                    errors.append(f"Required parameter '{param}' is missing")
        
        # Validate creativity range
        if 'creativity' in parameters:
            creativity = parameters['creativity']
            if not isinstance(creativity, (int, float)) or not (0 <= creativity <= 100):
                errors.append("Creativity level must be between 0 and 100")
        
        # Validate tone (skip if not in standard options - template may have custom options)
        if 'tone' in parameters:
            tone_config = self.get_parameter_config('tone')
            # Only validate if tone config exists and tone is provided as a string
            # Templates may have their own tone options, so we're lenient here
            if tone_config and isinstance(parameters['tone'], str):
                # Convert to lowercase for comparison
                tone_lower = parameters['tone'].lower()
                valid_tones = [opt.lower() for opt in tone_config.options]
                # This is a soft validation - templates can override
                pass
        
        return (len(errors) == 0, errors)
    
    def get_parameter_tooltip(self, param_name):
        """Get tooltip text for a parameter"""
        config = self.get_parameter_config(param_name)
        if config:
            return config.tooltip
        return ""
    
    def get_parameter_example(self, param_name):
        """Get example text for a parameter"""
        config = self.get_parameter_config(param_name)
        if config:
            return config.example
        return ""
    
    def process_parameters(self, template_key, parameters):
        """
        Process and validate parameters for content generation
        Returns processed parameters with defaults applied
        """
        processed_params = {}
        
        # Apply defaults for missing parameters
        for param_name, config in self.parameter_configs.items():
            if param_name in parameters:
                processed_params[param_name] = parameters[param_name]
            elif config.default_value is not None:
                processed_params[param_name] = config.default_value
        
        # Add any additional parameters that aren't in our config
        for param_name, value in parameters.items():
            if param_name not in processed_params:
                processed_params[param_name] = value
        
        # Validate the processed parameters
        is_valid, errors = self.validate_parameters(processed_params)
        if not is_valid:
            print(f"Parameter validation warnings: {errors}")
        
        return processed_params

# Global instance
parameter_engine = AdvancedParameterEngine()
