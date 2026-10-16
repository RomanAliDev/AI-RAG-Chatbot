from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name:str = "AI RAG Chatbot"
    database_url: str
    gemini_api_key: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120

    model_config=SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()