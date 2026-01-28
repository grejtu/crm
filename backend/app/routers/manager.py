from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.stats import (
    ManagerDashboardResponse, UserStatsResponse, UserDashboardResponse,
    ContactLead
)
from ..schemas.lead import LeadListResponse
from ..models.user import User, UserRole
from ..models.lead import Lead, LeadStatus
from ..services.stats_service import StatsService
from ..services.lead_service import LeadService
from ..middleware.auth_middleware import require_roles, get_current_user
from datetime import date
from sqlalchemy import func

router = APIRouter(tags=["Manager & User Dashboards"])


@router.get("/manager/dashboard", response_model=ManagerDashboardResponse)
def get_manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["manager"]))
):
    # Get all users with role 'user'
    users = db.query(User).filter(
        User.role == UserRole.USER,
        User.is_active == True
    ).all()

    user_stats = []
    for user in users:
        stats = StatsService.get_user_stats(db, user)
        user_stats.append(stats)

    time_stats = StatsService.get_time_stats(db)

    return ManagerDashboardResponse(
        users=user_stats,
        time_stats=time_stats
    )


@router.get("/manager/users/{user_id}/leads")
def get_user_leads(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["manager"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "Użytkownik nie znaleziony"}

    leads = db.query(Lead).filter(
        Lead.assigned_user_id == user_id,
        Lead.is_resigned == False
    ).order_by(Lead.updated_at.desc()).all()

    stats = StatsService.get_user_stats(db, user)

    lead_list = []
    for lead in leads:
        lead_list.append({
            "id": lead.id,
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "vehicle": lead.vehicle,
            "status": lead.status.value,
            "created_at": lead.created_at.isoformat()
        })

    return {
        "user": {
            "id": user.id,
            "name": user.name
        },
        "leads": lead_list,
        "stats": stats
    }


@router.get("/user/dashboard", response_model=UserDashboardResponse)
def get_user_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()

    # Count leads
    my_leads_count = db.query(Lead).filter(
        Lead.assigned_user_id == current_user.id,
        Lead.is_resigned == False
    ).count()

    # Get status counts
    by_status = StatsService.get_status_counts(db, current_user.id)

    # Today's contacts
    today_leads = db.query(Lead).filter(
        Lead.assigned_user_id == current_user.id,
        Lead.is_resigned == False,
        func.date(Lead.next_contact_date) == today
    ).order_by(Lead.next_contact_date).all()

    today_contacts = [
        ContactLead(
            id=lead.id,
            first_name=lead.first_name,
            last_name=lead.last_name,
            vehicle=lead.vehicle,
            next_contact_date=lead.next_contact_date.isoformat() if lead.next_contact_date else None
        ) for lead in today_leads
    ]

    # Overdue contacts
    overdue_leads = db.query(Lead).filter(
        Lead.assigned_user_id == current_user.id,
        Lead.is_resigned == False,
        func.date(Lead.next_contact_date) < today,
        Lead.next_contact_date.isnot(None)
    ).order_by(Lead.next_contact_date).all()

    overdue_contacts = [
        ContactLead(
            id=lead.id,
            first_name=lead.first_name,
            last_name=lead.last_name,
            vehicle=lead.vehicle,
            next_contact_date=lead.next_contact_date.isoformat() if lead.next_contact_date else None
        ) for lead in overdue_leads
    ]

    return UserDashboardResponse(
        my_leads_count=my_leads_count,
        by_status=by_status,
        today_contacts=today_contacts,
        overdue_contacts=overdue_contacts
    )
