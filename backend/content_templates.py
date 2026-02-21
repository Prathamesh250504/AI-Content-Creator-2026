"""
Content Type Template System
Defines different content types with specific formatting requirements and tone guidelines
"""

class ContentTemplate:
    def __init__(self, name, description, tone_options, length_options, required_fields, 
                 optional_fields, system_prompt_template, formatting_guidelines):
        self.name = name
        self.description = description
        self.tone_options = tone_options
        self.length_options = length_options
        self.required_fields = required_fields
        self.optional_fields = optional_fields
        self.system_prompt_template = system_prompt_template
        self.formatting_guidelines = formatting_guidelines

class ContentTemplateManager:
    def __init__(self):
        self.templates = self._initialize_templates()
    
    def _initialize_templates(self):
        """Initialize all content type templates"""
        templates = {}
        
        # LinkedIn Post Template
        templates["linkedin_post"] = ContentTemplate(
            name="LinkedIn Post",
            description="Professional social media content for LinkedIn networking",
            tone_options=["Professional", "Thought Leadership", "Inspirational", "Educational", "Personal"],
            length_options=["Short (100-200 words)", "Medium (200-400 words)", "Long (400-600 words)"],
            required_fields=["topic", "key_message"],
            optional_fields=["call_to_action", "hashtags", "target_audience"],
            system_prompt_template="""You are a LinkedIn content strategist. Create a {tone} LinkedIn post about {topic}.

Key requirements:
- Hook readers in the first line
- Include {key_message} as the main point
- Use line breaks for readability
- End with engagement question or call-to-action
- Include relevant hashtags if specified
- Target audience: {target_audience}
- Length: {length}

Format as a professional LinkedIn post with proper spacing and engagement elements.""",
            formatting_guidelines=[
                "Start with an attention-grabbing hook",
                "Use short paragraphs (1-2 sentences)",
                "Include emojis sparingly for visual appeal",
                "End with a question to encourage engagement",
                "Add 3-5 relevant hashtags at the end"
            ]
        )
        
        # Email Marketing Template
        templates["email_marketing"] = ContentTemplate(
            name="Email Marketing",
            description="Promotional emails for marketing campaigns and newsletters",
            tone_options=["Friendly", "Professional", "Urgent", "Conversational", "Persuasive"],
            length_options=["Short (150-300 words)", "Medium (300-500 words)", "Long (500-800 words)"],
            required_fields=["subject_line", "main_offer", "target_audience"],
            optional_fields=["urgency_factor", "personalization", "call_to_action"],
            system_prompt_template="""You are an email marketing specialist. Create a {tone} marketing email with the subject line: {subject_line}.

Key requirements:
- Main offer: {main_offer}
- Target audience: {target_audience}
- Include clear call-to-action
- Create urgency if specified: {urgency_factor}
- Personalization level: {personalization}
- Length: {length}

Format as a complete email with subject line, greeting, body, and signature.""",
            formatting_guidelines=[
                "Compelling subject line (under 50 characters)",
                "Personal greeting with recipient's name",
                "Clear value proposition in first paragraph",
                "Bullet points for key benefits",
                "Strong, action-oriented CTA button text",
                "Professional email signature"
            ]
        )
        
        # Ad Copy Template
        templates["ad_copy"] = ContentTemplate(
            name="Ad Copy",
            description="Persuasive advertising copy for digital marketing campaigns",
            tone_options=["Persuasive", "Urgent", "Friendly", "Bold", "Emotional"],
            length_options=["Short (25-50 words)", "Medium (50-100 words)", "Long (100-150 words)"],
            required_fields=["product_service", "target_audience", "main_benefit"],
            optional_fields=["pain_point", "offer_details", "urgency_element"],
            system_prompt_template="""You are a copywriting expert. Create {tone} ad copy for {product_service}.

Key requirements:
- Target audience: {target_audience}
- Main benefit: {main_benefit}
- Address pain point: {pain_point}
- Offer details: {offer_details}
- Urgency element: {urgency_element}
- Length: {length}

Create compelling ad copy that drives action and conversions.""",
            formatting_guidelines=[
                "Attention-grabbing headline",
                "Focus on benefits, not features",
                "Address specific pain points",
                "Include social proof if available",
                "Clear, compelling call-to-action",
                "Create urgency or scarcity"
            ]
        )
        
        # Blog Introduction Template
        templates["blog_intro"] = ContentTemplate(
            name="Blog Introduction",
            description="Engaging introductions for blog posts and articles",
            tone_options=["Informative", "Conversational", "Professional", "Storytelling", "Question-based"],
            length_options=["Short (100-200 words)", "Medium (200-350 words)", "Long (350-500 words)"],
            required_fields=["blog_topic", "main_points"],
            optional_fields=["hook_type", "target_reader", "article_length"],
            system_prompt_template="""You are a content writer specializing in blog introductions. Create a {tone} introduction for a blog post about {blog_topic}.

Key requirements:
- Main points to cover: {main_points}
- Hook type: {hook_type}
- Target reader: {target_reader}
- Article length context: {article_length}
- Length: {length}

Create an engaging introduction that hooks readers and sets up the article structure.""",
            formatting_guidelines=[
                "Start with a compelling hook (question, statistic, or story)",
                "Clearly state what the article will cover",
                "Explain why the reader should care",
                "Preview the main points or structure",
                "Transition smoothly into the main content",
                "Keep paragraphs short and scannable"
            ]
        )
        
        # Product Description Template
        templates["product_description"] = ContentTemplate(
            name="Product Description",
            description="Compelling product descriptions for e-commerce and catalogs",
            tone_options=["Persuasive", "Informative", "Luxury", "Casual", "Technical"],
            length_options=["Short (50-150 words)", "Medium (150-300 words)", "Long (300-500 words)"],
            required_fields=["product_name", "key_features", "target_customer"],
            optional_fields=["price_range", "unique_selling_point", "use_cases"],
            system_prompt_template="""You are a product copywriter. Create a {tone} description for {product_name}.

Key requirements:
- Key features: {key_features}
- Target customer: {target_customer}
- Price range: {price_range}
- Unique selling point: {unique_selling_point}
- Use cases: {use_cases}
- Length: {length}

Write a compelling product description that converts browsers into buyers.""",
            formatting_guidelines=[
                "Lead with the main benefit or unique value",
                "Use bullet points for key features",
                "Include technical specifications if relevant",
                "Address common customer concerns",
                "End with a clear call-to-action",
                "Use sensory language when appropriate"
            ]
        )
        
        # Press Release Template
        templates["press_release"] = ContentTemplate(
            name="Press Release",
            description="Professional press releases for media and public relations",
            tone_options=["Professional", "Newsworthy", "Formal", "Authoritative", "Informative"],
            length_options=["Short (300-500 words)", "Medium (500-700 words)", "Long (700-1000 words)"],
            required_fields=["announcement", "company_name", "key_details"],
            optional_fields=["quotes", "background_info", "contact_info"],
            system_prompt_template="""You are a PR professional. Create a {tone} press release about {announcement} for {company_name}.

Key requirements:
- Key details: {key_details}
- Include quotes: {quotes}
- Background information: {background_info}
- Contact information: {contact_info}
- Length: {length}

Follow standard press release format with headline, dateline, body, and boilerplate.""",
            formatting_guidelines=[
                "Compelling headline (under 10 words)",
                "Dateline with location and date",
                "Lead paragraph with who, what, when, where, why",
                "Include relevant quotes from key stakeholders",
                "Company boilerplate paragraph",
                "Media contact information"
            ]
        )
        
        # Social Media Caption Template
        templates["social_media_caption"] = ContentTemplate(
            name="Social Media Caption",
            description="Engaging captions for Instagram, Facebook, and other social platforms",
            tone_options=["Casual", "Fun", "Inspirational", "Educational", "Behind-the-scenes"],
            length_options=["Short (50-100 words)", "Medium (100-200 words)", "Long (200-300 words)"],
            required_fields=["platform", "content_theme", "main_message"],
            optional_fields=["hashtags", "call_to_action", "brand_voice"],
            system_prompt_template="""You are a social media manager. Create a {tone} caption for {platform} about {content_theme}.

Key requirements:
- Main message: {main_message}
- Brand voice: {brand_voice}
- Include hashtags: {hashtags}
- Call to action: {call_to_action}
- Length: {length}

Create an engaging caption that encourages interaction and fits the platform's style.""",
            formatting_guidelines=[
                "Start with an engaging hook or question",
                "Keep the message clear and concise",
                "Use platform-appropriate hashtags",
                "Include a clear call-to-action",
                "Match the brand's voice and personality",
                "Encourage comments and engagement"
            ]
        )
        
        return templates
    
    def get_template(self, template_key):
        """Get a specific template by key"""
        return self.templates.get(template_key)
    
    def get_all_templates(self):
        """Get all available templates"""
        return self.templates
    
    def get_template_names(self):
        """Get list of all template names for dropdown"""
        return [(key, template.name) for key, template in self.templates.items()]
    
    def generate_system_prompt(self, template_key, **kwargs):
        """Generate system prompt for a template with provided parameters"""
        template = self.get_template(template_key)
        if not template:
            return None
        
        try:
            return template.system_prompt_template.format(**kwargs)
        except KeyError as e:
            return f"Missing required parameter: {e}"

# Global instance
template_manager = ContentTemplateManager()