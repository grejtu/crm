from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base


class ChangeType(str, enum.Enum):
    STATUS_CHANGE = "status_change"
    FIELD_UPDATE = "field_update"
    COMMENT_ADDED = "comment_added"
    CONTACT_SCHEDULED = "contact_scheduled"
    LEAD_CREATED = "lead_created"
    RESIGNED = "resigned"
    RESTORED = "restored"


class LeadHistory(Base):
    __tablename__ = "lead_history"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_role = Column(String(20), nullable=False)
    user_name = Column(String(100), nullable=False)
    field_changed = Column(String(50))
    old_value = Column(Text)
    new_value = Column(Text)
    change_type = Column(Enum(ChangeType), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="history")
    user = relationship("User", back_populates="lead_history_entries")
