from openai import OpenAI
from src.core.config import settings

class OpenAIClient:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    def get_completion(self, messages: list, model: str = None, temperature: float = 0.0, response_format=None) -> str:
        """
        Get completion from OpenAI API.
        
        Args:
            messages: List of message objects
            model: Optional model override
            temperature: Sampling temperature
            response_format: Optional response format (e.g. {"type": "json_object"})
            
        Returns:
            The content of the response message
        """
        if model is None:
            model = self.model
            
        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        if response_format:
            kwargs["response_format"] = response_format

        response = self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content

openai_client = OpenAIClient()
