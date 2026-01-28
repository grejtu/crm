from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum
import re


class LeadStatusEnum(str, Enum):
    WANTS_CAR = "wants_car"
    SEARCHING_NO_CONTRACT = "searching_no_contract"
    CONTRACT_SENT = "contract_sent"
    CONTRACT_SIGNED = "contract_signed"
    DEPOSIT = "deposit"
    BIDDING_ORDER = "bidding_order"
    WON = "won"


class ResignationStatusEnum(str, Enum):
    BOUGHT_IN_POLAND = "bought_in_poland"
    NO_IMPORT = "no_import"
    RESIGNS_COMPLETELY = "resigns_completely"
    WANTS_NEW_CAR = "wants_new_car"
    WANTS_LEASING = "wants_leasing"


class LeadsByDateFilter(str, Enum):
    TODAY = "today"
    OVERDUE = "overdue"
    UPCOMING = "upcoming"


class LeadCreate(BaseModel):
    first_name: str = Field(min_length=2, max_length=50)
    last_name: str = Field(min_length=2, max_length=50)
    phone: str = Field(pattern=r'^\+?[0-9]{9,15}$')
    email: Optional[str] = Field(default=None, max_length=255)
    vehicle: str = Field(min_length=2, max_length=100)
    budget: Optional[int] = Field(default=None, ge=0, le=10000000)
    year_model: Optional[int] = Field(default=None, ge=1900, le=2027)
    mileage: Optional[int] = Field(default=None, ge=0, le=1000000)
    equipment: Optional[str] = Field(default=None, max_length=1000)
    client_trigger: Optional[str] = Field(default=None, max_length=500)
    next_contact_date: Optional[datetime] = None
    comment: Optional[str] = Field(default=None, max_length=1000)
    assigned_user_id: Optional[int] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, v):
        if not re.match(r'^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$', v):
            raise ValueError("Może zawierać tylko litery, spacje i myślniki")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if v is not None and v != "":
            if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', v):
                raise ValueError("Nieprawidłowy format email")
        return v if v != "" else None


class LeadUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(default=None, min_length=2, max_length=50)
    phone: Optional[str] = Field(default=None, pattern=r'^\+?[0-9]{9,15}$')
    email: Optional[str] = Field(default=None, max_length=255)
    vehicle: Optional[str] = Field(default=None, min_length=2, max_length=100)
    budget: Optional[int] = Field(default=None, ge=0, le=10000000)
    final_budget: Optional[int] = Field(default=None, ge=0, le=10000000)
    year_model: Optional[int] = Field(default=None, ge=1900, le=2027)
    mileage: Optional[int] = Field(default=None, ge=0, le=1000000)
    equipment: Optional[str] = Field(default=None, max_length=1000)
    client_trigger: Optional[str] = Field(default=None, max_length=500)
    next_contact_date: Optional[datetime] = None
    comment: Optional[str] = Field(default=None, max_length=1000)
    assigned_user_id: Optional[int] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, v):
        if v is not None and not re.match(r'^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$', v):
            raise ValueError("Może zawierać tylko litery, spacje i myślniki")
        return v


class LeadPermissions(BaseModel):
    can_edit: bool
    can_edit_final_budget: bool
    can_change_status: bool
    can_delete: bool


class LeadResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    vehicle: str
    budget: Optional[int] = None
    final_budget: Optional[int] = None
    year_model: Optional[int] = None
    mileage: Optional[int] = None
    equipment: Optional[str] = None
    client_trigger: Optional[str] = None
    status: str
    resignation_status: Optional[str] = None
    is_resigned: bool
    first_contact_date: datetime
    next_contact_date: Optional[datetime] = None
    comment: Optional[str] = None
    assigned_user_id: Optional[int] = None
    assigned_user_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    permissions: Optional[LeadPermissions] = None
    can_edit: Optional[bool] = None
    is_mine: Optional[bool] = None

    class Config:
        from_attributes = True


class LeadListResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    vehicle: str
    status: str
    assigned_user_id: Optional[int] = None
    assigned_user_name: Optional[str] = None
    next_contact_date: Optional[datetime] = None
    can_edit: bool
    is_mine: bool

    class Config:
        from_attributes = True


class LeadMoveRequest(BaseModel):
    new_status: LeadStatusEnum


class LeadResignRequest(BaseModel):
    resignation_status: ResignationStatusEnum


class PipelineResponse(BaseModel):
    wants_car: List[LeadListResponse]
    searching_no_contract: List[LeadListResponse]
    contract_sent: List[LeadListResponse]
    contract_signed: List[LeadListResponse]
    deposit: List[LeadListResponse]
    bidding_order: List[LeadListResponse]
    won: List[LeadListResponse]
