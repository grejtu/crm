from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class BiddingStatus(str, enum.Enum):
    PENDING = "pending"
    CARFAX_OK = "carfax_ok"
    WON = "won"
    LOST = "lost"


class BiddingPipeline(Base):
    __tablename__ = "bidding_pipeline"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), unique=True, nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bidding_status = Column(Enum(BiddingStatus), nullable=False, default=BiddingStatus.PENDING)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="bidding_entry")
    bidder = relationship("User", back_populates="bidding_entries")
