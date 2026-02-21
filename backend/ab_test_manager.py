"""
A/B Test Manager for Prompt Template Testing
Handles creation, management, and analysis of A/B tests
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import statistics
from database import db_manager

class ABTestStatus(Enum):
    """A/B Test status enumeration"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class ABTestManager:
    """Manager for A/B testing functionality"""
    
    def __init__(self):
        self.db = db_manager
    
    def create_ab_test(self, user_id: str, name: str, description: str, 
                      template_a_id: str, template_b_id: str, 
                      test_parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a new A/B test"""
        
        try:
            # Validate that both templates exist and user has access
            template_a = self.db.prompt_templates_collection.find_one({
                "id": template_a_id,
                "$or": [{"user_id": user_id}, {"is_public": True}]
            })
            
            template_b = self.db.prompt_templates_collection.find_one({
                "id": template_b_id,
                "$or": [{"user_id": user_id}, {"is_public": True}]
            })
            
            if not template_a:
                return {"success": False, "error": f"Template A not found: {template_a_id}"}
            
            if not template_b:
                return {"success": False, "error": f"Template B not found: {template_b_id}"}
            
            # Create A/B test document
            ab_test_id = str(uuid.uuid4())
            ab_test = {
                "id": ab_test_id,
                "user_id": user_id,
                "name": name,
                "description": description,
                "template_a_id": template_a_id,
                "template_b_id": template_b_id,
                "template_a_name": template_a.get("name", "Template A"),
                "template_b_name": template_b.get("name", "Template B"),
                "status": ABTestStatus.DRAFT.value,
                "test_parameters": test_parameters or {},
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "started_at": None,
                "completed_at": None,
                "results": {
                    "total_tests": 0,
                    "template_a_wins": 0,
                    "template_b_wins": 0,
                    "ties": 0,
                    "template_a_avg_score": 0.0,
                    "template_b_avg_score": 0.0,
                    "confidence_level": 0.0,
                    "statistical_significance": False
                }
            }
            
            # Insert into database
            result = self.db.ab_tests_collection.insert_one(ab_test)
            
            if result.inserted_id:
                # Remove the MongoDB ObjectId from the response
                ab_test.pop('_id', None)
                return {
                    "success": True,
                    "ab_test_id": ab_test_id,
                    "ab_test": ab_test
                }
            else:
                return {"success": False, "error": "Failed to create A/B test"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_ab_test(self, ab_test_id: str, user_id: str = None) -> Optional[Dict[str, Any]]:
        """Get A/B test by ID"""
        
        query = {"id": ab_test_id}
        if user_id:
            query["user_id"] = user_id
        
        return self.db.ab_tests_collection.find_one(query, {"_id": 0})
    
    def get_user_ab_tests(self, user_id: str, status: str = None) -> List[Dict[str, Any]]:
        """Get all A/B tests for a user"""
        
        query = {"user_id": user_id}
        if status:
            query["status"] = status
        
        tests = list(self.db.ab_tests_collection.find(query, {"_id": 0}))
        return sorted(tests, key=lambda x: x.get("created_at", ""), reverse=True)
    
    def start_ab_test(self, ab_test_id: str, user_id: str) -> Dict[str, Any]:
        """Start an A/B test"""
        
        try:
            # Update status to active
            result = self.db.ab_tests_collection.update_one(
                {"id": ab_test_id, "user_id": user_id},
                {
                    "$set": {
                        "status": ABTestStatus.ACTIVE.value,
                        "started_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "A/B test started successfully"}
            else:
                return {"success": False, "error": "A/B test not found or already started"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def pause_ab_test(self, ab_test_id: str, user_id: str) -> Dict[str, Any]:
        """Pause an A/B test"""
        
        try:
            result = self.db.ab_tests_collection.update_one(
                {"id": ab_test_id, "user_id": user_id},
                {
                    "$set": {
                        "status": ABTestStatus.PAUSED.value,
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "A/B test paused successfully"}
            else:
                return {"success": False, "error": "A/B test not found"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def run_ab_test(self, ab_test_id: str, user_prompt: str, variables: Dict[str, Any], 
                   parameters: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Run an A/B test and generate content with both templates"""
        
        try:
            # Get the A/B test
            ab_test = self.get_ab_test(ab_test_id, user_id)
            if not ab_test:
                return {"success": False, "error": "A/B test not found"}
            
            if ab_test["status"] != ABTestStatus.ACTIVE.value:
                return {"success": False, "error": "A/B test is not active"}
            
            # Import here to avoid circular imports
            from llm_client import OpenRouterClient
            from parameter_engine import parameter_engine
            from advanced_content_analyzer import advanced_analyzer
            
            client = OpenRouterClient()
            
            # Get both templates
            template_a = self.db.prompt_templates_collection.find_one({
                "id": ab_test["template_a_id"]
            })
            template_b = self.db.prompt_templates_collection.find_one({
                "id": ab_test["template_b_id"]
            })
            
            if not template_a or not template_b:
                return {"success": False, "error": "One or both templates not found"}
            
            # Generate content with both templates
            results = {}
            
            for template_key, template in [("a", template_a), ("b", template_b)]:
                # Process template content
                template_content = template.get("template_content", "")
                
                # Replace variables
                for var_name, var_value in variables.items():
                    placeholder = f"{{{{{var_name}}}}}"
                    template_content = template_content.replace(placeholder, str(var_value))
                
                # Add user prompt
                if user_prompt:
                    if '{{user_prompt}}' in template_content:
                        template_content = template_content.replace('{{user_prompt}}', user_prompt)
                    else:
                        template_content = f"{template_content}\n\nUser Request: {user_prompt}"
                
                # Process parameters
                processed_params = parameter_engine.process_parameters('custom_template', parameters)
                
                # Generate content
                content = client.generate_content(
                    template_content,
                    content_type="ab_test",
                    tone=processed_params.get('tone', 'professional')
                )
                
                if content and not content.startswith("Error"):
                    results[template_key] = {
                        "template_id": template["id"],
                        "template_name": template.get("name", f"Template {template_key.upper()}"),
                        "content": content,
                        "word_count": len(content.split()),
                        "char_count": len(content),
                        "template_content_used": template_content
                    }
                else:
                    results[template_key] = {
                        "template_id": template["id"],
                        "template_name": template.get("name", f"Template {template_key.upper()}"),
                        "error": content or "Failed to generate content",
                        "content": "",
                        "word_count": 0,
                        "char_count": 0
                    }
            
            # Perform automatic content analysis and winner prediction
            if results["a"].get("content") and results["b"].get("content"):
                # Extract keywords from variables for analysis
                target_keywords = []
                if variables.get("topic"):
                    target_keywords.append(variables["topic"])
                if variables.get("keywords"):
                    target_keywords.extend([k.strip() for k in variables["keywords"].split(",") if k.strip()])
                
                # Get target length from parameters
                target_length = parameters.get("length", "medium")
                
                # Perform automatic analysis
                comparison_result = advanced_analyzer.compare_contents(
                    content_a=results["a"]["content"],
                    content_b=results["b"]["content"],
                    target_keywords=target_keywords,
                    target_length=target_length
                )
                
                # Add analysis results to the response
                results["a"]["analysis"] = {
                    "overall_score": comparison_result["analysis_a"].overall_score,
                    "scores": comparison_result["analysis_a"].scores,
                    "strengths": comparison_result["analysis_a"].strengths,
                    "weaknesses": comparison_result["analysis_a"].weaknesses
                }
                
                results["b"]["analysis"] = {
                    "overall_score": comparison_result["analysis_b"].overall_score,
                    "scores": comparison_result["analysis_b"].scores,
                    "strengths": comparison_result["analysis_b"].strengths,
                    "weaknesses": comparison_result["analysis_b"].weaknesses
                }
                
                # Add automatic winner prediction
                automatic_winner = {
                    "predicted_winner": comparison_result["winner"],
                    "confidence": comparison_result["confidence"],
                    "score_difference": comparison_result["score_difference"],
                    "reasoning": self._generate_winner_reasoning(comparison_result),
                    "detailed_comparison": comparison_result["detailed_comparison"]
                }
            else:
                automatic_winner = {
                    "predicted_winner": "error",
                    "confidence": "none",
                    "score_difference": 0,
                    "reasoning": "Could not analyze content due to generation errors",
                    "detailed_comparison": {}
                }
            
            # Return both results for comparison with automatic analysis
            return {
                "success": True,
                "ab_test_id": ab_test_id,
                "ab_test_name": ab_test["name"],
                "template_a": results["a"],
                "template_b": results["b"],
                "variables_used": variables,
                "parameters_used": parameters,
                "user_prompt": user_prompt,
                "generation_mode": "ab_test",
                "automatic_winner": automatic_winner
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _generate_winner_reasoning(self, comparison_result: Dict[str, Any]) -> str:
        """Generate human-readable reasoning for winner selection"""
        
        winner = comparison_result["winner"]
        confidence = comparison_result["confidence"]
        analysis_a = comparison_result["analysis_a"]
        analysis_b = comparison_result["analysis_b"]
        
        if winner == "tie":
            return f"Both templates performed similarly with scores of {analysis_a.overall_score:.1f} and {analysis_b.overall_score:.1f}. The difference is minimal."
        
        winner_analysis = analysis_a if winner == "a" else analysis_b
        loser_analysis = analysis_b if winner == "a" else analysis_a
        winner_name = "Template A" if winner == "a" else "Template B"
        
        reasoning_parts = [
            f"{winner_name} wins with a score of {winner_analysis.overall_score:.1f} vs {loser_analysis.overall_score:.1f} ({confidence} confidence)."
        ]
        
        # Add specific strengths
        if winner_analysis.strengths:
            top_strengths = winner_analysis.strengths[:2]
            reasoning_parts.append(f"Key strengths: {', '.join(top_strengths).lower()}.")
        
        # Add metric-based reasoning
        metric_winners = comparison_result["detailed_comparison"]["winner_by_metric"]
        if metric_winners:
            strong_metrics = [metric.replace('_', ' ') for metric in metric_winners.keys()][:3]
            if strong_metrics:
                reasoning_parts.append(f"Superior in: {', '.join(strong_metrics)}.")
        
        return " ".join(reasoning_parts)
    
    def submit_ab_test_result(self, ab_test_id: str, winner: str, user_feedback: str,
                             template_a_score: float, template_b_score: float,
                             user_id: str) -> Dict[str, Any]:
        """Submit A/B test result"""
        
        try:
            # Validate winner
            if winner not in ["a", "b", "tie"]:
                return {"success": False, "error": "Winner must be 'a', 'b', or 'tie'"}
            
            # Create result record
            result_id = str(uuid.uuid4())
            result_record = {
                "id": result_id,
                "ab_test_id": ab_test_id,
                "user_id": user_id,
                "winner": winner,
                "template_a_score": template_a_score,
                "template_b_score": template_b_score,
                "user_feedback": user_feedback,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Insert result
            self.db.ab_test_results_collection.insert_one(result_record)
            
            # Update A/B test statistics
            self._update_ab_test_stats(ab_test_id, winner, template_a_score, template_b_score)
            
            return {"success": True, "result_id": result_id}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _update_ab_test_stats(self, ab_test_id: str, winner: str, 
                             template_a_score: float, template_b_score: float):
        """Update A/B test statistics"""
        
        try:
            # Get current stats
            ab_test = self.db.ab_tests_collection.find_one({"id": ab_test_id})
            if not ab_test:
                return
            
            results = ab_test.get("results", {})
            total_tests = results.get("total_tests", 0)
            
            # Update counters
            new_total = total_tests + 1
            template_a_wins = results.get("template_a_wins", 0)
            template_b_wins = results.get("template_b_wins", 0)
            ties = results.get("ties", 0)
            
            if winner == "a":
                template_a_wins += 1
            elif winner == "b":
                template_b_wins += 1
            else:
                ties += 1
            
            # Calculate running averages
            current_a_avg = results.get("template_a_avg_score", 0.0)
            current_b_avg = results.get("template_b_avg_score", 0.0)
            
            new_a_avg = ((current_a_avg * total_tests) + template_a_score) / new_total
            new_b_avg = ((current_b_avg * total_tests) + template_b_score) / new_total
            
            # Calculate confidence (simplified)
            if new_total >= 10:  # Minimum sample size
                win_rate_a = template_a_wins / new_total
                win_rate_b = template_b_wins / new_total
                confidence = abs(win_rate_a - win_rate_b) * 100
                statistical_significance = confidence > 10 and new_total >= 20
            else:
                confidence = 0.0
                statistical_significance = False
            
            # Update database
            self.db.ab_tests_collection.update_one(
                {"id": ab_test_id},
                {
                    "$set": {
                        "results": {
                            "total_tests": new_total,
                            "template_a_wins": template_a_wins,
                            "template_b_wins": template_b_wins,
                            "ties": ties,
                            "template_a_avg_score": round(new_a_avg, 2),
                            "template_b_avg_score": round(new_b_avg, 2),
                            "confidence_level": round(confidence, 2),
                            "statistical_significance": statistical_significance
                        },
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
            
        except Exception as e:
            print(f"Error updating A/B test stats: {e}")
    
    def get_ab_test_results(self, ab_test_id: str, user_id: str = None) -> List[Dict[str, Any]]:
        """Get all results for an A/B test"""
        
        query = {"ab_test_id": ab_test_id}
        if user_id:
            query["user_id"] = user_id
        
        results = list(self.db.ab_test_results_collection.find(query, {"_id": 0}))
        return sorted(results, key=lambda x: x.get("created_at", ""), reverse=True)
    
    def get_all_user_ab_test_results(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all A/B test results for a user across all tests"""
        
        try:
            # Get all results for the user
            results = list(self.db.ab_test_results_collection.find(
                {"user_id": user_id}, 
                {"_id": 0}
            ))
            
            # Enrich results with test information
            enriched_results = []
            for result in results:
                # Get the corresponding A/B test info
                ab_test = self.db.ab_tests_collection.find_one(
                    {"id": result["ab_test_id"]},
                    {"_id": 0}
                )
                
                if ab_test:
                    # Add test information to the result
                    enriched_result = {
                        **result,
                        "test_name": ab_test.get("name", "Unknown Test"),
                        "test_description": ab_test.get("description", ""),
                        "template_a_name": ab_test.get("template_a_name", "Template A"),
                        "template_b_name": ab_test.get("template_b_name", "Template B"),
                        "test_status": ab_test.get("status", "unknown"),
                        "test_created_at": ab_test.get("created_at", "")
                    }
                    enriched_results.append(enriched_result)
            
            # Sort by creation date (newest first)
            return sorted(enriched_results, key=lambda x: x.get("created_at", ""), reverse=True)
            
        except Exception as e:
            print(f"Error getting user A/B test results: {e}")
            return []
    
    def delete_ab_test(self, ab_test_id: str, user_id: str) -> Dict[str, Any]:
        """Delete an A/B test and all its results"""
        
        try:
            # Delete A/B test
            ab_result = self.db.ab_tests_collection.delete_one({
                "id": ab_test_id,
                "user_id": user_id
            })
            
            # Delete all results
            results_deleted = self.db.ab_test_results_collection.delete_many({
                "ab_test_id": ab_test_id
            })
            
            if ab_result.deleted_count > 0:
                return {
                    "success": True,
                    "message": f"A/B test deleted along with {results_deleted.deleted_count} results"
                }
            else:
                return {"success": False, "error": "A/B test not found"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global instance
ab_test_manager = ABTestManager()