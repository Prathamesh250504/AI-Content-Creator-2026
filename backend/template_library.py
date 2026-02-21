"""
Template Library - Proven prompt templates for different use cases
"""

TEMPLATE_LIBRARY = {
    "social_media": [
        {
            "name": "LinkedIn Professional Post",
            "description": "Create engaging LinkedIn posts that drive professional engagement and thought leadership",
            "category": "social_media",
            "template_content": """Write a professional LinkedIn post about {{topic}}.

Tone: {{tone}}
Target audience: {{audience}}
Post length: {{length}} words
Include call-to-action: {{include_cta}}

Structure:
1. Hook: Start with an attention-grabbing statement or question
2. Context: Provide background or personal experience
3. Value: Share insights, tips, or lessons learned
4. Engagement: End with a question or call-to-action

Key requirements:
- Use professional yet conversational language
- Include relevant hashtags (3-5)
- Make it scannable with line breaks
- Focus on providing value to your network
- {{additional_requirements}}""",
            "variables": [
                {
                    "name": "topic",
                    "type": "text",
                    "description": "Main topic or theme of the post",
                    "required": True,
                    "placeholder": "e.g., remote work productivity, leadership lessons"
                },
                {
                    "name": "tone",
                    "type": "select",
                    "description": "Tone of the post",
                    "options": ["Professional", "Inspirational", "Educational", "Personal", "Thought-provoking"],
                    "default_value": "Professional",
                    "required": True
                },
                {
                    "name": "audience",
                    "type": "text",
                    "description": "Target audience",
                    "default_value": "professionals in my industry",
                    "required": True
                },
                {
                    "name": "length",
                    "type": "select",
                    "description": "Post length",
                    "options": ["100-150", "150-200", "200-300"],
                    "default_value": "150-200",
                    "required": True
                },
                {
                    "name": "include_cta",
                    "type": "boolean",
                    "description": "Include a call-to-action",
                    "default_value": True,
                    "required": False
                },
                {
                    "name": "additional_requirements",
                    "type": "textarea",
                    "description": "Any additional requirements or constraints",
                    "required": False,
                    "placeholder": "e.g., mention specific tools, include statistics"
                }
            ],
            "tags": ["linkedin", "professional", "social media", "engagement", "networking"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.8
        },
        {
            "name": "Twitter Thread Creator",
            "description": "Generate engaging Twitter threads that tell a story and drive engagement",
            "category": "social_media",
            "template_content": """Create a Twitter thread about {{topic}}.

Thread structure: {{thread_length}} tweets
Tone: {{tone}}
Target audience: {{audience}}

Thread format:
1/ Hook tweet - Start with a compelling statement or question
2/ Context - Set up the problem or situation
3-{{middle_tweets}}/ Main content - Break down key points (one per tweet)
{{final_tweet}}/ Conclusion - Summarize and include call-to-action

Requirements:
- Each tweet should be under 280 characters
- Use emojis strategically for visual appeal
- Include relevant hashtags in the final tweet
- Make each tweet valuable on its own
- Use thread numbering (1/, 2/, etc.)
- {{style_requirements}}

Focus on: {{focus_area}}""",
            "variables": [
                {
                    "name": "topic",
                    "type": "text",
                    "description": "Main topic for the thread",
                    "required": True,
                    "placeholder": "e.g., startup lessons, productivity tips"
                },
                {
                    "name": "thread_length",
                    "type": "select",
                    "description": "Number of tweets in thread",
                    "options": ["5", "7", "10", "12", "15"],
                    "default_value": "7",
                    "required": True
                },
                {
                    "name": "tone",
                    "type": "select",
                    "description": "Thread tone",
                    "options": ["Educational", "Storytelling", "Motivational", "Analytical", "Conversational"],
                    "default_value": "Educational",
                    "required": True
                },
                {
                    "name": "audience",
                    "type": "text",
                    "description": "Target audience",
                    "default_value": "entrepreneurs and creators",
                    "required": True
                },
                {
                    "name": "focus_area",
                    "type": "text",
                    "description": "Main focus or angle",
                    "required": True,
                    "placeholder": "e.g., actionable tips, personal experience, industry insights"
                },
                {
                    "name": "style_requirements",
                    "type": "textarea",
                    "description": "Specific style or formatting requirements",
                    "required": False,
                    "placeholder": "e.g., include statistics, use storytelling, add questions"
                }
            ],
            "tags": ["twitter", "thread", "social media", "storytelling", "engagement"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.7
        }
    ],
    "marketing": [
        {
            "name": "Email Marketing Campaign",
            "description": "Create compelling email marketing campaigns that drive conversions",
            "category": "marketing",
            "template_content": """Create an email marketing campaign for {{product_service}}.

Campaign type: {{campaign_type}}
Target audience: {{target_audience}}
Primary goal: {{primary_goal}}
Email tone: {{tone}}

Email structure:
Subject Line: Create 3 compelling subject line options
Preview Text: Write engaging preview text
Header: {{header_requirements}}
Body:
- Opening: Personal greeting and hook
- Value Proposition: Clear benefit statement
- Main Content: {{content_focus}}
- Social Proof: {{social_proof_type}}
- Call-to-Action: {{cta_style}}
- Footer: Professional closing

Requirements:
- Keep paragraphs short (2-3 sentences)
- Use bullet points for easy scanning
- Include personalization elements
- Mobile-friendly formatting
- {{additional_requirements}}

Conversion focus: {{conversion_focus}}""",
            "variables": [
                {
                    "name": "product_service",
                    "type": "text",
                    "description": "Product or service being promoted",
                    "required": True,
                    "placeholder": "e.g., SaaS platform, online course, consulting service"
                },
                {
                    "name": "campaign_type",
                    "type": "select",
                    "description": "Type of email campaign",
                    "options": ["Product Launch", "Promotional", "Newsletter", "Welcome Series", "Re-engagement", "Abandoned Cart"],
                    "default_value": "Promotional",
                    "required": True
                },
                {
                    "name": "target_audience",
                    "type": "text",
                    "description": "Target audience description",
                    "required": True,
                    "placeholder": "e.g., small business owners, marketing professionals"
                },
                {
                    "name": "primary_goal",
                    "type": "select",
                    "description": "Primary campaign goal",
                    "options": ["Drive Sales", "Increase Engagement", "Build Awareness", "Generate Leads", "Retain Customers"],
                    "default_value": "Drive Sales",
                    "required": True
                },
                {
                    "name": "tone",
                    "type": "select",
                    "description": "Email tone",
                    "options": ["Professional", "Friendly", "Urgent", "Educational", "Conversational"],
                    "default_value": "Professional",
                    "required": True
                },
                {
                    "name": "content_focus",
                    "type": "text",
                    "description": "Main content focus",
                    "required": True,
                    "placeholder": "e.g., feature benefits, customer success stories, limited-time offer"
                },
                {
                    "name": "social_proof_type",
                    "type": "select",
                    "description": "Type of social proof to include",
                    "options": ["Customer testimonials", "Usage statistics", "Awards/recognition", "Case studies", "User reviews"],
                    "default_value": "Customer testimonials",
                    "required": False
                },
                {
                    "name": "cta_style",
                    "type": "select",
                    "description": "Call-to-action style",
                    "options": ["Button with urgency", "Simple text link", "Multiple options", "Free trial focus"],
                    "default_value": "Button with urgency",
                    "required": True
                }
            ],
            "tags": ["email", "marketing", "conversion", "campaign", "sales"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.9
        },
        {
            "name": "Product Description Optimizer",
            "description": "Write compelling product descriptions that convert browsers into buyers",
            "category": "marketing",
            "template_content": """Write a compelling product description for {{product_name}}.

Product category: {{category}}
Target customer: {{target_customer}}
Price point: {{price_range}}
Key differentiator: {{main_differentiator}}

Description structure:
1. Headline: Benefit-focused product title
2. Hook: Opening line that captures attention
3. Problem: Pain point this product solves
4. Solution: How the product addresses the problem
5. Features & Benefits:
   {{feature_focus}}
6. Social Proof: {{social_proof}}
7. Guarantee/Risk Reversal: {{guarantee_type}}
8. Call-to-Action: {{cta_urgency}}

Writing style:
- Use {{writing_style}} language
- Focus on benefits over features
- Include emotional triggers
- Address common objections
- Use power words and sensory language
- {{style_notes}}

SEO considerations: {{seo_keywords}}""",
            "variables": [
                {
                    "name": "product_name",
                    "type": "text",
                    "description": "Name of the product",
                    "required": True,
                    "placeholder": "e.g., Wireless Bluetooth Headphones"
                },
                {
                    "name": "category",
                    "type": "text",
                    "description": "Product category",
                    "required": True,
                    "placeholder": "e.g., electronics, fashion, home goods"
                },
                {
                    "name": "target_customer",
                    "type": "text",
                    "description": "Primary target customer",
                    "required": True,
                    "placeholder": "e.g., busy professionals, fitness enthusiasts"
                },
                {
                    "name": "price_range",
                    "type": "select",
                    "description": "Price positioning",
                    "options": ["Budget-friendly", "Mid-range", "Premium", "Luxury"],
                    "default_value": "Mid-range",
                    "required": True
                },
                {
                    "name": "main_differentiator",
                    "type": "text",
                    "description": "Key differentiating factor",
                    "required": True,
                    "placeholder": "e.g., longest battery life, eco-friendly materials"
                },
                {
                    "name": "feature_focus",
                    "type": "select",
                    "description": "Feature presentation style",
                    "options": ["Bullet points with benefits", "Narrative storytelling", "Problem-solution pairs", "Comparison format"],
                    "default_value": "Bullet points with benefits",
                    "required": True
                },
                {
                    "name": "writing_style",
                    "type": "select",
                    "description": "Writing style",
                    "options": ["Conversational", "Professional", "Enthusiastic", "Technical", "Luxury"],
                    "default_value": "Conversational",
                    "required": True
                },
                {
                    "name": "seo_keywords",
                    "type": "text",
                    "description": "Important SEO keywords to include",
                    "required": False,
                    "placeholder": "e.g., wireless headphones, noise cancelling, bluetooth"
                }
            ],
            "tags": ["product description", "ecommerce", "conversion", "copywriting", "sales"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.8
        }
    ],
    "content_creation": [
        {
            "name": "Blog Post Structure",
            "description": "Create well-structured, SEO-optimized blog posts that engage readers and drive traffic",
            "category": "content_creation",
            "template_content": """Write a comprehensive blog post about {{topic}}.

Target audience: {{target_audience}}
Post length: {{word_count}} words
SEO focus keyword: {{primary_keyword}}
Content goal: {{content_goal}}
Tone: {{tone}}

Blog post structure:
1. SEO Title (60 characters max): Include primary keyword
2. Meta Description (155 characters): Compelling summary with keyword
3. Introduction (150-200 words):
   - Hook: {{hook_style}}
   - Problem/Question: What readers will learn
   - Preview: Brief outline of main points
4. Main Content:
   {{content_structure}}
5. Conclusion (100-150 words):
   - Summarize key takeaways
   - Call-to-action: {{cta_type}}
6. SEO Elements:
   - H2/H3 subheadings with keywords
   - Internal linking opportunities
   - Related keywords: {{related_keywords}}

Writing guidelines:
- Use short paragraphs (2-3 sentences)
- Include bullet points and numbered lists
- Add relevant examples and case studies
- {{writing_requirements}}

Content depth: {{content_depth}}""",
            "variables": [
                {
                    "name": "topic",
                    "type": "text",
                    "description": "Main blog post topic",
                    "required": True,
                    "placeholder": "e.g., content marketing strategies, remote work productivity"
                },
                {
                    "name": "target_audience",
                    "type": "text",
                    "description": "Target reader persona",
                    "required": True,
                    "placeholder": "e.g., small business owners, marketing professionals"
                },
                {
                    "name": "word_count",
                    "type": "select",
                    "description": "Target word count",
                    "options": ["800-1200", "1200-1800", "1800-2500", "2500+"],
                    "default_value": "1200-1800",
                    "required": True
                },
                {
                    "name": "primary_keyword",
                    "type": "text",
                    "description": "Main SEO keyword to target",
                    "required": True,
                    "placeholder": "e.g., content marketing tips"
                },
                {
                    "name": "content_goal",
                    "type": "select",
                    "description": "Primary content goal",
                    "options": ["Educate", "Inspire", "Convert", "Entertain", "Build Authority"],
                    "default_value": "Educate",
                    "required": True
                },
                {
                    "name": "tone",
                    "type": "select",
                    "description": "Writing tone",
                    "options": ["Professional", "Conversational", "Authoritative", "Friendly", "Technical"],
                    "default_value": "Conversational",
                    "required": True
                },
                {
                    "name": "hook_style",
                    "type": "select",
                    "description": "Introduction hook style",
                    "options": ["Surprising statistic", "Thought-provoking question", "Personal story", "Bold statement", "Common misconception"],
                    "default_value": "Thought-provoking question",
                    "required": True
                },
                {
                    "name": "content_structure",
                    "type": "select",
                    "description": "Main content organization",
                    "options": ["Step-by-step guide", "Listicle format", "Problem-solution", "Comparison/analysis", "Case study"],
                    "default_value": "Step-by-step guide",
                    "required": True
                },
                {
                    "name": "content_depth",
                    "type": "select",
                    "description": "Content depth level",
                    "options": ["Beginner-friendly", "Intermediate", "Advanced", "Expert-level"],
                    "default_value": "Intermediate",
                    "required": True
                }
            ],
            "tags": ["blog", "content marketing", "SEO", "writing", "traffic"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.9
        },
        {
            "name": "Video Script Creator",
            "description": "Create engaging video scripts for YouTube, social media, or marketing videos",
            "category": "content_creation",
            "template_content": """Create a video script for {{video_topic}}.

Video type: {{video_type}}
Platform: {{platform}}
Target length: {{duration}} minutes
Target audience: {{audience}}
Video goal: {{objective}}

Script structure:
1. Hook (0-5 seconds):
   {{hook_style}}
   
2. Introduction (5-15 seconds):
   - Brief self-introduction
   - What viewers will learn/gain
   - Why they should keep watching
   
3. Main Content ({{main_content_duration}}):
   {{content_format}}
   
4. Engagement Elements:
   - {{engagement_strategy}}
   - Call-to-action placements
   
5. Conclusion (last 15-30 seconds):
   - Recap key points
   - Strong call-to-action: {{cta_focus}}
   - Subscribe/follow reminder

Script formatting:
- [Visual cues in brackets]
- Clear speaker directions
- Timing markers
- {{script_style}}

Tone: {{tone}}
Energy level: {{energy_level}}

Additional requirements: {{special_requirements}}""",
            "variables": [
                {
                    "name": "video_topic",
                    "type": "text",
                    "description": "Main video topic or theme",
                    "required": True,
                    "placeholder": "e.g., productivity tips, product review, tutorial"
                },
                {
                    "name": "video_type",
                    "type": "select",
                    "description": "Type of video content",
                    "options": ["Tutorial/How-to", "Product Review", "Educational", "Entertainment", "Promotional", "Testimonial"],
                    "default_value": "Educational",
                    "required": True
                },
                {
                    "name": "platform",
                    "type": "select",
                    "description": "Primary platform for the video",
                    "options": ["YouTube", "Instagram", "TikTok", "LinkedIn", "Facebook", "Website"],
                    "default_value": "YouTube",
                    "required": True
                },
                {
                    "name": "duration",
                    "type": "select",
                    "description": "Target video length",
                    "options": ["0.5-1", "1-3", "3-5", "5-10", "10-15", "15+"],
                    "default_value": "3-5",
                    "required": True
                },
                {
                    "name": "audience",
                    "type": "text",
                    "description": "Target audience description",
                    "required": True,
                    "placeholder": "e.g., entrepreneurs, students, professionals"
                },
                {
                    "name": "objective",
                    "type": "select",
                    "description": "Primary video objective",
                    "options": ["Educate", "Entertain", "Sell/Convert", "Build Brand", "Drive Traffic"],
                    "default_value": "Educate",
                    "required": True
                },
                {
                    "name": "hook_style",
                    "type": "select",
                    "description": "Opening hook strategy",
                    "options": ["Surprising fact", "Bold promise", "Question", "Preview of results", "Controversy/debate"],
                    "default_value": "Bold promise",
                    "required": True
                },
                {
                    "name": "content_format",
                    "type": "select",
                    "description": "Main content presentation",
                    "options": ["Step-by-step process", "Tips and tricks", "Story/narrative", "Demonstration", "Interview style"],
                    "default_value": "Step-by-step process",
                    "required": True
                },
                {
                    "name": "tone",
                    "type": "select",
                    "description": "Video tone",
                    "options": ["Professional", "Casual", "Enthusiastic", "Authoritative", "Friendly"],
                    "default_value": "Enthusiastic",
                    "required": True
                },
                {
                    "name": "energy_level",
                    "type": "select",
                    "description": "Energy level",
                    "options": ["High energy", "Moderate", "Calm/relaxed", "Varies by section"],
                    "default_value": "Moderate",
                    "required": True
                }
            ],
            "tags": ["video", "script", "youtube", "content creation", "engagement"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.7
        }
    ],
    "business": [
        {
            "name": "Business Proposal Generator",
            "description": "Create professional business proposals that win clients and close deals",
            "category": "business",
            "template_content": """Create a comprehensive business proposal for {{project_type}}.

Client: {{client_name}}
Industry: {{client_industry}}
Project scope: {{project_scope}}
Timeline: {{project_timeline}}
Budget range: {{budget_range}}

Proposal structure:

1. Executive Summary
   - Project overview
   - Key benefits and ROI
   - Investment summary

2. Understanding Your Needs
   - Current situation analysis
   - Challenges identified: {{main_challenges}}
   - Desired outcomes: {{desired_outcomes}}

3. Proposed Solution
   - Our approach: {{solution_approach}}
   - Methodology: {{methodology}}
   - Deliverables: {{key_deliverables}}

4. Why Choose Us
   - Relevant experience: {{experience_highlights}}
   - Team qualifications
   - Success stories/case studies

5. Project Timeline & Milestones
   - Phase breakdown
   - Key milestones
   - Dependencies and assumptions

6. Investment & Terms
   - Pricing structure: {{pricing_model}}
   - Payment terms
   - What's included/excluded

7. Next Steps
   - Decision timeline
   - Implementation start date
   - Contact information

Tone: {{proposal_tone}}
Emphasis: {{key_emphasis}}""",
            "variables": [
                {
                    "name": "project_type",
                    "type": "text",
                    "description": "Type of project or service",
                    "required": True,
                    "placeholder": "e.g., website redesign, marketing campaign, consulting project"
                },
                {
                    "name": "client_name",
                    "type": "text",
                    "description": "Client or company name",
                    "required": True,
                    "placeholder": "e.g., ABC Corporation"
                },
                {
                    "name": "client_industry",
                    "type": "text",
                    "description": "Client's industry",
                    "required": True,
                    "placeholder": "e.g., healthcare, technology, retail"
                },
                {
                    "name": "project_scope",
                    "type": "textarea",
                    "description": "Brief project scope description",
                    "required": True,
                    "placeholder": "Describe the main project requirements and scope"
                },
                {
                    "name": "project_timeline",
                    "type": "select",
                    "description": "Expected project duration",
                    "options": ["2-4 weeks", "1-2 months", "2-3 months", "3-6 months", "6+ months"],
                    "default_value": "2-3 months",
                    "required": True
                },
                {
                    "name": "budget_range",
                    "type": "select",
                    "description": "Budget range",
                    "options": ["Under $5K", "$5K-$15K", "$15K-$50K", "$50K-$100K", "$100K+"],
                    "default_value": "$15K-$50K",
                    "required": True
                },
                {
                    "name": "solution_approach",
                    "type": "text",
                    "description": "Your solution approach",
                    "required": True,
                    "placeholder": "e.g., agile methodology, phased approach, collaborative process"
                },
                {
                    "name": "pricing_model",
                    "type": "select",
                    "description": "Pricing structure",
                    "options": ["Fixed price", "Hourly rate", "Retainer", "Performance-based", "Hybrid"],
                    "default_value": "Fixed price",
                    "required": True
                },
                {
                    "name": "proposal_tone",
                    "type": "select",
                    "description": "Proposal tone",
                    "options": ["Professional", "Consultative", "Collaborative", "Authoritative", "Friendly"],
                    "default_value": "Professional",
                    "required": True
                }
            ],
            "tags": ["business", "proposal", "sales", "client", "professional"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.8
        },
        {
            "name": "Meeting Agenda Creator",
            "description": "Create structured meeting agendas that ensure productive and focused discussions",
            "category": "business",
            "template_content": """Create a meeting agenda for {{meeting_purpose}}.

Meeting details:
- Date & Time: {{meeting_datetime}}
- Duration: {{duration}} minutes
- Attendees: {{attendee_count}} people
- Meeting type: {{meeting_type}}
- Primary objective: {{main_objective}}

MEETING AGENDA

Meeting: {{meeting_title}}
Date: {{meeting_datetime}}
Duration: {{duration}} minutes
Location/Platform: {{location}}

Attendees:
{{attendee_list}}

Pre-meeting preparation:
{{preparation_items}}

AGENDA ITEMS:

1. Welcome & Check-in ({{checkin_duration}} min)
   - Brief introductions (if needed)
   - Agenda review
   - Ground rules reminder

{{agenda_items}}

{{decision_items}}

Action Items Review ({{action_review_duration}} min)
- Recap decisions made
- Assign action items with owners and deadlines
- Next steps and follow-up

Meeting wrap-up ({{wrapup_duration}} min)
- Key takeaways
- Next meeting date (if applicable)
- Thank you and adjournment

Post-meeting:
- Meeting notes distribution: Within {{followup_timeline}}
- Action item tracking
- {{followup_requirements}}

Meeting facilitation notes:
{{facilitation_style}}""",
            "variables": [
                {
                    "name": "meeting_purpose",
                    "type": "text",
                    "description": "Main purpose of the meeting",
                    "required": True,
                    "placeholder": "e.g., quarterly planning, project kickoff, team sync"
                },
                {
                    "name": "meeting_title",
                    "type": "text",
                    "description": "Meeting title",
                    "required": True,
                    "placeholder": "e.g., Q1 Marketing Strategy Planning"
                },
                {
                    "name": "meeting_type",
                    "type": "select",
                    "description": "Type of meeting",
                    "options": ["Team Meeting", "Project Meeting", "Strategy Session", "Review Meeting", "Planning Meeting", "Decision Meeting"],
                    "default_value": "Team Meeting",
                    "required": True
                },
                {
                    "name": "duration",
                    "type": "select",
                    "description": "Meeting duration",
                    "options": ["30", "45", "60", "90", "120"],
                    "default_value": "60",
                    "required": True
                },
                {
                    "name": "attendee_count",
                    "type": "select",
                    "description": "Number of attendees",
                    "options": ["2-3", "4-6", "7-10", "11-15", "15+"],
                    "default_value": "4-6",
                    "required": True
                },
                {
                    "name": "main_objective",
                    "type": "text",
                    "description": "Primary meeting objective",
                    "required": True,
                    "placeholder": "e.g., finalize Q1 goals, review project status, make budget decisions"
                },
                {
                    "name": "facilitation_style",
                    "type": "select",
                    "description": "Meeting facilitation approach",
                    "options": ["Structured/formal", "Collaborative", "Discussion-based", "Presentation-heavy", "Workshop style"],
                    "default_value": "Collaborative",
                    "required": True
                },
                {
                    "name": "followup_timeline",
                    "type": "select",
                    "description": "Follow-up timeline",
                    "options": ["24 hours", "48 hours", "3 days", "1 week"],
                    "default_value": "24 hours",
                    "required": True
                }
            ],
            "tags": ["meeting", "agenda", "productivity", "business", "organization"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.6
        }
    ],
    "creative": [
        {
            "name": "Creative Brief Generator",
            "description": "Develop comprehensive creative briefs for design, marketing, and content projects",
            "category": "creative",
            "template_content": """Create a creative brief for {{project_name}}.

Project Overview:
Project: {{project_name}}
Client/Brand: {{brand_name}}
Project type: {{project_type}}
Timeline: {{timeline}}
Budget: {{budget_range}}

CREATIVE BRIEF

1. Project Background
   {{project_background}}

2. Objectives
   Primary goal: {{primary_objective}}
   Secondary goals: {{secondary_objectives}}
   Success metrics: {{success_metrics}}

3. Target Audience
   Primary audience: {{primary_audience}}
   Demographics: {{demographics}}
   Psychographics: {{psychographics}}
   Pain points: {{audience_pain_points}}
   Motivations: {{audience_motivations}}

4. Key Message
   Main message: {{key_message}}
   Supporting messages: {{supporting_messages}}
   Tone of voice: {{tone_of_voice}}
   Brand personality: {{brand_personality}}

5. Creative Direction
   Style preference: {{style_preference}}
   Visual mood: {{visual_mood}}
   Color palette: {{color_direction}}
   Typography style: {{typography_style}}
   Imagery style: {{imagery_style}}

6. Deliverables
   {{deliverables_list}}

7. Brand Guidelines
   {{brand_guidelines}}

8. Competitive Landscape
   {{competitive_analysis}}

9. Constraints & Considerations
   {{constraints}}

10. Approval Process
    {{approval_process}}

References & Inspiration:
{{inspiration_references}}""",
            "variables": [
                {
                    "name": "project_name",
                    "type": "text",
                    "description": "Name of the creative project",
                    "required": True,
                    "placeholder": "e.g., Brand Identity Redesign, Product Launch Campaign"
                },
                {
                    "name": "brand_name",
                    "type": "text",
                    "description": "Brand or client name",
                    "required": True,
                    "placeholder": "e.g., TechStart Inc."
                },
                {
                    "name": "project_type",
                    "type": "select",
                    "description": "Type of creative project",
                    "options": ["Brand Identity", "Marketing Campaign", "Website Design", "Print Design", "Video Production", "Social Media Campaign"],
                    "default_value": "Marketing Campaign",
                    "required": True
                },
                {
                    "name": "timeline",
                    "type": "select",
                    "description": "Project timeline",
                    "options": ["1-2 weeks", "2-4 weeks", "1-2 months", "2-3 months", "3+ months"],
                    "default_value": "2-4 weeks",
                    "required": True
                },
                {
                    "name": "primary_objective",
                    "type": "text",
                    "description": "Main project objective",
                    "required": True,
                    "placeholder": "e.g., increase brand awareness, drive sales, launch new product"
                },
                {
                    "name": "primary_audience",
                    "type": "text",
                    "description": "Primary target audience",
                    "required": True,
                    "placeholder": "e.g., millennials interested in sustainable fashion"
                },
                {
                    "name": "key_message",
                    "type": "text",
                    "description": "Main message to communicate",
                    "required": True,
                    "placeholder": "e.g., Innovation that simplifies your life"
                },
                {
                    "name": "tone_of_voice",
                    "type": "select",
                    "description": "Brand tone of voice",
                    "options": ["Professional", "Friendly", "Authoritative", "Playful", "Sophisticated", "Approachable"],
                    "default_value": "Professional",
                    "required": True
                },
                {
                    "name": "style_preference",
                    "type": "select",
                    "description": "Visual style preference",
                    "options": ["Modern/Minimalist", "Bold/Vibrant", "Classic/Traditional", "Edgy/Contemporary", "Organic/Natural", "Luxury/Premium"],
                    "default_value": "Modern/Minimalist",
                    "required": True
                }
            ],
            "tags": ["creative", "brief", "design", "branding", "marketing"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.7
        }
    ],
    "technical": [
        {
            "name": "Technical Documentation",
            "description": "Create clear, comprehensive technical documentation for software, APIs, and systems",
            "category": "technical",
            "template_content": """Create technical documentation for {{system_name}}.

Documentation type: {{doc_type}}
Target audience: {{target_audience}}
Technical level: {{technical_level}}
System/Product: {{system_name}}

TECHNICAL DOCUMENTATION

# {{system_name}} - {{doc_type}}

## Overview
{{system_overview}}

## Prerequisites
{{prerequisites}}

## Getting Started
{{getting_started_section}}

## Architecture
{{architecture_section}}

## Installation/Setup
{{installation_section}}

## Configuration
{{configuration_section}}

## Usage Examples
{{usage_examples}}

## API Reference (if applicable)
{{api_reference}}

## Troubleshooting
{{troubleshooting_section}}

## Best Practices
{{best_practices}}

## Security Considerations
{{security_section}}

## Performance Guidelines
{{performance_section}}

## FAQ
{{faq_section}}

## Support & Resources
{{support_section}}

## Changelog/Version History
{{changelog_section}}

Documentation standards:
- Use clear, concise language
- Include code examples with syntax highlighting
- Add screenshots/diagrams where helpful
- Maintain consistent formatting
- {{documentation_standards}}

Update frequency: {{update_frequency}}""",
            "variables": [
                {
                    "name": "system_name",
                    "type": "text",
                    "description": "Name of the system, API, or software",
                    "required": True,
                    "placeholder": "e.g., Payment API, User Management System"
                },
                {
                    "name": "doc_type",
                    "type": "select",
                    "description": "Type of documentation",
                    "options": ["API Documentation", "User Guide", "Developer Guide", "Installation Guide", "System Architecture", "Troubleshooting Guide"],
                    "default_value": "User Guide",
                    "required": True
                },
                {
                    "name": "target_audience",
                    "type": "select",
                    "description": "Primary audience",
                    "options": ["Developers", "End Users", "System Administrators", "Technical Writers", "Product Managers"],
                    "default_value": "Developers",
                    "required": True
                },
                {
                    "name": "technical_level",
                    "type": "select",
                    "description": "Technical complexity level",
                    "options": ["Beginner", "Intermediate", "Advanced", "Expert"],
                    "default_value": "Intermediate",
                    "required": True
                },
                {
                    "name": "system_overview",
                    "type": "textarea",
                    "description": "Brief system overview",
                    "required": True,
                    "placeholder": "Describe what the system does and its main purpose"
                },
                {
                    "name": "documentation_standards",
                    "type": "textarea",
                    "description": "Specific documentation standards or requirements",
                    "required": False,
                    "placeholder": "e.g., follow company style guide, include version numbers"
                },
                {
                    "name": "update_frequency",
                    "type": "select",
                    "description": "Documentation update frequency",
                    "options": ["With each release", "Monthly", "Quarterly", "As needed"],
                    "default_value": "With each release",
                    "required": True
                }
            ],
            "tags": ["technical", "documentation", "API", "software", "development"],
            "is_public": True,
            "usage_count": 0,
            "rating": 4.5
        }
    ]
}

def get_all_templates():
    """Get all templates from the library"""
    all_templates = []
    for category, templates in TEMPLATE_LIBRARY.items():
        all_templates.extend(templates)
    return all_templates

def get_templates_by_category(category):
    """Get templates for a specific category"""
    return TEMPLATE_LIBRARY.get(category, [])

def get_template_categories():
    """Get all available categories"""
    return [
        {"value": "social_media", "label": "Social Media"},
        {"value": "marketing", "label": "Marketing & Sales"},
        {"value": "content_creation", "label": "Content Creation"},
        {"value": "business", "label": "Business & Professional"},
        {"value": "creative", "label": "Creative & Design"},
        {"value": "technical", "label": "Technical & Documentation"},
        {"value": "custom", "label": "Custom"}
    ]