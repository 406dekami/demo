# app/models/model_schema.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class LLMFactoryResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    created_at: datetime