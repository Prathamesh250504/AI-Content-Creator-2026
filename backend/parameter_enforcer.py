"""
Parameter Enforcement System
Ensures that generated content strictly follows user-specified parameters like length, tone, etc.
"""

import re
from typing import Dict, Tuple, Any

class ParameterEnforcer:
    """Enforces user parameters during content generation"""
    
    def __init__(self):
        # Length mappings from user-friendly strings to word counts and tokens
        self.length_mappings = {
            # Short lengths
            'short': {'min_words': 50, 'max_words': 150, 'max_tokens': 200},
            'short (50-100 words)': {'min_words': 50, 'max_words': 100, 'max_tokens': 130},
            'short (100-200 words)': {'min_words': 100, 'max_words': 200, 'max_tokens': 260},
            
            # Medium lengths
            'medium': {'min_words': 150, 'max_words': 400, 'max_tokens': 520},
            'medium (200-400 words)': {'min_words': 200, 'max_words': 400, 'max_tokens': 520},
            'medium (300-500 words)': {'min_words': 300, 'max_words': 500, 'max_tokens': 650},
            'medium (500-800 words)': {'min_words': 500, 'max_words': 800, 'max_tokens': 1040},
            
            # Long lengths
            'long': {'min_words': 400, 'max_words': 800, 'max_tokens': 1040},
            'long (400-600 words)': {'min_words': 400, 'max_words': 600, 'max_tokens': 780},
            'long (600-1000 words)': {'min_words': 600, 'max_words': 1000, 'max_tokens': 1300},
            'long (800-1200 words)': {'min_words': 800, 'max_words': 1200, 'max_tokens': 1560},
            
            # Very long
            'very long': {'min_words': 800, 'max_words': 1500, 'max_tokens': 1950},
            'comprehensive': {'min_words': 1000, 'max_words': 2000, 'max_tokens': 2600}
        }
        
        # Tone enforcement guidelines
        self.tone_guidelines = {
            'professional': {
                'style': 'formal, authoritative, respectful',
                'avoid': 'slang, casual expressions, overly emotional language',
                'include': 'industry terminology, clear structure, professional vocabulary'
            },
            'casual': {
                'style': 'conversational, friendly, approachable',
                'avoid': 'overly formal language, jargon without explanation',
                'include': 'everyday language, personal pronouns, relatable examples'
            },
            'friendly': {
                'style': 'warm, welcoming, personable',
                'avoid': 'cold or distant language, overly technical terms',
                'include': 'positive language, inclusive pronouns, encouraging tone'
            },
            'authoritative': {
                'style': 'confident, expert, decisive',
                'avoid': 'uncertain language, hedging words',
                'include': 'strong statements, expert insights, clear directives'
            },
            'conversational': {
                'style': 'natural, dialogue-like, engaging',
                'avoid': 'formal academic language, passive voice',
                'include': 'questions, direct address, natural flow'
            },
            'persuasive': {
                'style': 'compelling, convincing, action-oriented',
                'avoid': 'weak language, uncertainty, passive statements',
                'include': 'strong calls-to-action, benefits, urgency, social proof'
            },
            'informative': {
                'style': 'educational, clear, factual',
                'avoid': 'overly promotional language, emotional appeals',
                'include': 'facts, data, explanations, structured information'
            },
            'inspirational': {
                'style': 'motivating, uplifting, empowering',
                'avoid': 'negative language, discouraging words',
                'include': 'positive affirmations, success stories, motivational language'
            },
            'urgent': {
                'style': 'time-sensitive, immediate, action-focused',
                'avoid': 'leisurely language, vague timelines',
                'include': 'time-limited offers, immediate benefits, clear deadlines'
            },
            'educational': {
                'style': 'teaching, explanatory, step-by-step',
                'avoid': 'assumptions about prior knowledge, complex jargon',
                'include': 'clear explanations, examples, structured learning'
            }
        }
    
    def parse_length_parameter(self, length_param: str) -> Dict[str, int]:
        """Parse length parameter into word and token limits"""
        if not length_param:
            return self.length_mappings['medium']
        
        # Normalize the parameter
        length_key = length_param.lower().strip()
        
        # Direct mapping
        if length_key in self.length_mappings:
            return self.length_mappings[length_key]
        
        # Try to extract numbers from the parameter
        numbers = re.findall(r'\d+', length_param)
        if len(numbers) >= 2:
            min_words = int(numbers[0])
            max_words = int(numbers[1])
            max_tokens = int(max_words * 1.3)  # Approximate token conversion
            return {
                'min_words': min_words,
                'max_words': max_words,
                'max_tokens': max_tokens
            }
        elif len(numbers) == 1:
            target_words = int(numbers[0])
            return {
                'min_words': max(10, target_words - 50),
                'max_words': target_words + 50,
                'max_tokens': int((target_words + 50) * 1.3)
            }
        
        # Fallback to medium
        return self.length_mappings['medium']
    
    def create_enforced_system_prompt(self, base_prompt: str, parameters: Dict[str, Any]) -> str:
        """Create a system prompt that strictly enforces parameters"""
        
        # Parse length requirements
        length_param = parameters.get('length', 'medium')
        length_limits = self.parse_length_parameter(length_param)
        
        # Get tone requirements
        tone = parameters.get('tone', 'professional').lower()
        tone_guide = self.tone_guidelines.get(tone, self.tone_guidelines['professional'])
        
        # Build enforced prompt
        enforced_prompt = f"""{base_prompt}

CRITICAL REQUIREMENTS - MUST BE FOLLOWED EXACTLY:

1. LENGTH REQUIREMENT (ABSOLUTELY CRITICAL):
   - EXACT TARGET: {length_limits['min_words']}-{length_limits['max_words']} words
   - MINIMUM REQUIRED: {length_limits['min_words']} words (YOU MUST WRITE AT LEAST THIS MUCH)
   - MAXIMUM ALLOWED: {length_limits['max_words']} words (STOP IMMEDIATELY WHEN YOU REACH THIS)
   - Count every single word as you write
   - If you're under {length_limits['min_words']} words, ADD MORE CONTENT
   - If you reach {length_limits['max_words']} words, STOP WRITING IMMEDIATELY

2. WORD COUNTING INSTRUCTIONS:
   - Count: "The quick brown fox" = 4 words
   - Count: "AI-powered" = 1 word (hyphenated words count as 1)
   - Count: "don't" = 1 word (contractions count as 1)
   - Keep a running count as you write
   - When you hit the maximum, END your response with a complete sentence

3. TONE REQUIREMENT (STRICTLY ENFORCED):
   - Style: {tone_guide['style']}
   - Avoid: {tone_guide['avoid']}
   - Include: {tone_guide['include']}

4. CREATIVITY LEVEL:
   - Creativity setting: {parameters.get('creativity', 70)}/100
   - {"Be highly creative and original" if parameters.get('creativity', 70) > 80 else "Balance creativity with clarity" if parameters.get('creativity', 70) > 50 else "Focus on clear, straightforward content"}

5. CONTENT STRUCTURE:
   - Format: {parameters.get('content_format', 'paragraph')}
   - Writing style: {parameters.get('writing_style', 'standard')}
   - Target audience: {parameters.get('target_audience', 'general audience')}

MANDATORY LENGTH CHECK:
- Before finishing, count your words
- If under {length_limits['min_words']}: ADD more valuable content
- If over {length_limits['max_words']}: This is an ERROR - you must stay within limits
- Aim for {int((length_limits['min_words'] + length_limits['max_words']) / 2)} words for optimal length

QUALITY REQUIREMENTS:
- Every word must add value
- Use specific, concrete examples
- Maintain consistent tone throughout
- Ensure logical flow and structure
"""

        # Add specific requirements based on parameters
        if parameters.get('keywords'):
            enforced_prompt += f"\n- Naturally incorporate these keywords: {parameters['keywords']}"
        
        if parameters.get('include_cta'):
            enforced_prompt += f"\n- Include a clear call-to-action within the word limit"
        
        if parameters.get('include_questions'):
            enforced_prompt += f"\n- Include engaging questions within the word limit"
        
        if parameters.get('brand_voice'):
            enforced_prompt += f"\n- Maintain brand voice: {parameters['brand_voice']}"
        
        enforced_prompt += f"""

FINAL REMINDER: Your response MUST be between {length_limits['min_words']}-{length_limits['max_words']} words. Count carefully and stop exactly at the limit."""
        
        return enforced_prompt
    
    def get_enforced_generation_params(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Get API parameters that enforce user requirements"""
        
        # Parse length requirements
        length_param = parameters.get('length', 'medium')
        length_limits = self.parse_length_parameter(length_param)
        
        # Calculate appropriate max_tokens with safety margin
        max_tokens = min(length_limits['max_tokens'], 2000)  # Cap at reasonable limit
        
        # Adjust temperature based on creativity
        creativity = parameters.get('creativity', 70)
        temperature = max(0.1, min(1.0, creativity / 100))
        
        # Adjust other parameters for better control
        generation_params = {
            'max_tokens': max_tokens,
            'temperature': temperature,
            'top_p': 0.9,
            'frequency_penalty': 0.2,  # Reduce repetition
            'presence_penalty': 0.1,   # Encourage topic diversity
            'stop': None  # Let model complete naturally within token limit
        }
        
        return generation_params
    
    def post_process_content(self, content: str, parameters: Dict[str, Any]) -> str:
        """Post-process content to ensure it meets parameter requirements"""
        
        if not content:
            return content
        
        # Parse length requirements
        length_param = parameters.get('length', 'medium')
        length_limits = self.parse_length_parameter(length_param)
        
        # Clean up the content
        content = self._clean_content(content)
        
        # Enforce word count limits
        content = self._enforce_word_count(content, length_limits)
        
        # Validate tone (basic check)
        content = self._validate_tone(content, parameters.get('tone', 'professional'))
        
        return content
    
    def _clean_content(self, content: str) -> str:
        """Clean up generated content"""
        # Remove excessive whitespace
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r'[ \t]+', ' ', content)
        
        # Fix sentence spacing
        content = re.sub(r'([.!?])\s*([A-Z])', r'\1 \2', content)
        
        # Remove incomplete sentences at the end
        sentences = content.split('.')
        if len(sentences) > 1 and len(sentences[-1].strip()) < 10:
            content = '.'.join(sentences[:-1]) + '.'
        
        return content.strip()
    
    def _enforce_word_count(self, content: str, length_limits: Dict[str, int]) -> str:
        """Strictly enforce word count limits"""
        words = content.split()
        word_count = len(words)
        
        max_words = length_limits['max_words']
        min_words = length_limits['min_words']
        
        if word_count > max_words:
            # Truncate to max words, but end at a sentence boundary
            truncated_words = words[:max_words]
            truncated_content = ' '.join(truncated_words)
            
            # Find the last complete sentence within the limit
            sentences = truncated_content.split('.')
            if len(sentences) > 1:
                # Keep all complete sentences
                complete_sentences = sentences[:-1]  # Remove incomplete last sentence
                content = '. '.join(complete_sentences) + '.'
            else:
                # If no complete sentences, just truncate
                content = truncated_content
        
        elif word_count < min_words:
            # Content is too short - add a note that it needs expansion
            # This should trigger regeneration in the calling function
            shortage = min_words - word_count
            print(f"Warning: Content is {shortage} words short of minimum requirement ({word_count}/{min_words})")
            # Return content as-is, but the calling function should detect this and regenerate
        
        return content
    
    def _validate_tone(self, content: str, tone: str) -> str:
        """Basic tone validation and adjustment"""
        # This is a simplified version - could be enhanced with NLP
        tone = tone.lower()
        
        if tone == 'professional':
            # Ensure professional language
            content = re.sub(r'\b(awesome|cool|amazing)\b', 'excellent', content, flags=re.IGNORECASE)
            content = re.sub(r'\b(gonna|wanna)\b', lambda m: 'going to' if 'gonna' in m.group() else 'want to', content, flags=re.IGNORECASE)
        
        elif tone == 'casual':
            # Ensure casual language
            content = re.sub(r'\butilize\b', 'use', content, flags=re.IGNORECASE)
            content = re.sub(r'\bfacilitate\b', 'help', content, flags=re.IGNORECASE)
        
        return content
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate that parameters are reasonable and achievable"""
        
        # Check length parameter
        length_param = parameters.get('length', 'medium')
        length_limits = self.parse_length_parameter(length_param)
        
        if length_limits['max_words'] < 10:
            return False, "Minimum content length is 10 words"
        
        if length_limits['max_words'] > 3000:
            return False, "Maximum content length is 3000 words"
        
        # Check creativity parameter
        creativity = parameters.get('creativity', 70)
        if not isinstance(creativity, (int, float)) or creativity < 0 or creativity > 100:
            return False, "Creativity must be a number between 0 and 100"
        
        # Check tone parameter
        tone = parameters.get('tone', 'professional')
        if tone.lower() not in self.tone_guidelines:
            return False, f"Unsupported tone: {tone}. Supported tones: {', '.join(self.tone_guidelines.keys())}"
        
        return True, "Parameters are valid"

    def check_length_compliance(self, content: str, parameters: Dict[str, Any]) -> Tuple[bool, str]:
        """Check if content meets length requirements"""
        length_param = parameters.get('length', 'medium')
        length_limits = self.parse_length_parameter(length_param)
        
        word_count = len(content.split())
        min_words = length_limits['min_words']
        max_words = length_limits['max_words']
        
        if word_count < min_words:
            return False, f"Content too short: {word_count} words (minimum: {min_words})"
        elif word_count > max_words:
            return False, f"Content too long: {word_count} words (maximum: {max_words})"
        else:
            return True, f"Length compliant: {word_count} words (target: {min_words}-{max_words})"

# Global instance
parameter_enforcer = ParameterEnforcer()