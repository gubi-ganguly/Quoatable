import json
import logging
from typing import Dict, List, Optional, Any

from src.services.llm.clients.openai_client import openai_client
from src.services.llm import prompts

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.client = openai_client

    async def analyze_email_intent(self, subject: str, body: str) -> Dict[str, Any]:
        """
        Analyzes an email to determine if it is a customer request.
        
        Args:
            subject: The subject of the email
            body: The text body of the email
            
        Returns: 
            Dict containing 'is_customer_request', 'confidence', and 'reasoning'
        """
        messages = [
            {"role": "system", "content": prompts.CUSTOMER_REQUEST_SYSTEM_PROMPT},
            {"role": "user", "content": prompts.CUSTOMER_REQUEST_USER_PROMPT.format(subject=subject, body=body)}
        ]
        
        try:
            # We enforce JSON response format for structured output
            response_content = self.client.get_completion(
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.1 # Low temperature for consistent classification
            )
            return json.loads(response_content)
        except Exception as e:
            logger.error(f"Error analyzing email intent: {e}")
            # Fail safe response
            return {
                "is_customer_request": False, 
                "confidence": 0.0, 
                "reasoning": f"Error during analysis: {str(e)}"
            }

    async def extract_product_data(self, subject: str, body: str, attachments: List[str] = []) -> Dict[str, Any]:
        """
        Extracts product information from an email.
        
        Args:
            subject: The subject of the email
            body: The text body of the email
            attachments: List of attachment contents (text) - Placeholder for now
            
        Returns:
            Dict containing a list of 'products'
        """
        # Note: Logic to handle attachments would go here. 
        # For now, we are focusing on extracting from the body as per instructions.
        
        messages = [
            {"role": "system", "content": prompts.PRODUCT_EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": prompts.PRODUCT_EXTRACTION_USER_PROMPT.format(subject=subject, body=body)}
        ]

        try:
            response_content = self.client.get_completion(
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.1 
            )
            return json.loads(response_content)
        except Exception as e:
            logger.error(f"Error extracting product data: {e}")
            return {"products": [], "error": str(e)}

llm_service = LLMService()
