"""
Multi-Content Type Generation Engine
Handles multiple content types simultaneously with specific prompt engineering strategies,
content-specific post-processing functions, and comprehensive validation checks.
"""

import re
from typing import Dict, List, Tuple, Optional, Any
from enum import Enum
from datetime import datetime
import json

class ContentType(Enum):
    """Enumeration of supported content types"""
    LINKEDIN_POST = "linkedin_post"
    EMAIL_MARKETING = "email_marketing"
    AD_COPY = "ad_copy"
    SOCIAL_MEDIA_CAPTION = "social_media_caption"
    BLOG_INTRO = "blog_intro"
    PRODUCT_DESCRIPTION = "product_description"
    PRESS_RELEASE = "press_release"

class PromptEngineeringStrategies:
    """Specific prompt engineering strategies for each content type"""
    
    @staticmethod
    def _get_language_instruction(language: str) -> str:
        """Get language instruction for content generation"""
        language_map = {
            'english': 'English',
            'marathi': 'Marathi (मराठी)',
            'hindi': 'Hindi (हिंदी)'
        }
        
        language_name = language_map.get(language.lower(), 'English')
        
        if language.lower() == 'english':
            return ""
        else:
            return f"\n\n⚠️ CRITICAL LANGUAGE REQUIREMENT:\nGenerate ALL content in {language_name}. Every word, sentence, and paragraph must be written in {language_name}. Do not use English except for brand names or technical terms that have no translation.\n"
    
    @staticmethod
    def get_linkedin_post_strategy(user_prompt: str, params: Dict) -> str:
        """
        LinkedIn-specific prompt engineering strategy
        
        Focus on:
        - Professional networking tone
        - Industry insights and thought leadership
        - Engagement-driven content
        - Hashtag optimization
        """
        language_instruction = PromptEngineeringStrategies._get_language_instruction(
            params.get('content_language', 'english')
        )
        
        strategy_prompt = f"""
LINKEDIN POST GENERATION STRATEGY:{language_instruction}

Original Request: {user_prompt}

LINKEDIN-SPECIFIC REQUIREMENTS:
1. HOOK: Start with an attention-grabbing opening (question, statistic, or bold statement)
2. VALUE: Provide actionable insights or professional value
3. STRUCTURE: Use short paragraphs (1-2 sentences) with line breaks for readability
4. ENGAGEMENT: End with a thought-provoking question or call for discussion
5. HASHTAGS: Include 3-5 relevant professional hashtags
6. TONE: {params.get('tone', 'Professional')} but conversational
7. LENGTH: {params.get('length', 'Medium (200-400 words)')}

LINKEDIN BEST PRACTICES:
- Use "you" to speak directly to the reader
- Share personal experiences or insights when relevant
- Include industry-specific terminology for {params.get('industry_context', 'your field')}
- Encourage comments and shares
- Use emojis sparingly (1-2 maximum)

TARGET AUDIENCE: {params.get('target_audience', 'LinkedIn professionals')}
KEYWORDS TO INCLUDE: {params.get('keywords', 'professional development, networking')}

Generate a LinkedIn post that follows these guidelines and drives professional engagement.
"""
        return strategy_prompt
    
    @staticmethod
    def get_email_marketing_strategy(user_prompt: str, params: Dict) -> str:
        """
        Email marketing-specific prompt engineering strategy
        
        Focus on:
        - Subject line optimization
        - Clear value proposition
        - Structured format
        - Strong CTA
        """
        language_instruction = PromptEngineeringStrategies._get_language_instruction(
            params.get('content_language', 'english')
        )
        
        strategy_prompt = f"""
EMAIL MARKETING GENERATION STRATEGY:{language_instruction}

Original Request: {user_prompt}

EMAIL-SPECIFIC REQUIREMENTS:
1. SUBJECT LINE: Create compelling subject line under 50 characters
2. GREETING: Personal greeting based on audience
3. HOOK: Open with immediate value or benefit
4. BODY: Clear, scannable content with bullet points
5. CTA: Single, prominent call-to-action
6. SIGNATURE: Professional closing
7. TONE: {params.get('tone', 'Professional')} yet approachable
8. LENGTH: {params.get('length', 'Medium (300-500 words)')}

EMAIL MARKETING BEST PRACTICES:
- Focus on ONE primary goal/offer
- Use "you" language throughout
- Create urgency with {params.get('urgency_factor', 'limited time offers')}
- Personalize with {params.get('personalization', 'recipient details')}
- Include social proof or testimonials
- Mobile-friendly formatting

TARGET AUDIENCE: {params.get('target_audience', 'email subscribers')}
MAIN OFFER: {params.get('main_offer', 'primary value proposition')}
KEYWORDS: {params.get('keywords', 'conversion, value, benefit')}

Generate a complete email that drives opens, engagement, and conversions.
"""
        return strategy_prompt
    
    @staticmethod
    def get_ad_copy_strategy(user_prompt: str, params: Dict) -> str:
        """
        Ad copy-specific prompt engineering strategy
        
        Focus on:
        - Attention-grabbing headlines
        - Benefit-focused messaging
        - Urgency and scarcity
        - Clear CTA
        """
        language_instruction = PromptEngineeringStrategies._get_language_instruction(
            params.get('content_language', 'english')
        )
        
        strategy_prompt = f"""
AD COPY GENERATION STRATEGY:{language_instruction}

Original Request: {user_prompt}

AD COPY-SPECIFIC REQUIREMENTS:
1. HEADLINE: Powerful, benefit-focused headline (under 10 words)
2. HOOK: Address pain point or desire immediately
3. BENEFITS: Focus on outcomes, not features
4. PROOF: Include credibility indicators
5. URGENCY: Create time-sensitive motivation
6. CTA: Single, action-oriented call-to-action
7. TONE: {params.get('tone', 'Persuasive')} and compelling
8. LENGTH: {params.get('length', 'Short (50-100 words)')}

AD COPY BEST PRACTICES:
- Lead with biggest benefit or transformation
- Use power words: "instant," "proven," "guaranteed"
- Address {params.get('pain_point', 'customer pain points')} directly
- Highlight {params.get('unique_selling_point', 'unique advantages')}
- Create FOMO with {params.get('urgency_element', 'limited availability')}
- Use numbers and specifics

TARGET AUDIENCE: {params.get('target_audience', 'ideal customers')}
PRODUCT/SERVICE: {params.get('product_service', 'offering')}
MAIN BENEFIT: {params.get('main_benefit', 'primary advantage')}
KEYWORDS: {params.get('keywords', 'conversion, results, solution')}

Generate ad copy that stops the scroll and drives immediate action.
"""
        return strategy_prompt
    
    @staticmethod
    def get_social_media_strategy(user_prompt: str, params: Dict) -> str:
        """Social media caption-specific strategy"""
        platform = params.get('platform', 'Instagram')
        language_instruction = PromptEngineeringStrategies._get_language_instruction(
            params.get('content_language', 'english')
        )
        
        strategy_prompt = f"""
SOCIAL MEDIA CAPTION STRATEGY ({platform.upper()}):{language_instruction}

Original Request: {user_prompt}

{platform.upper()}-SPECIFIC REQUIREMENTS:
1. HOOK: Platform-appropriate opening
2. CONTENT: Engaging, shareable message
3. HASHTAGS: Platform-optimized hashtags
4. CTA: Encourage interaction
5. TONE: {params.get('tone', 'Casual')} and authentic
6. LENGTH: {params.get('length', 'Short (100-200 words)')}

PLATFORM BEST PRACTICES:
- {platform} audience expects {PromptEngineeringStrategies._get_platform_expectations(platform)}
- Use {PromptEngineeringStrategies._get_platform_hashtag_count(platform)} hashtags
- Encourage {PromptEngineeringStrategies._get_platform_engagement(platform)}

TARGET AUDIENCE: {params.get('target_audience', f'{platform} followers')}
CONTENT THEME: {params.get('content_theme', 'brand message')}
KEYWORDS: {params.get('keywords', 'engagement, community')}

Generate a {platform} caption that drives engagement and builds community.
"""
        return strategy_prompt
    
    @staticmethod
    def _get_platform_expectations(platform: str) -> str:
        expectations = {
            'Instagram': 'visual storytelling and lifestyle content',
            'LinkedIn': 'professional insights and industry knowledge',
            'Facebook': 'community building and conversation',
            'Twitter': 'quick updates and trending topics',
            'TikTok': 'entertaining and trend-based content'
        }
        return expectations.get(platform, 'engaging content')
    
    @staticmethod
    def _get_platform_hashtag_count(platform: str) -> str:
        counts = {
            'Instagram': '5-10',
            'LinkedIn': '3-5',
            'Facebook': '1-3',
            'Twitter': '1-2',
            'TikTok': '3-5'
        }
        return counts.get(platform, '3-5')
    
    @staticmethod
    def _get_platform_engagement(platform: str) -> str:
        engagement = {
            'Instagram': 'likes, comments, and saves',
            'LinkedIn': 'professional discussions and shares',
            'Facebook': 'comments and shares',
            'Twitter': 'retweets and replies',
            'TikTok': 'views, likes, and shares'
        }
        return engagement.get(platform, 'likes and comments')

