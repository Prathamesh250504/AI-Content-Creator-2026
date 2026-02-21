from llm_client import OpenRouterClient
import re
import json
from datetime import datetime

class ContentEnhancementEngine:
    def __init__(self):
        self.llm_client = OpenRouterClient()
        self.enhancement_history = {}
    
    def adjust_tone(self, content, target_tone, content_type="general"):
        try:
            tone_prompts = {
                "professional": "Make this content more professional and business-appropriate",
                "casual": "Make this content more casual and conversational",
                "friendly": "Make this content warmer and more approachable",
                "authoritative": "Make this content more authoritative and confident",
                "enthusiastic": "Make this content more energetic and exciting",
                "empathetic": "Make this content more understanding and compassionate"
            }
            
            if target_tone.lower() not in tone_prompts:
                return {"success": False, "error": f"Unsupported tone: {target_tone}"}
            
            prompt = f"{tone_prompts[target_tone.lower()]}: {content}"
            
            enhanced_content = self.llm_client.generate_content(
                prompt=prompt,
                content_type="enhancement",
                tone=target_tone
            )
            
            if enhanced_content and not enhanced_content.startswith("Error"):
                return {
                    "success": True,
                    "enhanced_content": enhanced_content.strip(),
                    "original_content": content,
                    "enhancement_type": "tone_adjustment",
                    "target_tone": target_tone,
                    "metrics": self._calculate_enhancement_metrics(content, enhanced_content, "tone_adjustment"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {"success": False, "error": "Failed to enhance content tone"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def modify_length(self, content, target_length, content_type="general"):
        try:
            length_prompts = {
                "shorter": "Make this content significantly shorter while keeping essential information",
                "longer": "Expand this content with more details and examples",
                "concise": "Make this content very concise and to-the-point",
                "detailed": "Make this content more detailed and comprehensive"
            }
            
            if target_length.lower() not in length_prompts:
                return {"success": False, "error": f"Unsupported length: {target_length}"}
            
            prompt = f"{length_prompts[target_length.lower()]}: {content}"
            
            enhanced_content = self.llm_client.generate_content(
                prompt=prompt,
                content_type="enhancement",
                tone="maintain_original"
            )
            
            if enhanced_content and not enhanced_content.startswith("Error"):
                return {
                    "success": True,
                    "enhanced_content": enhanced_content.strip(),
                    "original_content": content,
                    "enhancement_type": "length_modification",
                    "target_length": target_length,
                    "metrics": self._calculate_enhancement_metrics(content, enhanced_content, "length_modification"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {"success": False, "error": "Failed to modify content length"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def refine_style(self, content, style_preferences):
        try:
            style_instructions = []
            
            if style_preferences.get("sentence_structure") == "short":
                style_instructions.append("Use shorter, punchier sentences")
            elif style_preferences.get("sentence_structure") == "varied":
                style_instructions.append("Use varied sentence lengths for better flow")
            
            if style_preferences.get("vocabulary") == "simple":
                style_instructions.append("Use simpler, more accessible vocabulary")
            elif style_preferences.get("vocabulary") == "advanced":
                style_instructions.append("Use more sophisticated vocabulary")
            
            if style_preferences.get("active_voice", True):
                style_instructions.append("Use active voice wherever possible")
            
            if style_preferences.get("remove_jargon", False):
                style_instructions.append("Remove or explain technical jargon")
            
            if style_preferences.get("add_transitions", True):
                style_instructions.append("Improve transitions between ideas")
            
            if not style_instructions:
                style_instructions.append("Improve overall writing style and flow")
            
            instructions_text = "; ".join(style_instructions)
            prompt = f"Refine the style of this content with these improvements: {instructions_text}. Content: {content}"
            
            enhanced_content = self.llm_client.generate_content(
                prompt=prompt,
                content_type="enhancement",
                tone="maintain_original"
            )
            
            if enhanced_content and not enhanced_content.startswith("Error"):
                return {
                    "success": True,
                    "enhanced_content": enhanced_content.strip(),
                    "original_content": content,
                    "enhancement_type": "style_refinement",
                    "style_preferences": style_preferences,
                    "metrics": self._calculate_enhancement_metrics(content, enhanced_content, "style_refinement"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {"success": False, "error": "Failed to refine content style"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_enhancement_suggestions(self, content, content_type="general"):
        try:
            prompt = f"Analyze this content and provide enhancement suggestions: {content}"
            
            suggestions_text = self.llm_client.generate_content(
                prompt=prompt,
                content_type="analysis",
                tone="analytical"
            )
            
            if suggestions_text and not suggestions_text.startswith("Error"):
                # Simple fallback suggestions
                suggestions = {
                    "engagement": ["Make content more engaging and interactive"],
                    "cta": ["Add clear call-to-action"],
                    "emojis": [{"position": "end", "emoji": "✨", "reason": "adds visual appeal"}],
                    "readability": ["Improve sentence structure and flow"],
                    "structure": ["Organize content with better headings"]
                }
                
                return {
                    "success": True,
                    "suggestions": suggestions,
                    "content_analysis": self._analyze_content_metrics(content),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {"success": False, "error": "Failed to generate suggestions"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def apply_enhancement_suggestion(self, content, suggestion):
        try:
            suggestion_type = suggestion.get("type", "general")
            suggestion_text = suggestion.get("text", "")
            
            if suggestion_type == "emoji":
                emoji = suggestion.get("emoji", "")
                position = suggestion.get("position", "end")
                
                if position == "beginning":
                    enhanced_content = f"{emoji} {content}"
                else:
                    enhanced_content = f"{content} {emoji}"
                
                return {
                    "success": True,
                    "enhanced_content": enhanced_content,
                    "original_content": content,
                    "applied_suggestion": suggestion
                }
            else:
                prompt = f"Apply this suggestion to the content: {suggestion_text}. Content: {content}"
                
                enhanced_content = self.llm_client.generate_content(
                    prompt=prompt,
                    content_type="enhancement",
                    tone="maintain_original"
                )
                
                if enhanced_content and not enhanced_content.startswith("Error"):
                    return {
                        "success": True,
                        "enhanced_content": enhanced_content.strip(),
                        "original_content": content,
                        "applied_suggestion": suggestion
                    }
                else:
                    return {"success": False, "error": "Failed to apply suggestion"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def merge_content_pieces(self, content_pieces, merge_style="cohesive"):
        try:
            if len(content_pieces) < 2:
                return {"success": False, "error": "At least 2 content pieces required"}
            
            content_texts = []
            for i, piece in enumerate(content_pieces):
                content_text = piece.get("content", "")
                content_texts.append(f"Content {i+1}: {content_text}")
            
            merge_prompts = {
                "cohesive": "Merge these content pieces into one cohesive piece",
                "sequential": "Combine these content pieces in logical sequence",
                "integrated": "Integrate key points from all pieces",
                "summary": "Create a unified summary from all pieces"
            }
            
            prompt = f"{merge_prompts.get(merge_style, merge_prompts['cohesive'])}:\n\n{chr(10).join(content_texts)}"
            
            merged_content = self.llm_client.generate_content(
                prompt=prompt,
                content_type="merged_content",
                tone="professional"
            )
            
            if merged_content and not merged_content.startswith("Error"):
                original_total_words = sum(len(piece.get("content", "").split()) for piece in content_pieces)
                merged_words = len(merged_content.split())
                
                return {
                    "success": True,
                    "merged_content": merged_content.strip(),
                    "original_pieces": content_pieces,
                    "merge_style": merge_style,
                    "metrics": {
                        "original_pieces": len(content_pieces),
                        "original_total_words": original_total_words,
                        "merged_words": merged_words,
                        "compression_ratio": round(merged_words / original_total_words, 2) if original_total_words > 0 else 0
                    },
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {"success": False, "error": "Failed to merge content"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _calculate_enhancement_metrics(self, original, enhanced, enhancement_type):
        original_words = len(original.split())
        enhanced_words = len(enhanced.split())
        
        return {
            "original_word_count": original_words,
            "enhanced_word_count": enhanced_words,
            "word_count_change": enhanced_words - original_words,
            "word_count_change_percent": round(((enhanced_words - original_words) / original_words * 100), 1) if original_words > 0 else 0,
            "enhancement_type": enhancement_type,
            "readability_score": self._calculate_readability_score(enhanced)
        }
    
    def _analyze_content_metrics(self, content):
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        return {
            "word_count": len(words),
            "sentence_count": len(sentences),
            "avg_sentence_length": round(len(words) / len(sentences), 1) if sentences else 0,
            "readability_score": self._calculate_readability_score(content)
        }
    
    def _calculate_readability_score(self, content):
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences or not words:
            return 0.0
        
        avg_sentence_length = len(words) / len(sentences)
        complex_words = sum(1 for word in words if len(word) > 6)
        complexity_ratio = complex_words / len(words) if words else 0
        
        readability = max(0, 100 - (avg_sentence_length * 2) - (complexity_ratio * 50))
        return round(readability, 1)

# Global instance
content_enhancement_engine = ContentEnhancementEngine()