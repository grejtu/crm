from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class LeadStatus(str, enum.Enum):
    WANTS_CAR = "wants_car"
    SEARCHING_NO_CONTRACT = "searching_no_contract"
    CONTRACT_SENT = "contract_sent"
    CONTRACT_SIGNED = "contract_signed"
    DEPOSIT = "deposit"
    BIDDING_ORDER = "bidding_order"
    WON = "won"


class ResignationStatus(str, enum.Enum):
    BOUGHT_IN_POLAND = "bought_in_poland"
    NO_IMPORT = "no_import"
    RESIGNS_COMPLETELY = "resigns_completely"
    WANTS_NEW_CAR = "wants_new_car"
    WANTS_LEASING = "wants_leasing"


# Order of statuses for comparison
STATUS_ORDER = {
    LeadStatus.WANTS_CAR: 0,
    LeadStatus.SEARCHING_NO_CONTRACT: 1,
    LeadStatus.CONTRACT_SENT: 2,
    LeadStatus.CONTRACT_SIGNED: 3,
    LeadStatus.DEPOSIT: 4,
    LeadStatus.BIDDING_ORDER: 5,
    LeadStatus.WON: 6,
}


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(255), index=True)
    vehicle = Column(String(100), nullable=False)
    budget = Column(Integer)
    final_budget = Column(Integer)
    year_model = Column(Integer)
    mileage = Column(Integer)
    equipment = Column(Text)
    client_trigger = Column(Text)
    status = Column(Enum(LeadStatus), nullable=False, default=LeadStatus.WANTS_CAR)
    resignation_status = Column(Enum(ResignationStatus))
    is_resigned = Column(Boolean, default=False)
    first_contact_date = Column(DateTime(timezone=True), server_default=func.now())
    next_contact_date = Column(DateTime(timezone=True))
    comment = Column(Text)
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    assigned_user = relationship("User", back_populates="leads", foreign_keys=[assigned_user_id])
    history = relationship("LeadHistory", back_populates="lead", cascade="all, delete-orphan")
    bidding_entry = relationship("BiddingPipeline", back_populates="lead", uselist=False, cascade="all, delete-orphan")