class ContentPostProcessor:
    """Enhanced post-processing functions for different content types"""
    
    @staticmethod
    def process_linkedin_post(content: str, params: Dict) -> str:
        """
        Enhanced LinkedIn post post-processing
        
        Requirements:
        - Professional formatting with proper line breaks
        - Hashtag optimization (3-5 relevant hashtags)
        - Engagement elements (questions, CTAs)
        - Emoji moderation (1-2 maximum)
        - Professional tone maintenance
        """
        processed = content.strip()
        
        # Remove excessive line breaks and normalize spacing
        processed = re.sub(r'\n{3,}', '\n\n', processed)
        processed = re.sub(r'[ \t]+', ' ', processed)  # Normalize spaces
        
        # Ensure proper paragraph breaks for readability
        sentences = re.split(r'([.!?]+)', processed)
        formatted_sentences = []
        sentence_count = 0
        
        for i in range(0, len(sentences), 2):
            if i + 1 < len(sentences):
                sentence = sentences[i] + sentences[i + 1]
                formatted_sentences.append(sentence.strip())
                sentence_count += 1
                
                # Add line break after every 2-3 sentences for readability
                if sentence_count % 2 == 0 and i + 2 < len(sentences):
                    formatted_sentences.append('\n')
        
        processed = ' '.join(formatted_sentences)
        processed = re.sub(r' \n ', '\n\n', processed)  # Fix spacing around line breaks
        
        # Handle hashtags intelligently
        hashtags = params.get('hashtags', '')
        existing_hashtags = re.findall(r'#\w+', processed)
        
        # Remove existing hashtags from content body
        processed = re.sub(r'#\w+\s*', '', processed).strip()
        
        # Process hashtag parameter
        if hashtags:
            tag_list = re.findall(r'#?\w+', hashtags)
            tag_list = [tag if tag.startswith('#') else f'#{tag}' for tag in tag_list]
            # Combine with existing hashtags, remove duplicates
            all_tags = list(dict.fromkeys(tag_list + existing_hashtags))  # Preserve order, remove duplicates
            final_tags = all_tags[:5]  # LinkedIn optimal: 3-5 hashtags
        else:
            final_tags = existing_hashtags[:5]
        
        # Add hashtags at the end if any exist
        if final_tags:
            if not processed.endswith('\n'):
                processed += '\n\n'
            processed += ' '.join(final_tags)
        
        # Moderate emoji usage (LinkedIn is professional)
        emoji_pattern = re.compile(
            r'[\U0001F300-\U0001F9FF]|[\U0001FA00-\U0001FAFF]|[\U00002600-\U000027BF]|[\U0001F600-\U0001F64F]'
        )
        emojis = emoji_pattern.findall(processed)
        
        if len(emojis) > 2:  # LinkedIn: maximum 2 emojis for professionalism
            emoji_count = 0
            def limit_emojis(match):
                nonlocal emoji_count
                if emoji_count < 2:
                    emoji_count += 1
                    return match.group(0)
                return ''
            processed = emoji_pattern.sub(limit_emojis, processed)
        
        # Ensure engagement element exists
        last_paragraph = processed.split('\n')[-1] if '\n' in processed else processed
        has_question = '?' in last_paragraph
        has_cta = any(word in last_paragraph.lower() for word in ['thoughts', 'think', 'agree', 'share', 'comment'])
        
        if not has_question and not has_cta:
            cta = params.get('call_to_action', '')
            if cta:
                if not processed.endswith('\n'):
                    processed += '\n\n'
                processed += f"{cta}"
            else:
                # Add professional engagement question
                if not processed.endswith('\n'):
                    processed += '\n\n'
                processed += "What's your experience with this? Share your thoughts below. 💭"
        
        return processed.strip()
    
    @staticmethod
    def process_email_marketing(content: str, params: Dict) -> str:
        """
        Enhanced email marketing post-processing
        
        Requirements:
        - Proper email structure (subject, greeting, body, signature)
        - Subject line optimization (under 50 characters)
        - Scannable formatting with bullet points
        - Clear CTA placement
        - Professional signature
        """
        processed = content.strip()
        
        # Extract or create subject line
        subject_line = params.get('subject_line', '')
        if not subject_line:
            # Try to extract from content
            subject_match = re.search(r'Subject:\s*(.+)', processed, re.IGNORECASE)
            if subject_match:
                subject_line = subject_match.group(1).strip()
                processed = re.sub(r'Subject:\s*.+\n?', '', processed, flags=re.IGNORECASE)
            else:
                # Generate from main offer or first sentence
                main_offer = params.get('main_offer', '')
                if main_offer:
                    subject_line = main_offer[:47] + ('...' if len(main_offer) > 47 else '')
                else:
                    first_sentence = processed.split('.')[0][:47]
                    subject_line = first_sentence + ('...' if len(first_sentence) == 47 else '')
        
        # Ensure subject line is optimized
        if len(subject_line) > 50:
            subject_line = subject_line[:47] + '...'
        
        # Structure the email
        email_parts = []
        
        # Subject line
        if subject_line:
            email_parts.append(f"Subject: {subject_line}\n")
        
        # Greeting
        if not re.search(r'^(Dear|Hello|Hi|Greetings)', processed, re.IGNORECASE | re.MULTILINE):
            personalization = params.get('personalization', '')
            target_audience = params.get('target_audience', '')
            
            if personalization and 'name' in personalization.lower():
                greeting = "Hello [First Name],"
            elif target_audience:
                greeting = f"Hello {target_audience},"
            else:
                greeting = "Hello,"
            
            email_parts.append(f"{greeting}\n")
        
        # Process body content
        body = processed
        
        # Convert lists to bullet points for better scannability
        body = re.sub(r'^\d+\.\s+', '• ', body, flags=re.MULTILINE)
        body = re.sub(r'^[-*]\s+', '• ', body, flags=re.MULTILINE)
        
        # Ensure paragraphs are not too long (split long paragraphs)
        paragraphs = body.split('\n\n')
        formatted_paragraphs = []
        
        for paragraph in paragraphs:
            if len(paragraph.split()) > 50:  # Long paragraph
                sentences = re.split(r'([.!?]+)', paragraph)
                mid_point = len(sentences) // 2
                first_half = ''.join(sentences[:mid_point])
                second_half = ''.join(sentences[mid_point:])
                formatted_paragraphs.extend([first_half.strip(), second_half.strip()])
            else:
                formatted_paragraphs.append(paragraph)
        
        body = '\n\n'.join(formatted_paragraphs)
        
        # Ensure CTA is prominent
        cta = params.get('call_to_action', '')
        urgency_factor = params.get('urgency_factor', '')
        
        # Check for existing CTA
        cta_patterns = [r'\[.*?\]', r'Click here', r'Learn more', r'Get started', r'Shop now', r'Sign up']
        has_cta = any(re.search(pattern, body, re.IGNORECASE) for pattern in cta_patterns)
        
        if not has_cta:
            if cta:
                cta_text = f"[{cta}]"
            else:
                cta_text = "[Learn More]"
            
            # Add urgency if specified
            if urgency_factor:
                if 'limited' in urgency_factor.lower():
                    cta_text = f"⏰ {cta_text} - Limited Time!"
                elif 'today' in urgency_factor.lower():
                    cta_text = f"🚀 {cta_text} - Act Today!"
                elif 'exclusive' in urgency_factor.lower():
                    cta_text = f"✨ {cta_text} - Exclusive Offer!"
            
            if not body.endswith('\n'):
                body += '\n\n'
            body += cta_text
        
        email_parts.append(body)
        
        # Professional signature
        if not re.search(r'(Best regards|Sincerely|Thank you|Regards|Cheers)', body, re.IGNORECASE):
            company_name = params.get('company_name', '[Company Name]')
            signature = f"\n\nBest regards,\n[Your Name]\n[Your Title]\n{company_name}"
            email_parts.append(signature)
        
        processed = '\n'.join(email_parts)
        return processed.strip()
    
    @staticmethod
    def process_ad_copy(content: str, params: Dict) -> str:
        """
        Enhanced ad copy post-processing
        
        Requirements:
        - Compelling headline (under 10 words)
        - Benefit-focused messaging
        - Urgency and scarcity elements
        - Clear, action-oriented CTA
        - Concise, punchy format
        """
        processed = content.strip()
        
        # Identify and format headline
        lines = processed.split('\n')
        headline = lines[0].strip()
        
        # Ensure headline is impactful
        if len(headline.split()) > 10:
            # Shorten headline to key benefit
            words = headline.split()
            headline = ' '.join(words[:8]) + '...'
        
        # Format headline prominently
        if not headline.startswith('**') and not headline.isupper():
            headline = f"**{headline}**"
        
        # Process body content
        if len(lines) > 1:
            body = '\n'.join(lines[1:]).strip()
        else:
            body = ''
        
        # Ensure benefit-focused language
        feature_words = ['feature', 'includes', 'has', 'contains', 'specification']
        benefit_words = ['get', 'achieve', 'transform', 'improve', 'solve', 'save', 'gain']
        
        # Replace feature language with benefit language where possible
        for feature_word in feature_words:
            if feature_word in body.lower():
                body = re.sub(rf'\b{feature_word}\b', 'gives you', body, flags=re.IGNORECASE, count=1)
        
        # Add power words for impact
        power_words = {
            'good': 'amazing',
            'nice': 'incredible',
            'great': 'outstanding',
            'help': 'transform',
            'use': 'leverage'
        }
        
        for weak_word, strong_word in power_words.items():
            body = re.sub(rf'\b{weak_word}\b', strong_word, body, flags=re.IGNORECASE, count=1)
        
        # Handle CTA and urgency
        cta = params.get('call_to_action', '')
        urgency_element = params.get('urgency_element', '')
        
        # Check for existing CTA
        cta_patterns = [r'\[.*?\]', r'Click here', r'Buy now', r'Get started', r'Learn more', r'Sign up']
        has_cta = any(re.search(pattern, body, re.IGNORECASE) for pattern in cta_patterns)
        
        if not has_cta:
            if cta:
                cta_text = f"[{cta}]"
            else:
                cta_text = "[Get Started Now]"
            
            # Add urgency elements
            if urgency_element:
                if 'limited' in urgency_element.lower():
                    cta_text = f"⏰ {cta_text} - Limited Time Only!"
                elif 'today' in urgency_element.lower():
                    cta_text = f"🔥 {cta_text} - Today Only!"
                elif 'stock' in urgency_element.lower():
                    cta_text = f"⚡ {cta_text} - While Supplies Last!"
                elif 'exclusive' in urgency_element.lower():
                    cta_text = f"✨ {cta_text} - Exclusive Access!"
            
            if body and not body.endswith('\n'):
                body += '\n\n'
            body += cta_text
        
        # Combine headline and body
        if body:
            processed = f"{headline}\n\n{body}"
        else:
            processed = headline
        
        return processed.strip()
    
    @staticmethod
    def process_social_media_caption(content: str, params: Dict) -> str:
        """Enhanced social media caption post-processing"""
        processed = content.strip()
        platform = params.get('platform', 'Instagram')
        
        # Platform-specific formatting
        if platform.lower() == 'instagram':
            # Instagram allows more emojis and hashtags
            max_hashtags = 10
            max_emojis = 5
        elif platform.lower() == 'linkedin':
            # LinkedIn is more professional
            max_hashtags = 5
            max_emojis = 2
        elif platform.lower() == 'twitter':
            # Twitter has character limits
            max_hashtags = 2
            max_emojis = 3
        else:
            max_hashtags = 5
            max_emojis = 3
        
        # Handle hashtags
        hashtags = params.get('hashtags', '')
        existing_hashtags = re.findall(r'#\w+', processed)
        
        # Remove existing hashtags from content body
        processed = re.sub(r'#\w+\s*', '', processed).strip()
        
        if hashtags:
            tag_list = re.findall(r'#?\w+', hashtags)
            tag_list = [tag if tag.startswith('#') else f'#{tag}' for tag in tag_list]
            all_tags = list(dict.fromkeys(tag_list + existing_hashtags))
            final_tags = all_tags[:max_hashtags]
        else:
            final_tags = existing_hashtags[:max_hashtags]
        
        # Add hashtags at the end
        if final_tags:
            if not processed.endswith('\n'):
                processed += '\n\n'
            processed += ' '.join(final_tags)
        
        # Moderate emoji usage based on platform
        emoji_pattern = re.compile(
            r'[\U0001F300-\U0001F9FF]|[\U0001FA00-\U0001FAFF]|[\U00002600-\U000027BF]|[\U0001F600-\U0001F64F]'
        )
        emojis = emoji_pattern.findall(processed)
        
        if len(emojis) > max_emojis:
            emoji_count = 0
            def limit_emojis(match):
                nonlocal emoji_count
                if emoji_count < max_emojis:
                    emoji_count += 1
                    return match.group(0)
                return ''
            processed = emoji_pattern.sub(limit_emojis, processed)
        
        return processed.strip()
    
    @staticmethod
    def process_blog_intro(content: str, params: Dict) -> str:
        """Enhanced blog introduction post-processing"""
        processed = content.strip()
        
        # Ensure proper paragraph structure
        processed = re.sub(r'\n{3,}', '\n\n', processed)
        
        # Check for hook in the first sentence
        first_sentence = processed.split('.')[0] if '.' in processed else processed.split('\n')[0]
        
        # Hook indicators
        hook_patterns = [
            r'\?',  # Question
            r'!',   # Exclamation
            r'\b\d+%\b',  # Percentage/statistic
            r'\b\d+\s+(people|users|customers|studies|research)',  # Statistics
            r'(imagine|picture this|what if|did you know)',  # Engagement starters
            r'(according to|research shows|studies reveal)'  # Authority hooks
        ]
        
        has_hook = any(re.search(pattern, first_sentence, re.IGNORECASE) for pattern in hook_patterns)
        
        # If no hook detected, enhance the opening
        if not has_hook and len(first_sentence) > 20:
            hook_type = params.get('hook_type', 'Question')
            
            if hook_type == 'Question':
                processed = f"Have you ever wondered about {first_sentence.lower()}? {processed[len(first_sentence):]}"
            elif hook_type == 'Statistic':
                processed = f"Did you know that 73% of professionals struggle with {first_sentence.lower()}? {processed[len(first_sentence):]}"
            elif hook_type == 'Story':
                processed = f"Picture this: {processed}"
            else:
                processed = f"Here's something interesting: {processed}"
        
        # Ensure smooth transition to main content
        if not re.search(r'(in this article|this post|we\'ll explore|let\'s dive)', processed, re.IGNORECASE):
            # Add transition if missing
            paragraphs = processed.split('\n\n')
            if len(paragraphs) > 1:
                transition = "\n\nIn this article, we'll explore this topic in detail."
                processed = paragraphs[0] + transition + '\n\n' + '\n\n'.join(paragraphs[1:])
        
        return processed.strip()
    
    @staticmethod
    def process_product_description(content: str, params: Dict) -> str:
        """Enhanced product description post-processing"""
        processed = content.strip()
        
        # Ensure benefit-focused opening
        first_sentence = processed.split('.')[0]
        if not any(word in first_sentence.lower() for word in ['transform', 'achieve', 'solve', 'improve', 'get']):
            # Make opening more benefit-focused
            product_name = params.get('product_name', 'This product')
            main_benefit = params.get('main_benefit', 'delivers exceptional value')
            processed = f"{product_name} {main_benefit}. {processed}"
        
        # Format features as bullet points
        if '•' not in processed and '-' not in processed and '\n' in processed:
            lines = processed.split('\n')
            formatted_lines = []
            
            for line in lines:
                line = line.strip()
                if line and not line.endswith(':') and len(line.split()) > 3:
                    # Check if it looks like a feature
                    if any(word in line.lower() for word in ['feature', 'include', 'has', 'with', 'offer']):
                        formatted_lines.append(f"• {line}")
                    else:
                        formatted_lines.append(line)
                else:
                    formatted_lines.append(line)
            
            processed = '\n'.join(formatted_lines)
        
        # Ensure specifications are clearly marked
        if any(word in processed.lower() for word in ['dimension', 'weight', 'size', 'material', 'color']):
            if 'specifications:' not in processed.lower():
                # Add specifications header
                spec_keywords = ['dimension', 'weight', 'size', 'material', 'color', 'warranty']
                lines = processed.split('\n')
                spec_lines = []
                other_lines = []
                
                for line in lines:
                    if any(keyword in line.lower() for keyword in spec_keywords):
                        spec_lines.append(line)
                    else:
                        other_lines.append(line)
                
                if spec_lines:
                    processed = '\n'.join(other_lines) + '\n\n**Specifications:**\n' + '\n'.join(spec_lines)
        
        # Ensure strong CTA
        cta_patterns = [r'\[.*?\]', r'buy now', r'add to cart', r'shop now', r'order today']
        has_cta = any(re.search(pattern, processed, re.IGNORECASE) for pattern in cta_patterns)
        
        if not has_cta:
            price_range = params.get('price_range', '')
            if price_range:
                cta_text = f"[Shop Now - Starting at {price_range}]"
            else:
                cta_text = "[Add to Cart]"
            
            if not processed.endswith('\n'):
                processed += '\n\n'
            processed += cta_text
        
        return processed.strip()
    
    @staticmethod
    def process_press_release(content: str, params: Dict) -> str:
        """Enhanced press release post-processing"""
        processed = content.strip()
        lines = processed.split('\n')
        
        # Ensure proper press release structure
        structured_content = []
        
        # 1. Headline (should be first line, under 10 words)
        headline = lines[0].strip()
        if len(headline.split()) > 10:
            headline = ' '.join(headline.split()[:8]) + '...'
        
        # Make headline prominent
        if not headline.startswith('**'):
            headline = f"**{headline}**"
        
        structured_content.append(headline)
        structured_content.append('')  # Empty line after headline
        
        # 2. Dateline
        has_dateline = any(re.search(r'\d{4}|January|February|March|April|May|June|July|August|September|October|November|December', line) 
                          for line in lines[:3])
        
        if not has_dateline:
            company_name = params.get('company_name', '[Company Name]')
            dateline = f"[CITY, STATE] - {datetime.now().strftime('%B %d, %Y')} - {company_name}"
            structured_content.append(dateline)
            structured_content.append('')
        
        # 3. Body content (skip headline and add rest)
        body_lines = lines[1:] if len(lines) > 1 else []
        body_content = '\n'.join(body_lines).strip()
        
        # Ensure lead paragraph follows 5 W's (Who, What, When, Where, Why)
        first_paragraph = body_content.split('\n\n')[0] if '\n\n' in body_content else body_content.split('\n')[0]
        
        # Check if lead paragraph is comprehensive
        if len(first_paragraph.split()) < 30:
            # Enhance lead paragraph
            announcement = params.get('announcement', 'major announcement')
            company_name = params.get('company_name', '[Company Name]')
            enhanced_lead = f"{company_name} today announced {announcement}, marking a significant milestone in the industry."
            
            if body_content:
                body_content = f"{enhanced_lead}\n\n{body_content}"
            else:
                body_content = enhanced_lead
        
        structured_content.append(body_content)
        
        # 4. Quotes section
        quotes = params.get('quotes', '')
        if quotes and quotes not in body_content:
            structured_content.append('')
            structured_content.append(f'"{quotes}"')
        
        # 5. Company boilerplate
        company_name = params.get('company_name', '')
        background_info = params.get('background_info', '')
        
        if company_name:
            boilerplate_title = f"\n**About {company_name}**"
            if background_info:
                boilerplate_content = background_info
            else:
                boilerplate_content = f"{company_name} is a leading company dedicated to innovation and excellence in its industry."
            
            structured_content.extend(['', boilerplate_title, boilerplate_content])
        
        # 6. Media contact
        contact_info = params.get('contact_info', '')
        if contact_info:
            structured_content.extend(['', '**Media Contact**', contact_info])
        else:
            structured_content.extend(['', '**Media Contact**', 
                                     'Press Relations\n[Company Name]\nPhone: [Phone Number]\nEmail: [Email Address]'])
        
        processed = '\n'.join(structured_content)
        return processed.strip()

