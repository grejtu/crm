from sqlalchemy.orm import Session
from typing import Optional, Tuple, Dict, Any
from ..models.user import User, UserRole
from ..models.lead import Lead, LeadStatus, STATUS_ORDER
from ..models.lead_history import LeadHistory, ChangeType
from ..models.bidding_pipeline import BiddingPipeline, BiddingStatus


class LeadService:
    @staticmethod
    def get_permissions(lead: Lead, user: User) -> Dict[str, bool]:
        if user.role == UserRole.MANAGER:
            return {
                "can_edit": True,
                "can_edit_final_budget": True,
                "can_change_status": True,
                "can_delete": True
            }
        elif user.role == UserRole.USER:
            is_owner = lead.assigned_user_id == user.id
            return {
                "can_edit": is_owner,
                "can_edit_final_budget": False,
                "can_change_status": is_owner,
                "can_delete": False
            }
        elif user.role == UserRole.BIDDER:
            in_bidding = STATUS_ORDER.get(lead.status, 0) >= STATUS_ORDER.get(LeadStatus.BIDDING_ORDER, 5)
            return {
                "can_edit": in_bidding,
                "can_edit_final_budget": True,
                "can_change_status": in_bidding,
                "can_delete": False
            }
        return {
            "can_edit": False,
            "can_edit_final_budget": False,
            "can_change_status": False,
            "can_delete": False
        }

    @staticmethod
    def can_edit_lead(lead: Lead, user: User) -> Tuple[bool, Optional[str]]:
        if user.role == UserRole.MANAGER:
            return True, None

        if user.role == UserRole.USER:
            if lead.assigned_user_id != user.id:
                return False, "Nie możesz edytować leadów innych użytkowników"
            return True, None

        if user.role == UserRole.BIDDER:
            if STATUS_ORDER.get(lead.status, 0) < STATUS_ORDER.get(LeadStatus.BIDDING_ORDER, 5):
                return False, "Możesz edytować tylko leady w etapie licytacji lub dalej"
            return True, None

        return False, "Brak uprawnień"

    @staticmethod
    def can_edit_final_budget(user: User) -> bool:
        return user.role in [UserRole.MANAGER, UserRole.BIDDER]

    @staticmethod
    def can_move_lead(lead: Lead, user: User) -> Tuple[bool, Optional[str]]:
        if user.role == UserRole.MANAGER:
            return True, None

        if user.role == UserRole.USER:
            if lead.assigned_user_id != user.id:
                return False, "Nie możesz przenosić leadów innych użytkowników"
            return True, None

        if user.role == UserRole.BIDDER:
            if STATUS_ORDER.get(lead.status, 0) < STATUS_ORDER.get(LeadStatus.BIDDING_ORDER, 5):
                return False, "Możesz przenosić tylko leady w etapie licytacji lub dalej"
            return True, None

        return False, "Brak uprawnień"

    @staticmethod
    def create_history_entry(
        db: Session,
        lead_id: int,
        user: User,
        change_type: ChangeType,
        field_changed: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None
    ) -> LeadHistory:
        history = LeadHistory(
            lead_id=lead_id,
            user_id=user.id,
            user_role=user.role.value,
            user_name=user.name,
            change_type=change_type,
            field_changed=field_changed,
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None
        )
        db.add(history)
        return history

    @staticmethod
    def check_duplicate(db: Session, phone: str, email: Optional[str] = None, exclude_id: Optional[int] = None) -> Tuple[bool, Optional[str]]:
        query = db.query(Lead).filter(Lead.phone == phone)
        if exclude_id:
            query = query.filter(Lead.id != exclude_id)
        existing = query.first()
        if existing:
            return True, f"Lead z numerem telefonu {phone} już istnieje"

        if email:
            query = db.query(Lead).filter(Lead.email == email)
            if exclude_id:
                query = query.filter(Lead.id != exclude_id)
            existing = query.first()
            if existing:
                return True, f"Lead z emailem {email} już istnieje"

        return False, None

    @staticmethod
    def create_bidding_entry(db: Session, lead: Lead, bidder_id: int) -> BiddingPipeline:
        bidding = BiddingPipeline(
            lead_id=lead.id,
            bidder_id=bidder_id,
            bidding_status=BiddingStatus.PENDING
        )
        db.add(bidding)
        return bidding
