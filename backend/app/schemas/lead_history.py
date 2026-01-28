from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LeadHistoryResponse(BaseModel):
    id: int
    timestamp: datetime
    user_name: str
    user_role: str
    change_type: str
    field_changed: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None

    class Config:
        from_attributes = True