class ContentValidator:
    """Enhanced validation functions for different content types"""
    
    @staticmethod
    def validate_linkedin_post(content: str, params: Dict) -> Tuple[bool, List[str]]:
        """Enhanced LinkedIn post validation with strict length requirements"""
        errors = []
        warnings = []
        
        # STRICT Length validation - enforce minimum word counts
        word_count = len(content.split())
        length_param = params.get('length', '').lower()
        
        # Determine minimum word count based on length parameter
        if 'short' in length_param:
            min_words = 100
            max_words = 200
        elif 'long' in length_param:
            min_words = 400
            max_words = 600
        else:  # medium or default
            min_words = 200
            max_words = 400
        
        # CRITICAL: Enforce minimum word count
        if word_count < min_words:
            errors.append(f"CRITICAL: Content is too short ({word_count} words). Minimum required: {min_words} words for {length_param or 'medium'} length. Please generate more substantial content.")
        elif word_count > max_words:
            warnings.append(f"Content is longer than expected ({word_count} words). Target range: {min_words}-{max_words} words.")
        
        # Check for hashtag-only content (common issue)
        hashtag_count = len(re.findall(r'#\w+', content))
        non_hashtag_words = word_count - hashtag_count
        if non_hashtag_words < min_words * 0.8:  # 80% of content should be non-hashtag
            errors.append(f"CRITICAL: Content appears to be mostly hashtags. Need at least {int(min_words * 0.8)} words of actual content (found {non_hashtag_words}).")
        
        # Professional tone check
        unprofessional_words = ['awesome', 'super cool', 'lit', 'fire', 'sick', 'dope']
        found_unprofessional = [word for word in unprofessional_words if word in content.lower()]
        if found_unprofessional:
            warnings.append(f"Consider more professional alternatives to: {', '.join(found_unprofessional)}")
        
        # Hashtag validation
        hashtags = re.findall(r'#\w+', content)
        if len(hashtags) < 3:
            warnings.append("Consider adding 3-5 relevant hashtags for better reach and discoverability.")
        elif len(hashtags) > 10:
            errors.append(f"Too many hashtags ({len(hashtags)}). LinkedIn recommends 3-5 hashtags for optimal performance.")
        
        # Engagement element validation
        last_paragraph = content.split('\n')[-1] if '\n' in content else content
        has_question = '?' in last_paragraph
        has_cta = any(word in last_paragraph.lower() for word in ['thoughts', 'think', 'agree', 'share', 'comment', 'discuss'])
        
        if not has_question and not has_cta:
            warnings.append("Consider ending with a question or call-to-action to encourage engagement.")
        
        # Readability check (line breaks)
        if '\n\n' not in content and word_count > 100:
            warnings.append("Consider adding line breaks between paragraphs for better readability.")
        
        # Emoji moderation
        emoji_pattern = re.compile(r'[\U0001F300-\U0001F9FF]|[\U0001FA00-\U0001FAFF]|[\U00002600-\U000027BF]|[\U0001F600-\U0001F64F]')
        emoji_count = len(emoji_pattern.findall(content))
        if emoji_count > 3:
            warnings.append(f"Consider reducing emoji usage ({emoji_count} found). LinkedIn is professional - 1-2 emojis work best.")
        
        # Value-add content check
        value_indicators = ['tip', 'insight', 'lesson', 'strategy', 'advice', 'experience', 'learn']
        has_value = any(indicator in content.lower() for indicator in value_indicators)
        if not has_value:
            warnings.append("Consider adding actionable insights or valuable takeaways for your audience.")
        
        return (len(errors) == 0, errors + warnings)
    
    @staticmethod
    def validate_email_marketing(content: str, params: Dict) -> Tuple[bool, List[str]]:
        """Enhanced email marketing validation"""
        errors = []
        warnings = []
        
        # Subject line validation
        subject_line = params.get('subject_line', '')
        if 'Subject:' in content:
            subject_match = re.search(r'Subject:\s*(.+)', content, re.IGNORECASE)
            if subject_match:
                subject_line = subject_match.group(1).strip()
        
        if not subject_line:
            errors.append("Subject line is required for email marketing.")
        else:
            if len(subject_line) > 50:
                errors.append(f"Subject line is too long ({len(subject_line)} characters). Keep it under 50 characters for better open rates.")
            elif len(subject_line) < 10:
                warnings.append(f"Subject line is quite short ({len(subject_line)} characters). Consider 20-50 characters for optimal performance.")
            
            # Subject line spam words check
            spam_words = ['free', 'urgent', 'act now', 'limited time', 'click here', 'buy now']
            spam_found = [word for word in spam_words if word in subject_line.lower()]
            if len(spam_found) > 2:  # Allow up to 2 spam words
                warnings.append(f"Subject line contains potential spam triggers: {', '.join(spam_found)}. Consider alternatives.")
        
        # Greeting validation
        if not re.search(r'^(Dear|Hello|Hi|Greetings)', content, re.IGNORECASE | re.MULTILINE):
            warnings.append("Consider adding a personal greeting to improve engagement.")
        
        # CTA validation
        cta_patterns = [r'\[.*?\]', r'Click here', r'Learn more', r'Get started', r'Shop now', r'Sign up', r'Download']
        cta_matches = [pattern for pattern in cta_patterns if re.search(pattern, content, re.IGNORECASE)]
        
        if not cta_matches:
            errors.append("Call-to-action (CTA) is required for email marketing.")
        elif len(cta_matches) > 2:
            warnings.append(f"Multiple CTAs detected ({len(cta_matches)}). Focus on one primary CTA for better conversion.")
        
        # Email structure validation
        if not re.search(r'(Best regards|Sincerely|Thank you|Regards|Cheers)', content, re.IGNORECASE):
            warnings.append("Consider adding a professional email signature.")
        
        # Scannability check
        bullet_points = len(re.findall(r'^[•\-\*]\s+', content, re.MULTILINE))
        paragraph_count = len([p for p in content.split('\n\n') if p.strip()])
        
        if paragraph_count > 5 and bullet_points == 0:
            warnings.append("Consider using bullet points to improve scannability for long emails.")
        
        # Mobile-friendly check
        long_paragraphs = [p for p in content.split('\n\n') if len(p.split()) > 50]
        if long_paragraphs:
            warnings.append(f"Found {len(long_paragraphs)} long paragraphs. Consider shorter paragraphs for mobile readability.")
        
        return (len(errors) == 0, errors + warnings)
    
    @staticmethod
    def validate_ad_copy(content: str, params: Dict) -> Tuple[bool, List[str]]:
        """Enhanced ad copy validation"""
        errors = []
        warnings = []
        
        # Length validation (optimal: 25-100 words)
        word_count = len(content.split())
        if word_count < 15:
            warnings.append(f"Ad copy is quite short ({word_count} words). Consider expanding to 25-50 words for better impact.")
        elif word_count > 150:
            warnings.append(f"Ad copy is long ({word_count} words). Most effective ads are 25-100 words. Consider condensing.")
        
        # Headline validation
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        if lines:
            headline = lines[0]
            headline_words = len(headline.split())
            
            if headline_words > 12:
                warnings.append(f"Headline is long ({headline_words} words). Consider 5-8 words for maximum impact.")
            
            # Power words check
            power_words = ['instant', 'proven', 'guaranteed', 'exclusive', 'limited', 'free', 'new', 'amazing', 'revolutionary']
            power_words_found = [word for word in power_words if word in headline.lower()]
            if not power_words_found:
                warnings.append("Consider adding power words to your headline for more impact.")
        
        # CTA validation
        cta_patterns = [r'\[.*?\]', r'Click here', r'Learn more', r'Get started', r'Buy now', r'Sign up', r'Download', r'Shop now']
        cta_matches = [pattern for pattern in cta_patterns if re.search(pattern, content, re.IGNORECASE)]
        
        if not cta_matches:
            errors.append("Call-to-action (CTA) is required for ad copy.")
        elif len(cta_matches) > 1:
            warnings.append("Multiple CTAs detected. Focus on one clear action for better conversion.")
        
        # Benefit vs feature analysis
        feature_words = ['feature', 'specification', 'includes', 'has', 'contains', 'comes with']
        benefit_words = ['get', 'achieve', 'transform', 'improve', 'solve', 'save', 'gain', 'boost', 'increase']
        
        feature_count = sum(1 for word in feature_words if word in content.lower())
        benefit_count = sum(1 for word in benefit_words if word in content.lower())
        
        if feature_count > benefit_count:
            warnings.append("Consider focusing more on benefits (what customers gain) rather than features (what product has).")
        
        # Urgency/scarcity check
        urgency_words = ['limited', 'hurry', 'now', 'today', 'urgent', 'deadline', 'expires', 'while supplies last']
        has_urgency = any(word in content.lower() for word in urgency_words)
        
        if not has_urgency:
            warnings.append("Consider adding urgency or scarcity elements to encourage immediate action.")
        
        # Social proof check
        social_proof_words = ['customers', 'reviews', 'rated', 'trusted', 'testimonial', 'proven', 'thousands']
        has_social_proof = any(word in content.lower() for word in social_proof_words)
        
        if not has_social_proof and word_count > 50:
            warnings.append("Consider adding social proof elements (reviews, testimonials, user counts) for credibility.")
        
        return (len(errors) == 0, errors + warnings)
    
    @staticmethod
    def validate_social_media_caption(content: str, params: Dict) -> Tuple[bool, List[str]]:
        """Validate social media caption"""
        errors = []
        warnings = []
        platform = params.get('platform', 'Instagram')
        
        # Platform-specific validation
        if platform.lower() == 'instagram':
            max_length = 2200  # Instagram caption limit
            optimal_hashtags = (5, 10)
        elif platform.lower() == 'twitter':
            max_length = 280  # Twitter character limit
            optimal_hashtags = (1, 2)
        elif platform.lower() == 'linkedin':
            max_length = 3000  # LinkedIn post limit
            optimal_hashtags = (3, 5)
        else:
            max_length = 1000
            optimal_hashtags = (3, 7)
        
        # Length validation
        if len(content) > max_length:
            errors.append(f"Content exceeds {platform} limit ({len(content)}/{max_length} characters).")
        
        # Hashtag validation
        hashtags = re.findall(r'#\w+', content)
        if len(hashtags) < optimal_hashtags[0]:
            warnings.append(f"Consider adding {optimal_hashtags[0]}-{optimal_hashtags[1]} hashtags for better reach on {platform}.")
        elif len(hashtags) > optimal_hashtags[1]:
            warnings.append(f"Too many hashtags for {platform} ({len(hashtags)}). Optimal range: {optimal_hashtags[0]}-{optimal_hashtags[1]}.")
        
        # Engagement check
        engagement_words = ['comment', 'share', 'tag', 'thoughts', 'opinion', 'experience']
        has_engagement = any(word in content.lower() for word in engagement_words)
        
        if not has_engagement:
            warnings.append("Consider adding an engagement prompt to encourage interaction.")
        
        return (len(errors) == 0, errors + warnings)
    
    @staticmethod
    def validate_blog_intro(content: str, params: Dict) -> Tuple[bool, List[str]]:
        """Validate blog introduction"""
        errors = []
        warnings = []
        
        # Length validation
        word_count = len(content.split())
        if word_count < 50:
            warnings.append(f"Introduction is quite short ({word_count} words). Consider 100-200 words for better context.")
        elif word_count > 300:
            warnings.append(f"Introduction is long ({word_count} words). Consider keeping it under 250 words.")
        
        # Hook validation
        first_sentence = content.split('.')[0] if '.' in content else content.split('\n')[0]
        hook_patterns = [
            r'\?',  # Question
            r'!',   # Exclamation
            r'\b\d+%\b',  # Percentage
            r'(imagine|picture this|what if|did you know)',
            r'(according to|research shows|studies reveal)'
        ]
        
        has_hook = any(re.search(pattern, first_sentence, re.IGNORECASE) for pattern in hook_patterns)
        if not has_hook:
            warnings.append("Consider starting with a compelling hook (question, statistic, or engaging statement).")
        
        # Preview validation
        preview_words = ['explore', 'discover', 'learn', 'cover', 'discuss', 'reveal']
        has_preview = any(word in content.lower() for word in preview_words)
        
        if not has_preview:
            warnings.append("Consider previewing what readers will learn in the article.")
        
        return (len(errors) == 0, errors + warnings)
    
    @staticmethod
    def validate_product_description(content: str, params: Dict) -> Tuple[bool, List[str]]:
        """Validate product description"""
        errors = []
        warnings = []
        
        # Benefit-focused opening check
        first_sentence = content.split('.')[0]
        benefit_words = ['transform', 'achieve', 'solve', 'improve', 'get', 'experience']
        has_benefit_opening = any(word in first_sentence.lower() for word in benefit_words)
        
        if not has_benefit_opening:
            warnings.append("Consider starting with a key benefit rather than product features.")
        
        # Feature formatting check
        has_bullets = '•' in content or re.search(r'^[-*]\s+', content, re.MULTILINE)
        if not has_bullets and len(content.split()) > 100:
            warnings.append("Consider using bullet points to highlight key features for better scannability.")
        
        # CTA validation
        cta_patterns = [r'\[.*?\]', r'buy now', r'add to cart', r'shop now', r'order today', r'purchase']
        has_cta = any(re.search(pattern, content, re.IGNORECASE) for pattern in cta_patterns)
        
        if not has_cta:
            warnings.append("Consider adding a clear call-to-action to drive purchases.")
        
        # Specifications check
        spec_words = ['dimension', 'weight', 'size', 'material', 'color', 'warranty']
        has_specs = any(word in content.lower() for word in spec_words)
        
        if not has_specs and len(content.split()) > 50:
            warnings.append("Consider including key specifications that customers typically look for.")
        
        return (len(errors) == 0, errors + warnings)
    
    @staticmethod
    def validate_press_release(content: str, params: Dict) -> Tuple[bool, List[str]]:
        """Validate press release"""
        errors = []
        warnings = []
        
        # Structure validation
        required_elements = {
            'headline': r'^\*\*.*\*\*',
            'dateline': r'\[.*\]\s*-\s*\w+\s+\d+,\s+\d{4}',
            'lead_paragraph': True,  # First substantial paragraph
            'quotes': r'".*"',
            'boilerplate': r'About\s+\w+',
            'contact': r'(contact|media|press)'
        }
        
        missing_elements = []
        
        # Check headline
        if not re.search(required_elements['headline'], content):
            missing_elements.append('formatted headline')
        
        # Check dateline
        if not re.search(required_elements['dateline'], content):
            missing_elements.append('proper dateline')
        
        # Check for quotes
        if not re.search(required_elements['quotes'], content):
            warnings.append("Consider adding quotes from key stakeholders for credibility.")
        
        # Check for boilerplate
        if not re.search(required_elements['boilerplate'], content, re.IGNORECASE):
            missing_elements.append('company boilerplate section')
        
        # Check for contact info
        if not re.search(required_elements['contact'], content, re.IGNORECASE):
            missing_elements.append('media contact information')
        
        if missing_elements:
            errors.extend([f"Missing {element}" for element in missing_elements])
        
        # Lead paragraph validation (5 W's)
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip() and not p.startswith('**')]
        if paragraphs:
            lead = paragraphs[0]
            w_words = ['who', 'what', 'when', 'where', 'why']  # Not literal, but concepts
            
            if len(lead.split()) < 25:
                warnings.append("Lead paragraph should be more comprehensive (25+ words) and answer the 5 W's.")
        
        return (len(errors) == 0, errors + warnings)
    
    @staticmethod
    def validate_content(content: str, content_type: str, params: Dict) -> Tuple[bool, List[str]]:
        """Enhanced content validation dispatcher"""
        if content_type == ContentType.LINKEDIN_POST.value:
            return ContentValidator.validate_linkedin_post(content, params)
        elif content_type == ContentType.EMAIL_MARKETING.value:
            return ContentValidator.validate_email_marketing(content, params)
        elif content_type == ContentType.AD_COPY.value:
            return ContentValidator.validate_ad_copy(content, params)
        elif content_type == ContentType.SOCIAL_MEDIA_CAPTION.value:
            return ContentValidator.validate_social_media_caption(content, params)
        elif content_type == ContentType.BLOG_INTRO.value:
            return ContentValidator.validate_blog_intro(content, params)
        elif content_type == ContentType.PRODUCT_DESCRIPTION.value:
            return ContentValidator.validate_product_description(content, params)
        elif content_type == ContentType.PRESS_RELEASE.value:
            return ContentValidator.validate_press_release(content, params)
        else:
            # Generic validation
            word_count = len(content.split())
            if word_count < 10:
                return (False, ["Content is too short (minimum 10 words required)."])
            elif word_count > 1000:
                return (True, ["Content is quite long. Consider breaking into smaller sections."])
            return (True, [])

