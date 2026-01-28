from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date


class StatusCounts(BaseModel):
    wants_car: int = 0
    searching_no_contract: int = 0
    contract_sent: int = 0
    contract_signed: int = 0
    deposit: int = 0
    bidding_order: int = 0
    won: int = 0


class Conversions(BaseModel):
    wants_car_to_contract_signed: float = 0.0
    contract_signed_to_won: float = 0.0


class UserStatsResponse(BaseModel):
    user_id: int
    user_name: str
    total_leads: int
    by_status: StatusCounts
    conversions: Conversions


class DailyStats(BaseModel):
    date: date
    new_leads: int
    won: int


class WeeklyStats(BaseModel):
    week: str
    new_leads: int
    won: int


class MonthlyStats(BaseModel):
    month: str
    new_leads: int
    won: int


class TimeStatsResponse(BaseModel):
    daily: List[DailyStats]
    weekly: List[WeeklyStats]
    monthly: List[MonthlyStats]


class ManagerDashboardResponse(BaseModel):
    users: List[UserStatsResponse]
    time_stats: TimeStatsResponse


class ContactLead(BaseModel):
    id: int
    first_name: str
    last_name: str
    vehicle: str
    next_contact_date: Optional[str] = None


class UserDashboardResponse(BaseModel):
    my_leads_count: int
    by_status: StatusCounts
    today_contacts: List[ContactLead]
    overdue_contacts: List[ContactLead]
