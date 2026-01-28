from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class Token(BaseModel):
    token: str
    user: "UserResponse"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8)
    name: str = Field(min_length=2, max_length=100)
    role: str = Field(pattern="^(user|bidder)$")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if not re.match(r'^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$', v):
            raise ValueError("Imię może zawierać tylko litery, spacje i myślniki")
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(default=None, max_length=255)
    password: Optional[str] = Field(default=None, min_length=8)
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    role: Optional[str] = Field(default=None, pattern="^(user|bidder|manager)$")
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if v is not None and not re.match(r'^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$', v):
            raise ValueError("Imię może zawierać tylko litery, spacje i myślniki")
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(UserResponse):
    leads_count: int = 0


# Resolve forward references
Token.model_rebuild()
