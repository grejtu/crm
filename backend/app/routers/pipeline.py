from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas.lead import PipelineResponse, LeadListResponse
from ..models.user import User, UserRole
from ..models.lead import Lead, LeadStatus
from ..services.lead_service import LeadService
from ..middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


@router.get("", response_model=PipelineResponse)
def get_pipeline(
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lead).filter(Lead.is_resigned == False)

    # Filter based on role
    if current_user.role == UserRole.USER:
        query = query.filter(Lead.assigned_user_id == current_user.id)
    elif current_user.role == UserRole.MANAGER and user_id:
        query = query.filter(Lead.assigned_user_id == user_id)
    elif current_user.role == UserRole.BIDDER:
        query = query.filter(Lead.status.in_([LeadStatus.BIDDING_ORDER, LeadStatus.WON]))

    leads = query.order_by(Lead.updated_at.desc()).all()

    # Group by status
    pipeline = {
        "wants_car": [],
        "searching_no_contract": [],
        "contract_sent": [],
        "contract_signed": [],
        "deposit": [],
        "bidding_order": [],
        "won": []
    }

    for lead in leads:
        assigned_user = db.query(User).filter(User.id == lead.assigned_user_id).first()
        is_mine = lead.assigned_user_id == current_user.id
        permissions = LeadService.get_permissions(lead, current_user)

        lead_response = LeadListResponse(
            id=lead.id,
            first_name=lead.first_name,
            last_name=lead.last_name,
            phone=lead.phone,
            email=lead.email,
            vehicle=lead.vehicle,
            status=lead.status.value,
            assigned_user_id=lead.assigned_user_id,
            assigned_user_name=assigned_user.name if assigned_user else None,
            next_contact_date=lead.next_contact_date,
            can_edit=permissions["can_edit"],
            is_mine=is_mine
        )

        pipeline[lead.status.value].append(lead_response)

    return PipelineResponse(**pipeline)