class MultiContentGenerator:
    """Enhanced engine for generating multiple content types simultaneously"""
    
    def __init__(self, llm_client):
        """
        Initialize multi-content generator
        
        Args:
            llm_client: Instance of OpenRouterClient
        """
        self.llm_client = llm_client
        self.processor = ContentPostProcessor()
        self.validator = ContentValidator()
        self.prompt_strategies = PromptEngineeringStrategies()
    
    def generate_single_content(self, template_key: str, user_prompt: str, 
                               template_params: Dict) -> Dict:
        """
        Generate a single content piece with enhanced prompt engineering, post-processing and validation
        
        Args:
            template_key: Template identifier
            user_prompt: User's content request
            template_params: Parameters for template
            
        Returns:
            Dictionary with content, validation results, and metadata
        """
        try:
            # Apply content-specific prompt engineering strategy
            enhanced_prompt = self._apply_prompt_strategy(template_key, user_prompt, template_params)
            
            # Generate content using enhanced prompt
            raw_content = self.llm_client.generate_content_with_template(
                template_key, enhanced_prompt, **template_params
            )
            
            if raw_content.startswith("Error") or raw_content.startswith("Template"):
                return {
                    'success': False,
                    'error': raw_content,
                    'content': None,
                    'validation': {'is_valid': False, 'messages': [raw_content]},
                    'template_key': template_key
                }
            
            # Post-process based on content type
            processed_content = self._post_process_content(template_key, raw_content, template_params)
            
            # Validate content
            is_valid, validation_messages = self.validator.validate_content(
                processed_content, template_key, template_params
            )
            
            # Check if content is too short and retry if needed
            word_count = len(processed_content.split())
            length_param = template_params.get('length', '').lower()
            
            # Determine minimum word count
            if 'short' in length_param:
                min_words = 100
            elif 'long' in length_param:
                min_words = 400
            else:  # medium or default
                min_words = 200
            
            # Retry if content is too short (only once to avoid infinite loops)
            if word_count < min_words and not template_params.get('_retry_attempted'):
                print(f"Content too short ({word_count} words, need {min_words}). Retrying with enhanced prompt...")
                
                # Add retry flag and enhance prompt for longer content
                retry_params = template_params.copy()
                retry_params['_retry_attempted'] = True
                
                # Create a more explicit prompt for longer content
                enhanced_retry_prompt = f"{user_prompt}\n\nIMPORTANT: Please write a comprehensive, detailed response with AT LEAST {min_words} words. Provide thorough explanations, examples, and insights. Do not just write hashtags or brief phrases."
                
                # Retry generation
                return self.generate_single_content(template_key, enhanced_retry_prompt, retry_params)
            
            # Calculate quality score
            quality_score = self._calculate_quality_score(processed_content, template_key, template_params)
            
            # Get model information from parameters
            model_used = template_params.get('selected_model', 'default')
            model_name = 'Unknown'
            
            # Try to get model name from multi_model_manager
            try:
                from multi_model_manager import multi_model_manager, ContentMode
                
                # First try to get model from selected_model parameter
                if model_used and model_used != 'default' and model_used in multi_model_manager.models:
                    model_config = multi_model_manager.models[model_used]
                    model_name = model_config.name
                else:
                    # Mode-based selection - determine content mode
                    content_mode = template_params.get('content_mode', 'default')
                    mode_mapping = {
                        'default': ContentMode.DEFAULT,
                        'high_quality': ContentMode.HIGH_QUALITY,
                        'structured': ContentMode.STRUCTURED,
                        'creative': ContentMode.CREATIVE
                    }
                    mode = mode_mapping.get(content_mode, ContentMode.DEFAULT)
                    mode_model = multi_model_manager.get_model_for_mode(mode)
                    
                    if mode_model and mode_model in multi_model_manager.models:
                        model_config = multi_model_manager.models[mode_model]
                        model_name = model_config.name
                        model_used = mode_model
                    else:
                        # Fallback to default model
                        default_model = multi_model_manager.get_model_for_mode(ContentMode.DEFAULT)
                        if default_model in multi_model_manager.models:
                            model_config = multi_model_manager.models[default_model]
                            model_name = model_config.name
                            model_used = default_model
                        
            except Exception as e:
                print(f"Could not get model information: {e}")
                # Set reasonable defaults
                model_used = 'default'
                model_name = 'GPT-OSS 20B (Default)'
            
            return {
                'success': True,
                'content': processed_content,
                'raw_content': raw_content,
                'template_key': template_key,
                'validation': {
                    'is_valid': is_valid,
                    'messages': validation_messages
                },
                'quality_score': quality_score,
                'word_count': len(processed_content.split()),
                'char_count': len(processed_content),
                'processing_applied': True,
                'strategy_used': template_key,
                'model_used': model_used,
                'model_name': model_name
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Generation failed: {str(e)}",
                'content': None,
                'validation': {'is_valid': False, 'messages': [f"Generation error: {str(e)}"]},
                'template_key': template_key
            }
    
    def generate_multiple_content(self, content_requests: List[Dict]) -> List[Dict]:
        """
        Generate multiple content pieces simultaneously with batch processing
        
        Args:
            content_requests: List of dictionaries, each containing:
                - template_key: Template identifier
                - user_prompt: User's content request
                - template_params: Parameters for template
                
        Returns:
            List of content generation results with processing metadata
        """
        results = []
        
        for i, request in enumerate(content_requests):
            template_key = request.get('template_key')
            user_prompt = request.get('user_prompt', '')
            template_params = request.get('template_params', {})
            
            # Add batch metadata
            template_params['batch_index'] = i
            template_params['batch_total'] = len(content_requests)
            
            result = self.generate_single_content(template_key, user_prompt, template_params)
            result['batch_info'] = {
                'index': i,
                'total': len(content_requests),
                'template_type': template_key
            }
            
            results.append(result)
        
        # Add batch summary
        successful_generations = [r for r in results if r['success']]
        batch_summary = {
            'total_requested': len(content_requests),
            'successful': len(successful_generations),
            'failed': len(content_requests) - len(successful_generations),
            'average_quality_score': sum(r.get('quality_score', 0) for r in successful_generations) / len(successful_generations) if successful_generations else 0,
            'content_types': list(set(r['template_key'] for r in results))
        }
        
        # Add summary to each result
        for result in results:
            result['batch_summary'] = batch_summary
        
        return results
    
    def _apply_prompt_strategy(self, template_key: str, user_prompt: str, params: Dict) -> str:
        """Apply content-specific prompt engineering strategy"""
        if template_key == ContentType.LINKEDIN_POST.value:
            return self.prompt_strategies.get_linkedin_post_strategy(user_prompt, params)
        elif template_key == ContentType.EMAIL_MARKETING.value:
            return self.prompt_strategies.get_email_marketing_strategy(user_prompt, params)
        elif template_key == ContentType.AD_COPY.value:
            return self.prompt_strategies.get_ad_copy_strategy(user_prompt, params)
        elif template_key == ContentType.SOCIAL_MEDIA_CAPTION.value:
            return self.prompt_strategies.get_social_media_strategy(user_prompt, params)
        else:
            # Use enhanced prompt for other types
            from parameter_engine import parameter_engine
            return parameter_engine.build_enhanced_prompt(user_prompt, params)
    
    def _post_process_content(self, template_key: str, content: str, params: Dict) -> str:
        """Apply post-processing based on content type"""
        if template_key == ContentType.LINKEDIN_POST.value:
            return self.processor.process_linkedin_post(content, params)
        elif template_key == ContentType.EMAIL_MARKETING.value:
            return self.processor.process_email_marketing(content, params)
        elif template_key == ContentType.AD_COPY.value:
            return self.processor.process_ad_copy(content, params)
        elif template_key == ContentType.SOCIAL_MEDIA_CAPTION.value:
            return self.processor.process_social_media_caption(content, params)
        elif template_key == ContentType.BLOG_INTRO.value:
            return self.processor.process_blog_intro(content, params)
        elif template_key == ContentType.PRODUCT_DESCRIPTION.value:
            return self.processor.process_product_description(content, params)
        elif template_key == ContentType.PRESS_RELEASE.value:
            return self.processor.process_press_release(content, params)
        else:
            # No post-processing for unknown types
            return content
    
    def _calculate_quality_score(self, content: str, template_key: str, params: Dict) -> float:
        """
        Calculate a quality score for the generated content (0-100)
        
        Factors:
        - Length appropriateness
        - Required elements presence
        - Engagement potential
        - Professional quality
        """
        score = 100.0
        word_count = len(content.split())
        
        # Length scoring
        if template_key == ContentType.LINKEDIN_POST.value:
            optimal_range = (100, 300)
        elif template_key == ContentType.EMAIL_MARKETING.value:
            optimal_range = (150, 500)
        elif template_key == ContentType.AD_COPY.value:
            optimal_range = (25, 100)
        else:
            optimal_range = (50, 400)
        
        if word_count < optimal_range[0]:
            score -= (optimal_range[0] - word_count) * 0.5
        elif word_count > optimal_range[1]:
            score -= (word_count - optimal_range[1]) * 0.2
        
        # Required elements scoring
        if template_key == ContentType.EMAIL_MARKETING.value:
            if not re.search(r'\[.*?\]|Click here|Learn more', content, re.IGNORECASE):
                score -= 20  # Missing CTA
            if not re.search(r'Subject:', content):
                score -= 15  # Missing subject line
        
        elif template_key == ContentType.AD_COPY.value:
            if not re.search(r'\[.*?\]|Buy now|Get started', content, re.IGNORECASE):
                score -= 25  # Missing CTA
            
        elif template_key == ContentType.LINKEDIN_POST.value:
            hashtags = len(re.findall(r'#\w+', content))
            if hashtags < 3:
                score -= 10
            if not re.search(r'[?!]', content.split('\n')[-1]):
                score -= 10  # Missing engagement element
        
        # Professional quality indicators
        professional_indicators = ['professional', 'experience', 'insight', 'strategy', 'solution']
        professional_score = sum(1 for indicator in professional_indicators if indicator in content.lower())
        score += min(professional_score * 2, 10)
        
        # Engagement potential
        engagement_words = ['you', 'your', 'question', 'think', 'share', 'comment']
        engagement_score = sum(1 for word in engagement_words if word in content.lower())
        score += min(engagement_score * 1.5, 10)
        
        return max(0, min(100, score))
    
    def get_content_statistics(self, results: List[Dict]) -> Dict:
        """Generate statistics for a batch of content generation results"""
        if not results:
            return {}
        
        successful_results = [r for r in results if r['success']]
        
        stats = {
            'total_generated': len(results),
            'successful': len(successful_results),
            'failed': len(results) - len(successful_results),
            'success_rate': len(successful_results) / len(results) * 100,
            'average_quality_score': sum(r.get('quality_score', 0) for r in successful_results) / len(successful_results) if successful_results else 0,
            'total_words': sum(r.get('word_count', 0) for r in successful_results),
            'average_words': sum(r.get('word_count', 0) for r in successful_results) / len(successful_results) if successful_results else 0,
            'content_types': {},
            'validation_summary': {
                'valid_content': 0,
                'content_with_warnings': 0,
                'content_with_errors': 0
            }
        }
        
        # Content type breakdown
        for result in successful_results:
            template_key = result.get('template_key', 'unknown')
            if template_key not in stats['content_types']:
                stats['content_types'][template_key] = {
                    'count': 0,
                    'average_quality': 0,
                    'average_words': 0
                }
            
            stats['content_types'][template_key]['count'] += 1
            stats['content_types'][template_key]['average_quality'] += result.get('quality_score', 0)
            stats['content_types'][template_key]['average_words'] += result.get('word_count', 0)
        
        # Calculate averages for content types
        for content_type in stats['content_types']:
            count = stats['content_types'][content_type]['count']
            stats['content_types'][content_type]['average_quality'] /= count
            stats['content_types'][content_type]['average_words'] /= count
        
        # Validation summary
        for result in successful_results:
            validation = result.get('validation', {})
            if validation.get('is_valid', False):
                if validation.get('messages'):
                    stats['validation_summary']['content_with_warnings'] += 1
                else:
                    stats['validation_summary']['valid_content'] += 1
            else:
                stats['validation_summary']['content_with_errors'] += 1
        
        return stats
