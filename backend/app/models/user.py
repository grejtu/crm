from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class UserRole(str, enum.Enum):
    MANAGER = "manager"
    USER = "user"
    BIDDER = "bidder"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    leads = relationship("Lead", back_populates="assigned_user", foreign_keys="Lead.assigned_user_id")
    lead_history_entries = relationship("LeadHistory", back_populates="user")
    bidding_entries = relationship("BiddingPipeline", back_populates="bidder")
