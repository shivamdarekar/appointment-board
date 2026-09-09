from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # silently ignore unrecognised env vars (e.g. APP_ENV)
    )


# Single application-wide settings instance.
# Import this wherever configuration is needed.
settings = Settings()
