from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class BiddingStatusEnum(str, Enum):
    PENDING = "pending"
    CARFAX_OK = "carfax_ok"
    WON = "won"
    LOST = "lost"


class BiddingPipelineResponse(BaseModel):
    id: int
    lead_id: int
    bidder_id: int
    bidding_status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BiddingStatusUpdate(BaseModel):
    bidding_status: BiddingStatusEnum


class BidderLeadResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    vehicle: str
    budget: Optional[int] = None
    final_budget: Optional[int] = None
    bidding_status: str

    class Config:
        from_attributes = True


class BidderPipelineResponse(BaseModel):
    bidding_order: List[BidderLeadResponse]
    carfax_ok: List[BidderLeadResponse]
    won: List[BidderLeadResponse]
