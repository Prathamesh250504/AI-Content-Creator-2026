"""
Advanced Content Analyzer for A/B Test Winner Prediction
Uses multiple metrics to automatically determine the better content
"""

import re
import math
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass
from enum import Enum

class ContentMetric(Enum):
    """Content quality metrics"""
    READABILITY = "readability"
    ENGAGEMENT = "engagement"
    CLARITY = "clarity"
    STRUCTURE = "structure"
    KEYWORD_DENSITY = "keyword_density"
    SENTIMENT = "sentiment"
    LENGTH_OPTIMIZATION = "length_optimization"
    CALL_TO_ACTION = "call_to_action"

@dataclass
class ContentAnalysis:
    """Content analysis results"""
    content: str
    scores: Dict[str, float]
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    word_count: int
    sentence_count: int
    paragraph_count: int

class AdvancedContentAnalyzer:
    """Advanced content analyzer for A/B testing"""
    
    def __init__(self):
        self.weights = {
            ContentMetric.READABILITY.value: 0.20,
            ContentMetric.ENGAGEMENT.value: 0.25,
            ContentMetric.CLARITY.value: 0.15,
            ContentMetric.STRUCTURE.value: 0.15,
            ContentMetric.KEYWORD_DENSITY.value: 0.10,
            ContentMetric.SENTIMENT.value: 0.10,
            ContentMetric.LENGTH_OPTIMIZATION.value: 0.05
        }
    
    def analyze_content(self, content: str, target_keywords: List[str] = None, 
                       target_length: str = "medium") -> ContentAnalysis:
        """Comprehensive content analysis"""
        
        if not content or len(content.strip()) < 10:
            return ContentAnalysis(
                content=content,
                scores={metric.value: 0.0 for metric in ContentMetric},
                overall_score=0.0,
                strengths=[],
                weaknesses=["Content too short or empty"],
                word_count=0,
                sentence_count=0,
                paragraph_count=0
            )
        
        # Basic metrics
        word_count = len(content.split())
        sentences = [s.strip() for s in re.split(r'[.!?]+', content) if s.strip()]
        sentence_count = len(sentences)
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        paragraph_count = len(paragraphs)
        
        # Calculate individual scores
        scores = {}
        scores[ContentMetric.READABILITY.value] = self._calculate_readability_score(content, sentences)
        scores[ContentMetric.ENGAGEMENT.value] = self._calculate_engagement_score(content)
        scores[ContentMetric.CLARITY.value] = self._calculate_clarity_score(content, sentences)
        scores[ContentMetric.STRUCTURE.value] = self._calculate_structure_score(content, paragraphs)
        scores[ContentMetric.KEYWORD_DENSITY.value] = self._calculate_keyword_score(content, target_keywords or [])
        scores[ContentMetric.SENTIMENT.value] = self._calculate_sentiment_score(content)
        scores[ContentMetric.LENGTH_OPTIMIZATION.value] = self._calculate_length_score(word_count, target_length)
        
        # Calculate overall score
        overall_score = sum(scores[metric.value] * self.weights[metric.value] 
                          for metric in ContentMetric if metric.value in scores)
        
        # Identify strengths and weaknesses
        strengths, weaknesses = self._identify_strengths_weaknesses(scores, content)
        
        return ContentAnalysis(
            content=content,
            scores=scores,
            overall_score=overall_score,
            strengths=strengths,
            weaknesses=weaknesses,
            word_count=word_count,
            sentence_count=sentence_count,
            paragraph_count=paragraph_count
        )
    
    def _calculate_readability_score(self, content: str, sentences: List[str]) -> float:
        """Calculate readability score (simplified Flesch-Kincaid)"""
        if not sentences:
            return 0.0
        
        words = content.split()
        if not words:
            return 0.0
        
        # Average sentence length
        avg_sentence_length = len(words) / len(sentences)
        
        # Syllable estimation (simplified)
        syllable_count = sum(self._estimate_syllables(word) for word in words)
        avg_syllables_per_word = syllable_count / len(words)
        
        # Simplified Flesch Reading Ease
        flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
        
        # Convert to 0-100 scale
        normalized_score = max(0, min(100, flesch_score))
        
        return normalized_score
    
    def _estimate_syllables(self, word: str) -> int:
        """Estimate syllables in a word"""
        word = word.lower().strip('.,!?;:"')
        if len(word) <= 3:
            return 1
        
        vowels = 'aeiouy'
        syllable_count = 0
        prev_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                syllable_count += 1
            prev_was_vowel = is_vowel
        
        # Handle silent e
        if word.endswith('e'):
            syllable_count -= 1
        
        return max(1, syllable_count)
    
    def _calculate_engagement_score(self, content: str) -> float:
        """Calculate engagement potential score"""
        score = 50.0  # Base score
        
        # Positive indicators
        engagement_words = [
            'discover', 'learn', 'amazing', 'incredible', 'transform', 'boost',
            'improve', 'enhance', 'optimize', 'revolutionize', 'unlock', 'master',
            'achieve', 'succeed', 'grow', 'expand', 'innovative', 'cutting-edge',
            'breakthrough', 'game-changing', 'powerful', 'effective', 'proven'
        ]
        
        question_marks = content.count('?')
        exclamation_marks = content.count('!')
        engagement_word_count = sum(1 for word in engagement_words if word in content.lower())
        
        # Scoring
        score += min(question_marks * 5, 15)  # Questions engage readers
        score += min(exclamation_marks * 3, 12)  # Excitement (but not too much)
        score += min(engagement_word_count * 2, 20)  # Engaging vocabulary
        
        # Check for call-to-action phrases
        cta_phrases = [
            'learn more', 'get started', 'sign up', 'join us', 'contact us',
            'discover how', 'find out', 'explore', 'try now', 'start today'
        ]
        
        cta_count = sum(1 for phrase in cta_phrases if phrase in content.lower())
        score += min(cta_count * 8, 16)
        
        # Penalize excessive punctuation
        if exclamation_marks > 5:
            score -= (exclamation_marks - 5) * 2
        
        return max(0, min(100, score))
    
    def _calculate_clarity_score(self, content: str, sentences: List[str]) -> float:
        """Calculate clarity and coherence score"""
        if not sentences:
            return 0.0
        
        score = 70.0  # Base score
        
        # Sentence length analysis
        sentence_lengths = [len(sentence.split()) for sentence in sentences]
        avg_length = sum(sentence_lengths) / len(sentence_lengths)
        
        # Optimal sentence length is 15-20 words
        if 15 <= avg_length <= 20:
            score += 15
        elif 10 <= avg_length <= 25:
            score += 10
        elif avg_length < 8:
            score -= 10  # Too choppy
        elif avg_length > 30:
            score -= 15  # Too complex
        
        # Vocabulary complexity
        complex_words = [word for word in content.split() 
                        if len(word) > 12 and word.isalpha()]
        complexity_ratio = len(complex_words) / len(content.split())
        
        if complexity_ratio > 0.15:
            score -= 10  # Too many complex words
        elif complexity_ratio < 0.05:
            score += 5   # Good balance
        
        # Transition words (improve flow)
        transition_words = [
            'however', 'therefore', 'moreover', 'furthermore', 'additionally',
            'consequently', 'meanwhile', 'similarly', 'in contrast', 'for example'
        ]
        
        transition_count = sum(1 for word in transition_words if word in content.lower())
        score += min(transition_count * 3, 12)
        
        return max(0, min(100, score))
    
    def _calculate_structure_score(self, content: str, paragraphs: List[str]) -> float:
        """Calculate structural quality score"""
        score = 60.0  # Base score
        
        word_count = len(content.split())
        
        # Paragraph structure
        if len(paragraphs) == 1 and word_count > 150:
            score -= 20  # Wall of text
        elif len(paragraphs) > 1:
            score += 15  # Good paragraph breaks
        
        # Check for lists or bullet points
        if any(marker in content for marker in ['•', '-', '*', '1.', '2.', '3.']):
            score += 10
        
        # Check for headers or emphasis
        if any(marker in content for marker in ['**', '__', 'IMPORTANT', 'KEY']):
            score += 8
        
        # Paragraph length consistency
        if len(paragraphs) > 1:
            para_lengths = [len(para.split()) for para in paragraphs]
            avg_para_length = sum(para_lengths) / len(para_lengths)
            
            if 30 <= avg_para_length <= 80:
                score += 10  # Good paragraph length
            elif avg_para_length > 120:
                score -= 8   # Paragraphs too long
        
        return max(0, min(100, score))
    
    def _calculate_keyword_score(self, content: str, keywords: List[str]) -> float:
        """Calculate keyword optimization score"""
        if not keywords:
            return 75.0  # Neutral score when no keywords specified
        
        content_lower = content.lower()
        word_count = len(content.split())
        
        keyword_mentions = 0
        for keyword in keywords:
            keyword_lower = keyword.lower()
            mentions = content_lower.count(keyword_lower)
            keyword_mentions += mentions
        
        if word_count == 0:
            return 0.0
        
        # Calculate keyword density
        density = (keyword_mentions / word_count) * 100
        
        # Optimal density is 1-3%
        if 1.0 <= density <= 3.0:
            return 90.0
        elif 0.5 <= density <= 5.0:
            return 75.0
        elif density > 5.0:
            return 40.0  # Keyword stuffing
        else:
            return 50.0  # No keywords
    
    def _calculate_sentiment_score(self, content: str) -> float:
        """Calculate sentiment appropriateness score"""
        positive_words = [
            'excellent', 'amazing', 'great', 'fantastic', 'wonderful', 'outstanding',
            'impressive', 'remarkable', 'exceptional', 'brilliant', 'superb',
            'effective', 'successful', 'beneficial', 'valuable', 'useful'
        ]
        
        negative_words = [
            'terrible', 'awful', 'horrible', 'disappointing', 'frustrating',
            'difficult', 'challenging', 'problematic', 'concerning', 'worrying'
        ]
        
        content_lower = content.lower()
        
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(1 for word in negative_words if word in content_lower)
        
        # Calculate sentiment balance
        total_sentiment_words = positive_count + negative_count
        
        if total_sentiment_words == 0:
            return 70.0  # Neutral
        
        positive_ratio = positive_count / total_sentiment_words
        
        # Prefer slightly positive content
        if 0.6 <= positive_ratio <= 0.8:
            return 85.0
        elif 0.4 <= positive_ratio <= 0.9:
            return 75.0
        elif positive_ratio > 0.9:
            return 60.0  # Too positive might seem fake
        else:
            return 50.0  # Too negative
    
    def _calculate_length_score(self, word_count: int, target_length: str) -> float:
        """Calculate length optimization score"""
        target_ranges = {
            'short': (50, 150),
            'medium': (150, 400),
            'long': (400, 800)
        }
        
        target_range = target_ranges.get(target_length.lower(), (150, 400))
        min_words, max_words = target_range
        
        if min_words <= word_count <= max_words:
            return 100.0
        elif word_count < min_words:
            return max(0, (word_count / min_words) * 100)
        else:
            # Penalty for being too long
            excess = word_count - max_words
            penalty = min(excess / max_words * 50, 50)
            return max(0, 100 - penalty)
    
    def _identify_strengths_weaknesses(self, scores: Dict[str, float], content: str) -> Tuple[List[str], List[str]]:
        """Identify content strengths and weaknesses"""
        strengths = []
        weaknesses = []
        
        # Analyze scores
        for metric, score in scores.items():
            if score >= 80:
                strengths.append(f"Excellent {metric.replace('_', ' ')}")
            elif score <= 40:
                weaknesses.append(f"Poor {metric.replace('_', ' ')}")
        
        # Content-specific analysis
        word_count = len(content.split())
        
        if word_count > 500:
            strengths.append("Comprehensive content")
        elif word_count < 50:
            weaknesses.append("Content too brief")
        
        if '?' in content:
            strengths.append("Engages with questions")
        
        if any(cta in content.lower() for cta in ['learn more', 'get started', 'contact']):
            strengths.append("Clear call-to-action")
        
        return strengths, weaknesses
    
    def compare_contents(self, content_a: str, content_b: str, 
                        target_keywords: List[str] = None, 
                        target_length: str = "medium") -> Dict[str, Any]:
        """Compare two contents and determine winner"""
        
        analysis_a = self.analyze_content(content_a, target_keywords, target_length)
        analysis_b = self.analyze_content(content_b, target_keywords, target_length)
        
        # Determine winner
        score_diff = analysis_a.overall_score - analysis_b.overall_score
        
        if abs(score_diff) < 5:  # Very close scores
            winner = "tie"
            confidence = "low"
        elif abs(score_diff) < 15:
            winner = "a" if score_diff > 0 else "b"
            confidence = "medium"
        else:
            winner = "a" if score_diff > 0 else "b"
            confidence = "high"
        
        return {
            "winner": winner,
            "confidence": confidence,
            "score_difference": abs(score_diff),
            "analysis_a": analysis_a,
            "analysis_b": analysis_b,
            "detailed_comparison": self._create_detailed_comparison(analysis_a, analysis_b)
        }
    
    def _create_detailed_comparison(self, analysis_a: ContentAnalysis, 
                                  analysis_b: ContentAnalysis) -> Dict[str, Any]:
        """Create detailed comparison between two analyses"""
        
        comparison = {
            "metric_comparison": {},
            "winner_by_metric": {},
            "summary": []
        }
        
        for metric in ContentMetric:
            metric_name = metric.value
            score_a = analysis_a.scores.get(metric_name, 0)
            score_b = analysis_b.scores.get(metric_name, 0)
            
            comparison["metric_comparison"][metric_name] = {
                "template_a": score_a,
                "template_b": score_b,
                "difference": score_a - score_b
            }
            
            if abs(score_a - score_b) > 5:
                winner = "a" if score_a > score_b else "b"
                comparison["winner_by_metric"][metric_name] = winner
        
        # Create summary
        if analysis_a.overall_score > analysis_b.overall_score:
            comparison["summary"].append("Template A has higher overall quality")
        elif analysis_b.overall_score > analysis_a.overall_score:
            comparison["summary"].append("Template B has higher overall quality")
        else:
            comparison["summary"].append("Both templates have similar quality")
        
        return comparison

# Global instance
advanced_analyzer = AdvancedContentAnalyzer()