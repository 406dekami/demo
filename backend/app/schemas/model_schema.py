# app/models/model_schema.py
from datetime import datetime

from pydantic import BaseModel


class LLMFactoryResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    created_at: datetime