"""
Content Quality Analysis Module
Analyzes generated content for quality metrics including readability, sentiment, keyword density, and engagement potential
"""

import re
import math
from typing import Dict, List, Tuple, Any
from collections import Counter
import logging

# NLP Libraries
try:
    import spacy
    import textblob
    import nltk
    import textstat
    SPACY_AVAILABLE = True
    TEXTBLOB_AVAILABLE = True
    NLTK_AVAILABLE = True
    TEXTSTAT_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Some NLP libraries not available: {e}")
    SPACY_AVAILABLE = False
    TEXTBLOB_AVAILABLE = False
    NLTK_AVAILABLE = False
    TEXTSTAT_AVAILABLE = False

class ContentQualityAnalyzer:
    """
    Comprehensive content quality analysis using multiple NLP techniques
    """
    
    def __init__(self):
        """Initialize the analyzer with NLP models"""
        self.nlp = None
        self.setup_nlp_models()
        
        # Quality thresholds
        self.thresholds = {
            'readability': {
                'excellent': 90,
                'good': 70,
                'fair': 50,
                'poor': 30
            },
            'sentiment': {
                'very_positive': 0.5,
                'positive': 0.1,
                'neutral': -0.1,
                'negative': -0.5
            },
            'engagement': {
                'high': 80,
                'medium': 60,
                'low': 40
            }
        }
    
    def setup_nlp_models(self):
        """Setup NLP models with fallback handling"""
        try:
            if SPACY_AVAILABLE:
                # Try to load English model
                try:
                    self.nlp = spacy.load("en_core_web_sm")
                except OSError:
                    logging.warning("spaCy English model not found. Install with: python -m spacy download en_core_web_sm")
                    self.nlp = None
            
            if NLTK_AVAILABLE:
                # Download required NLTK data
                try:
                    nltk.download('punkt', quiet=True)
                    nltk.download('stopwords', quiet=True)
                    nltk.download('vader_lexicon', quiet=True)
                except:
                    logging.warning("Could not download NLTK data")
                    
        except Exception as e:
            logging.error(f"Error setting up NLP models: {e}")
    
    def analyze_content(self, content: str, content_type: str = "general") -> Dict[str, Any]:
        """
        Perform comprehensive content quality analysis
        
        Args:
            content: Text content to analyze
            content_type: Type of content (blog, social, email, etc.)
            
        Returns:
            Dictionary containing all quality metrics and suggestions
        """
        if not content or not content.strip():
            return self._empty_analysis()
        
        # Clean content for analysis
        clean_content = self._clean_content(content)
        
        # Perform all analyses
        analysis = {
            'content_length': len(content),
            'word_count': len(clean_content.split()),
            'readability': self._analyze_readability(clean_content),
            'sentiment': self._analyze_sentiment(clean_content),
            'keyword_density': self._analyze_keyword_density(clean_content),
            'engagement_potential': self._analyze_engagement_potential(clean_content, content_type),
            'structure_analysis': self._analyze_structure(content),
            'linguistic_features': self._analyze_linguistic_features(clean_content),
            'overall_score': 0,  # Will be calculated
            'suggestions': [],  # Will be populated
            'content_type': content_type
        }
        
        # Calculate overall score and generate suggestions
        analysis['overall_score'] = self._calculate_overall_score(analysis)
        analysis['suggestions'] = self._generate_suggestions(analysis)
        
        return analysis
    
    def _clean_content(self, content: str) -> str:
        """Clean content for analysis"""
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', '', content)
        # Remove extra whitespace
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        # Remove special characters but keep punctuation
        clean_text = re.sub(r'[^\w\s.,!?;:\-\'"()]', '', clean_text)
        return clean_text
    
    def _analyze_readability(self, content: str) -> Dict[str, Any]:
        """Analyze content readability using multiple metrics"""
        readability = {
            'flesch_kincaid_grade': 0,
            'flesch_reading_ease': 0,
            'gunning_fog': 0,
            'automated_readability_index': 0,
            'average_sentence_length': 0,
            'average_word_length': 0,
            'score': 0,
            'level': 'unknown'
        }
        
        try:
            if TEXTSTAT_AVAILABLE and content:
                readability['flesch_kincaid_grade'] = textstat.flesch_kincaid_grade(content)
                readability['flesch_reading_ease'] = textstat.flesch_reading_ease(content)
                readability['gunning_fog'] = textstat.gunning_fog(content)
                readability['automated_readability_index'] = textstat.automated_readability_index(content)
                
                # Calculate averages
                sentences = self._split_sentences(content)
                words = content.split()
                
                if sentences:
                    readability['average_sentence_length'] = len(words) / len(sentences)
                
                if words:
                    total_chars = sum(len(word) for word in words)
                    readability['average_word_length'] = total_chars / len(words)
                
                # Calculate composite score (0-100)
                flesch_score = max(0, min(100, readability['flesch_reading_ease']))
                readability['score'] = flesch_score
                
                # Determine level
                if flesch_score >= 90:
                    readability['level'] = 'very_easy'
                elif flesch_score >= 80:
                    readability['level'] = 'easy'
                elif flesch_score >= 70:
                    readability['level'] = 'fairly_easy'
                elif flesch_score >= 60:
                    readability['level'] = 'standard'
                elif flesch_score >= 50:
                    readability['level'] = 'fairly_difficult'
                elif flesch_score >= 30:
                    readability['level'] = 'difficult'
                else:
                    readability['level'] = 'very_difficult'
            
        except Exception as e:
            logging.error(f"Error in readability analysis: {e}")
        
        return readability
    
    def _analyze_sentiment(self, content: str) -> Dict[str, Any]:
        """Analyze content sentiment"""
        sentiment = {
            'polarity': 0.0,  # -1 (negative) to 1 (positive)
            'subjectivity': 0.0,  # 0 (objective) to 1 (subjective)
            'compound': 0.0,
            'positive': 0.0,
            'negative': 0.0,
            'neutral': 0.0,
            'label': 'neutral',
            'confidence': 0.0
        }
        
        try:
            if TEXTBLOB_AVAILABLE:
                blob = textblob.TextBlob(content)
                sentiment['polarity'] = blob.sentiment.polarity
                sentiment['subjectivity'] = blob.sentiment.subjectivity
                
                # Determine label
                if sentiment['polarity'] > 0.1:
                    sentiment['label'] = 'positive'
                elif sentiment['polarity'] < -0.1:
                    sentiment['label'] = 'negative'
                else:
                    sentiment['label'] = 'neutral'
                
                sentiment['confidence'] = abs(sentiment['polarity'])
            
            # Try NLTK VADER for additional sentiment analysis
            if NLTK_AVAILABLE:
                try:
                    from nltk.sentiment import SentimentIntensityAnalyzer
                    sia = SentimentIntensityAnalyzer()
                    scores = sia.polarity_scores(content)
                    
                    sentiment['compound'] = scores['compound']
                    sentiment['positive'] = scores['pos']
                    sentiment['negative'] = scores['neg']
                    sentiment['neutral'] = scores['neu']
                    
                except Exception as e:
                    logging.warning(f"VADER sentiment analysis failed: {e}")
        
        except Exception as e:
            logging.error(f"Error in sentiment analysis: {e}")
        
        return sentiment
    
    def _analyze_keyword_density(self, content: str) -> Dict[str, Any]:
        """Analyze keyword density and important terms"""
        keyword_analysis = {
            'top_keywords': [],
            'keyword_density': {},
            'total_unique_words': 0,
            'lexical_diversity': 0.0,
            'most_frequent_words': [],
            'stop_word_ratio': 0.0
        }
        
        try:
            words = content.lower().split()
            if not words:
                return keyword_analysis
            
            # Remove common stop words
            stop_words = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'])
            
            # Clean words (remove punctuation)
            clean_words = []
            for word in words:
                clean_word = re.sub(r'[^\w]', '', word)
                if clean_word and len(clean_word) > 2:
                    clean_words.append(clean_word)
            
            if not clean_words:
                return keyword_analysis
            
            # Calculate basic metrics
            word_counts = Counter(clean_words)
            total_words = len(clean_words)
            unique_words = len(word_counts)
            
            keyword_analysis['total_unique_words'] = unique_words
            keyword_analysis['lexical_diversity'] = unique_words / total_words if total_words > 0 else 0
            
            # Get most frequent words (excluding stop words)
            content_words = [word for word in clean_words if word not in stop_words]
            if content_words:
                content_word_counts = Counter(content_words)
                keyword_analysis['most_frequent_words'] = content_word_counts.most_common(10)
                
                # Calculate keyword density for top words
                for word, count in content_word_counts.most_common(5):
                    density = (count / total_words) * 100
                    keyword_analysis['keyword_density'][word] = round(density, 2)
                
                keyword_analysis['top_keywords'] = [word for word, _ in content_word_counts.most_common(5)]
            
            # Calculate stop word ratio
            stop_word_count = sum(1 for word in clean_words if word in stop_words)
            keyword_analysis['stop_word_ratio'] = stop_word_count / total_words if total_words > 0 else 0
            
        except Exception as e:
            logging.error(f"Error in keyword density analysis: {e}")
        
        return keyword_analysis
    
    def _analyze_engagement_potential(self, content: str, content_type: str) -> Dict[str, Any]:
        """Analyze potential for user engagement"""
        engagement = {
            'score': 0,
            'factors': {},
            'level': 'low',
            'emotional_words': 0,
            'question_count': 0,
            'call_to_action_count': 0,
            'power_words': 0,
            'urgency_indicators': 0
        }
        
        try:
            # Define engagement indicators
            emotional_words = ['amazing', 'incredible', 'fantastic', 'awesome', 'brilliant', 'exciting', 'stunning', 'remarkable', 'outstanding', 'exceptional', 'love', 'hate', 'fear', 'joy', 'surprise', 'anger', 'sad', 'happy']
            
            power_words = ['free', 'new', 'proven', 'guaranteed', 'exclusive', 'limited', 'secret', 'revealed', 'discover', 'breakthrough', 'revolutionary', 'ultimate', 'essential', 'powerful', 'effective']
            
            urgency_words = ['now', 'today', 'immediately', 'urgent', 'hurry', 'quick', 'fast', 'deadline', 'limited time', 'expires', 'last chance', 'don\'t wait']
            
            cta_phrases = ['click here', 'learn more', 'get started', 'sign up', 'download', 'subscribe', 'buy now', 'order now', 'contact us', 'call now', 'visit', 'try', 'start']
            
            content_lower = content.lower()
            
            # Count engagement factors
            engagement['emotional_words'] = sum(1 for word in emotional_words if word in content_lower)
            engagement['power_words'] = sum(1 for word in power_words if word in content_lower)
            engagement['urgency_indicators'] = sum(1 for phrase in urgency_words if phrase in content_lower)
            engagement['call_to_action_count'] = sum(1 for phrase in cta_phrases if phrase in content_lower)
            engagement['question_count'] = content.count('?')
            
            # Calculate factor scores
            word_count = len(content.split())
            if word_count > 0:
                engagement['factors'] = {
                    'emotional_appeal': min(100, (engagement['emotional_words'] / word_count) * 1000),
                    'power_words_usage': min(100, (engagement['power_words'] / word_count) * 1000),
                    'urgency_factor': min(100, (engagement['urgency_indicators'] / word_count) * 1000),
                    'interactivity': min(100, (engagement['question_count'] + engagement['call_to_action_count']) * 10),
                    'content_type_bonus': self._get_content_type_bonus(content_type)
                }
            
            # Calculate overall engagement score
            factor_scores = list(engagement['factors'].values())
            if factor_scores:
                engagement['score'] = sum(factor_scores) / len(factor_scores)
            
            # Determine engagement level
            if engagement['score'] >= 80:
                engagement['level'] = 'high'
            elif engagement['score'] >= 60:
                engagement['level'] = 'medium'
            else:
                engagement['level'] = 'low'
                
        except Exception as e:
            logging.error(f"Error in engagement analysis: {e}")
        
        return engagement
    
    def _analyze_structure(self, content: str) -> Dict[str, Any]:
        """Analyze content structure and formatting"""
        structure = {
            'paragraph_count': 0,
            'sentence_count': 0,
            'average_paragraph_length': 0,
            'has_headings': False,
            'has_lists': False,
            'has_links': False,
            'formatting_score': 0,
            'structure_quality': 'poor'
        }
        
        try:
            # Count paragraphs (double line breaks)
            paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
            structure['paragraph_count'] = len(paragraphs)
            
            # Count sentences
            sentences = self._split_sentences(content)
            structure['sentence_count'] = len(sentences)
            
            # Average paragraph length
            if paragraphs:
                total_words = sum(len(p.split()) for p in paragraphs)
                structure['average_paragraph_length'] = total_words / len(paragraphs)
            
            # Check for formatting elements
            structure['has_headings'] = bool(re.search(r'^#+\s', content, re.MULTILINE) or 
                                           re.search(r'\*\*.*\*\*', content))
            structure['has_lists'] = bool(re.search(r'^\s*[-*•]\s', content, re.MULTILINE) or 
                                        re.search(r'^\s*\d+\.\s', content, re.MULTILINE))
            structure['has_links'] = bool(re.search(r'https?://', content) or 
                                        re.search(r'\[.*\]\(.*\)', content))
            
            # Calculate formatting score
            score = 0
            if structure['paragraph_count'] > 1:
                score += 20
            if 3 <= structure['average_paragraph_length'] <= 8:  # Good paragraph length
                score += 20
            if structure['has_headings']:
                score += 20
            if structure['has_lists']:
                score += 20
            if structure['sentence_count'] > 3:
                score += 20
            
            structure['formatting_score'] = score
            
            # Determine structure quality
            if score >= 80:
                structure['structure_quality'] = 'excellent'
            elif score >= 60:
                structure['structure_quality'] = 'good'
            elif score >= 40:
                structure['structure_quality'] = 'fair'
            else:
                structure['structure_quality'] = 'poor'
                
        except Exception as e:
            logging.error(f"Error in structure analysis: {e}")
        
        return structure
    
    def _analyze_linguistic_features(self, content: str) -> Dict[str, Any]:
        """Analyze linguistic features using spaCy if available"""
        features = {
            'named_entities': [],
            'pos_distribution': {},
            'dependency_complexity': 0,
            'vocabulary_richness': 0,
            'sentence_variety': 0
        }
        
        try:
            if self.nlp and content:
                doc = self.nlp(content)
                
                # Extract named entities
                features['named_entities'] = [(ent.text, ent.label_) for ent in doc.ents]
                
                # POS distribution
                pos_counts = Counter([token.pos_ for token in doc])
                total_tokens = len([token for token in doc if not token.is_space])
                if total_tokens > 0:
                    features['pos_distribution'] = {
                        pos: count / total_tokens for pos, count in pos_counts.items()
                    }
                
                # Sentence variety (different sentence lengths)
                sentence_lengths = [len([token for token in sent if not token.is_space]) 
                                  for sent in doc.sents]
                if sentence_lengths:
                    features['sentence_variety'] = len(set(sentence_lengths)) / len(sentence_lengths)
                
        except Exception as e:
            logging.error(f"Error in linguistic analysis: {e}")
        
        return features
    
    def _calculate_overall_score(self, analysis: Dict[str, Any]) -> float:
        """Calculate overall content quality score (0-100)"""
        try:
            scores = []
            weights = []
            
            # Readability score (weight: 25%)
            if analysis['readability']['score'] > 0:
                scores.append(analysis['readability']['score'])
                weights.append(0.25)
            
            # Engagement score (weight: 30%)
            if analysis['engagement_potential']['score'] > 0:
                scores.append(analysis['engagement_potential']['score'])
                weights.append(0.30)
            
            # Structure score (weight: 20%)
            if analysis['structure_analysis']['formatting_score'] > 0:
                scores.append(analysis['structure_analysis']['formatting_score'])
                weights.append(0.20)
            
            # Keyword diversity score (weight: 15%)
            lexical_diversity = analysis['keyword_density']['lexical_diversity']
            if lexical_diversity > 0:
                # Convert to 0-100 scale (higher diversity is better, but cap at reasonable level)
                diversity_score = min(100, lexical_diversity * 200)
                scores.append(diversity_score)
                weights.append(0.15)
            
            # Sentiment confidence (weight: 10%)
            sentiment_confidence = abs(analysis['sentiment']['polarity']) * 100
            scores.append(sentiment_confidence)
            weights.append(0.10)
            
            # Calculate weighted average
            if scores and weights:
                total_weight = sum(weights)
                weighted_sum = sum(score * weight for score, weight in zip(scores, weights))
                return round(weighted_sum / total_weight, 1)
            
        except Exception as e:
            logging.error(f"Error calculating overall score: {e}")
        
        return 0.0
    
    def _generate_suggestions(self, analysis: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate actionable suggestions based on analysis results"""
        suggestions = []
        
        try:
            # Readability suggestions
            readability = analysis['readability']
            if readability['score'] < 60:
                suggestions.append({
                    'category': 'readability',
                    'priority': 'high',
                    'suggestion': 'Improve readability by using shorter sentences and simpler words',
                    'detail': f'Current Flesch Reading Ease score: {readability["score"]:.1f}. Aim for 60+ for better readability.'
                })
            
            if readability['average_sentence_length'] > 20:
                suggestions.append({
                    'category': 'readability',
                    'priority': 'medium',
                    'suggestion': 'Break up long sentences for better flow',
                    'detail': f'Average sentence length: {readability["average_sentence_length"]:.1f} words. Aim for 15-20 words per sentence.'
                })
            
            # Engagement suggestions
            engagement = analysis['engagement_potential']
            if engagement['score'] < 50:
                suggestions.append({
                    'category': 'engagement',
                    'priority': 'high',
                    'suggestion': 'Add more engaging elements to capture reader attention',
                    'detail': 'Consider adding questions, emotional words, or call-to-action phrases.'
                })
            
            if engagement['question_count'] == 0:
                suggestions.append({
                    'category': 'engagement',
                    'priority': 'medium',
                    'suggestion': 'Add questions to encourage reader interaction',
                    'detail': 'Questions help engage readers and encourage comments or responses.'
                })
            
            if engagement['call_to_action_count'] == 0:
                suggestions.append({
                    'category': 'engagement',
                    'priority': 'medium',
                    'suggestion': 'Include a clear call-to-action',
                    'detail': 'Tell readers what you want them to do next (subscribe, share, comment, etc.).'
                })
            
            # Structure suggestions
            structure = analysis['structure_analysis']
            if structure['paragraph_count'] <= 1:
                suggestions.append({
                    'category': 'structure',
                    'priority': 'high',
                    'suggestion': 'Break content into multiple paragraphs',
                    'detail': 'Multiple paragraphs improve readability and visual appeal.'
                })
            
            if not structure['has_headings'] and analysis['word_count'] > 200:
                suggestions.append({
                    'category': 'structure',
                    'priority': 'medium',
                    'suggestion': 'Add headings to organize longer content',
                    'detail': 'Headings help readers scan and navigate your content more easily.'
                })
            
            if not structure['has_lists'] and analysis['word_count'] > 150:
                suggestions.append({
                    'category': 'structure',
                    'priority': 'low',
                    'suggestion': 'Consider using bullet points or numbered lists',
                    'detail': 'Lists make information easier to digest and more visually appealing.'
                })
            
            # Keyword suggestions
            keyword_analysis = analysis['keyword_density']
            if keyword_analysis['lexical_diversity'] < 0.3:
                suggestions.append({
                    'category': 'vocabulary',
                    'priority': 'medium',
                    'suggestion': 'Use more varied vocabulary',
                    'detail': f'Lexical diversity: {keyword_analysis["lexical_diversity"]:.2f}. Try using synonyms and varied word choices.'
                })
            
            # Sentiment suggestions
            sentiment = analysis['sentiment']
            if abs(sentiment['polarity']) < 0.1:
                suggestions.append({
                    'category': 'tone',
                    'priority': 'low',
                    'suggestion': 'Consider adding more emotional tone',
                    'detail': 'Content with clear emotional tone tends to be more engaging.'
                })
            
            # Length suggestions based on content type
            word_count = analysis['word_count']
            content_type = analysis.get('content_type', 'general')
            
            if content_type == 'social' and word_count > 280:
                suggestions.append({
                    'category': 'length',
                    'priority': 'high',
                    'suggestion': 'Shorten content for social media',
                    'detail': f'Current length: {word_count} words. Social media posts work best under 280 characters.'
                })
            elif content_type == 'email' and word_count > 500:
                suggestions.append({
                    'category': 'length',
                    'priority': 'medium',
                    'suggestion': 'Consider shortening email content',
                    'detail': f'Current length: {word_count} words. Email content is most effective under 500 words.'
                })
            
        except Exception as e:
            logging.error(f"Error generating suggestions: {e}")
        
        return suggestions
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _get_content_type_bonus(self, content_type: str) -> float:
        """Get engagement bonus based on content type"""
        bonuses = {
            'social': 10,
            'email': 5,
            'blog': 0,
            'ad': 15,
            'general': 0
        }
        return bonuses.get(content_type, 0)
    
    def _empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis for invalid content"""
        return {
            'content_length': 0,
            'word_count': 0,
            'readability': {'score': 0, 'level': 'unknown'},
            'sentiment': {'polarity': 0, 'label': 'neutral'},
            'keyword_density': {'top_keywords': [], 'lexical_diversity': 0},
            'engagement_potential': {'score': 0, 'level': 'low'},
            'structure_analysis': {'formatting_score': 0, 'structure_quality': 'poor'},
            'linguistic_features': {},
            'overall_score': 0,
            'suggestions': [{'category': 'content', 'priority': 'high', 'suggestion': 'Add content to analyze', 'detail': 'No content provided for analysis'}],
            'content_type': 'unknown'
        }

# Global analyzer instance
quality_analyzer = ContentQualityAnalyzer()