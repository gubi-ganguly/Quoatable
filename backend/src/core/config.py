from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MS_CLIENT_ID: str
    MS_TENANT_ID: str
    MS_CLIENT_SECRET: str
    MS_REDIRECT_URI: str
    SCOPES: List[str] = ["Mail.Read", "Mail.ReadWrite", "Mail.Send"]
    
    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"
    
    # Optional: Graph API Base URL if we want to config it
    GRAPH_API_BASE_URL: str = "https://graph.microsoft.com/v1.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def authority(self) -> str:
        return f"https://login.microsoftonline.com/{self.MS_TENANT_ID}"

settings = Settings()

