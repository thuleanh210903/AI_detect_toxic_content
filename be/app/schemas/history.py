from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class HistoryBase(BaseModel):
    input_type: str
    input_value: str
    result: str
    created_at: Optional[datetime] = None

class HistoryCreate(HistoryBase):
    input_type: str
    input_value: str
    result: str | None = None

class HistoryResponse(HistoryBase):
    id: int
