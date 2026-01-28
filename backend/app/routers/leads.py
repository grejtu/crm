from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional
from datetime import datetime, date
import json
import io
import pandas as pd
from ..database import get_db
from ..schemas.lead import (
    LeadCreate, LeadUpdate, LeadResponse, LeadListResponse,
    LeadMoveRequest, LeadResignRequest, LeadPermissions,
    LeadsByDateFilter
)
from ..schemas.lead_history import LeadHistoryResponse
from ..schemas.csv_import import CSVPreviewResponse, CSVImportResponse, CSVError
from ..models.user import User, UserRole
from ..models.lead import Lead, LeadStatus, ResignationStatus, STATUS_ORDER
from ..models.lead_history import LeadHistory, ChangeType
from ..models.bidding_pipeline import BiddingPipeline, BiddingStatus
from ..services.lead_service import LeadService
from ..middleware.auth_middleware import get_current_user, require_roles

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["user", "manager"]))
):
    # Check for duplicates
    is_duplicate, message = LeadService.check_duplicate(db, lead_data.phone, lead_data.email)
    if is_duplicate:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    # Create lead
    lead = Lead(
        first_name=lead_data.first_name,
        last_name=lead_data.last_name,
        phone=lead_data.phone,
        email=lead_data.email,
        vehicle=lead_data.vehicle,
        budget=lead_data.budget,
        year_model=lead_data.year_model,
        mileage=lead_data.mileage,
        equipment=lead_data.equipment,
        client_trigger=lead_data.client_trigger,
        next_contact_date=lead_data.next_contact_date,
        comment=lead_data.comment,
        assigned_user_id=lead_data.assigned_user_id or current_user.id,
        status=LeadStatus.WANTS_CAR
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # Create history entry
    LeadService.create_history_entry(db, lead.id, current_user, ChangeType.LEAD_CREATED)
    db.commit()

    assigned_user = db.query(User).filter(User.id == lead.assigned_user_id).first()

    return LeadResponse(
        **{k: v for k, v in lead.__dict__.items() if not k.startswith('_')},
        status=lead.status.value,
        resignation_status=lead.resignation_status.value if lead.resignation_status else None,
        assigned_user_name=assigned_user.name if assigned_user else None,
        permissions=LeadPermissions(**LeadService.get_permissions(lead, current_user))
    )


@router.get("", response_model=List[LeadListResponse])
def get_leads(
    view_mode: str = Query("my", pattern="^(my|all)$"),
    status: Optional[str] = None,
    assigned_user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lead).filter(Lead.is_resigned == False)

    # Filter by view mode
    if view_mode == "my" and current_user.role != UserRole.BIDDER:
        query = query.filter(Lead.assigned_user_id == current_user.id)

    # Filter by status
    if status:
        query = query.filter(Lead.status == LeadStatus(status))

    # Filter by assigned user (manager only)
    if assigned_user_id and current_user.role == UserRole.MANAGER:
        query = query.filter(Lead.assigned_user_id == assigned_user_id)

    # Bidder sees only bidding_order and later
    if current_user.role == UserRole.BIDDER:
        query = query.filter(Lead.status.in_([LeadStatus.BIDDING_ORDER, LeadStatus.WON]))

    leads = query.order_by(Lead.updated_at.desc()).all()

    result = []
    for lead in leads:
        assigned_user = db.query(User).filter(User.id == lead.assigned_user_id).first()
        is_mine = lead.assigned_user_id == current_user.id
        permissions = LeadService.get_permissions(lead, current_user)

        result.append(LeadListResponse(
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
        ))

    return result


@router.get("/search", response_model=List[LeadListResponse])
def search_leads(
    phone: Optional[str] = None,
    email: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not phone and not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Podaj numer telefonu lub email"
        )

    query = db.query(Lead)
    conditions = []

    if phone:
        conditions.append(Lead.phone.contains(phone))
    if email:
        conditions.append(Lead.email.contains(email))

    query = query.filter(or_(*conditions))
    leads = query.all()

    result = []
    for lead in leads:
        assigned_user = db.query(User).filter(User.id == lead.assigned_user_id).first()
        is_mine = lead.assigned_user_id == current_user.id
        permissions = LeadService.get_permissions(lead, current_user)

        result.append(LeadListResponse(
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
        ))

    return result


@router.get("/by-date", response_model=List[LeadListResponse])
def get_leads_by_date(
    filter: LeadsByDateFilter,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    query = db.query(Lead).filter(Lead.is_resigned == False)

    # Filter by user
    if current_user.role == UserRole.USER:
        query = query.filter(Lead.assigned_user_id == current_user.id)
    elif user_id and current_user.role == UserRole.MANAGER:
        query = query.filter(Lead.assigned_user_id == user_id)

    # Filter by date
    if filter == LeadsByDateFilter.TODAY:
        query = query.filter(func.date(Lead.next_contact_date) == today)
    elif filter == LeadsByDateFilter.OVERDUE:
        query = query.filter(
            and_(
                func.date(Lead.next_contact_date) < today,
                Lead.next_contact_date.isnot(None)
            )
        )
    elif filter == LeadsByDateFilter.UPCOMING:
        query = query.filter(func.date(Lead.next_contact_date) > today)

    leads = query.order_by(Lead.next_contact_date).all()

    result = []
    for lead in leads:
        assigned_user = db.query(User).filter(User.id == lead.assigned_user_id).first()
        is_mine = lead.assigned_user_id == current_user.id
        permissions = LeadService.get_permissions(lead, current_user)

        result.append(LeadListResponse(
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
        ))

    return result


@router.get("/resigned")
def get_resigned_leads(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lead).filter(Lead.is_resigned == True)

    # Filter by user
    if current_user.role == UserRole.USER:
        query = query.filter(Lead.assigned_user_id == current_user.id)
    elif user_id and current_user.role == UserRole.MANAGER:
        query = query.filter(Lead.assigned_user_id == user_id)

    leads = query.all()

    # Group by resignation status
    result = {
        "bought_in_poland": [],
        "no_import": [],
        "resigns_completely": [],
        "wants_new_car": [],
        "wants_leasing": []
    }

    for lead in leads:
        assigned_user = db.query(User).filter(User.id == lead.assigned_user_id).first()

        # Get resignation date from history
        history_entry = db.query(LeadHistory).filter(
            LeadHistory.lead_id == lead.id,
            LeadHistory.change_type == ChangeType.RESIGNED
        ).order_by(LeadHistory.timestamp.desc()).first()

        lead_data = {
            "id": lead.id,
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "phone": lead.phone,
            "email": lead.email,
            "vehicle": lead.vehicle,
            "status": lead.status.value,
            "resignation_status": lead.resignation_status.value if lead.resignation_status else None,
            "resignation_date": history_entry.timestamp.isoformat() if history_entry else None,
            "assigned_user_name": assigned_user.name if assigned_user else None
        }

        if lead.resignation_status:
            result[lead.resignation_status.value].append(lead_data)

    return result


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nie znaleziony")

    assigned_user = db.query(User).filter(User.id == lead.assigned_user_id).first()
    permissions = LeadService.get_permissions(lead, current_user)

    return LeadResponse(
        **{k: v for k, v in lead.__dict__.items() if not k.startswith('_')},
        status=lead.status.value,
        resignation_status=lead.resignation_status.value if lead.resignation_status else None,
        assigned_user_name=assigned_user.name if assigned_user else None,
        permissions=LeadPermissions(**permissions),
        can_edit=permissions["can_edit"],
        is_mine=lead.assigned_user_id == current_user.id
    )


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nie znaleziony")

    # Check permissions
    can_edit, error = LeadService.can_edit_lead(lead, current_user)
    if not can_edit:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)

    # Check final_budget permission
    if lead_data.final_budget is not None and not LeadService.can_edit_final_budget(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nie masz uprawnień do edycji finalnego budżetu"
        )

    # Check for duplicates if phone/email changed
    if lead_data.phone or lead_data.email:
        phone = lead_data.phone or lead.phone
        email = lead_data.email if lead_data.email is not None else lead.email
        is_duplicate, message = LeadService.check_duplicate(db, phone, email, lead_id)
        if is_duplicate:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    # Update fields and create history entries
    update_data = lead_data.model_dump(exclude_unset=True)
    for field, new_value in update_data.items():
        old_value = getattr(lead, field)
        if old_value != new_value:
            setattr(lead, field, new_value)
            LeadService.create_history_entry(
                db, lead.id, current_user, ChangeType.FIELD_UPDATE,
                field, old_value, new_value
            )

    db.commit()
    db.refresh(lead)

    assigned_user = db.query(User).filter(User.id == lead.assigned_user_id).first()

    return LeadResponse(
        **{k: v for k, v in lead.__dict__.items() if not k.startswith('_')},
        status=lead.status.value,
        resignation_status=lead.resignation_status.value if lead.resignation_status else None,
        assigned_user_name=assigned_user.name if assigned_user else None,
        permissions=LeadPermissions(**LeadService.get_permissions(lead, current_user))
    )


@router.post("/{lead_id}/move")
def move_lead(
    lead_id: int,
    move_data: LeadMoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nie znaleziony")

    # Check permissions
    can_move, error = LeadService.can_move_lead(lead, current_user)
    if not can_move:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)

    old_status = lead.status
    new_status = LeadStatus(move_data.new_status.value)
    lead.status = new_status

    # Create history entry
    LeadService.create_history_entry(
        db, lead.id, current_user, ChangeType.STATUS_CHANGE,
        "status", old_status.value, new_status.value
    )

    # Create bidding entry if moving to bidding_order
    if new_status == LeadStatus.BIDDING_ORDER and not lead.bidding_entry:
        # Find a bidder to assign
        bidder = db.query(User).filter(
            User.role == UserRole.BIDDER,
            User.is_active == True
        ).first()

        if bidder:
            LeadService.create_bidding_entry(db, lead, bidder.id)

    db.commit()
    db.refresh(lead)

    return {
        "id": lead.id,
        "status": lead.status.value,
        "updated_at": lead.updated_at.isoformat()
    }


@router.post("/{lead_id}/resign")
def resign_lead(
    lead_id: int,
    resign_data: LeadResignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["user", "manager"]))
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nie znaleziony")

    # Check permissions (User can only resign own leads)
    if current_user.role == UserRole.USER and lead.assigned_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nie możesz oznaczać jako rezygnacja leadów innych użytkowników"
        )

    if lead.is_resigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead jest już oznaczony jako rezygnacja"
        )

    lead.is_resigned = True
    lead.resignation_status = ResignationStatus(resign_data.resignation_status.value)

    LeadService.create_history_entry(
        db, lead.id, current_user, ChangeType.RESIGNED,
        "resignation_status", None, resign_data.resignation_status.value
    )

    db.commit()
    db.refresh(lead)

    return {
        "id": lead.id,
        "is_resigned": lead.is_resigned,
        "resignation_status": lead.resignation_status.value,
        "updated_at": lead.updated_at.isoformat()
    }


@router.post("/{lead_id}/restore")
def restore_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["user", "manager"]))
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nie znaleziony")

    # Check permissions
    if current_user.role == UserRole.USER and lead.assigned_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nie możesz przywracać leadów innych użytkowników"
        )

    if not lead.is_resigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead nie jest oznaczony jako rezygnacja"
        )

    old_status = lead.resignation_status.value if lead.resignation_status else None
    lead.is_resigned = False
    lead.resignation_status = None

    LeadService.create_history_entry(
        db, lead.id, current_user, ChangeType.RESTORED,
        "resignation_status", old_status, None
    )

    db.commit()
    db.refresh(lead)

    return {
        "id": lead.id,
        "is_resigned": lead.is_resigned,
        "resignation_status": None,
        "updated_at": lead.updated_at.isoformat()
    }


@router.get("/{lead_id}/history", response_model=List[LeadHistoryResponse])
def get_lead_history(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nie znaleziony")

    history = db.query(LeadHistory).filter(
        LeadHistory.lead_id == lead_id
    ).order_by(LeadHistory.timestamp.desc()).all()

    return [
        LeadHistoryResponse(
            id=h.id,
            timestamp=h.timestamp,
            user_name=h.user_name,
            user_role=h.user_role,
            change_type=h.change_type.value,
            field_changed=h.field_changed,
            old_value=h.old_value,
            new_value=h.new_value
        ) for h in history
    ]


# CSV Import endpoints
@router.post("/import/preview", response_model=CSVPreviewResponse)
async def preview_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(["user", "manager"]))
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plik musi być w formacie CSV"
        )

    contents = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nie można odczytać pliku CSV: {str(e)}"
        )

    columns = df.columns.tolist()

    # Suggested mapping
    mapping_hints = {
        "imię": "first_name", "first_name": "first_name", "imie": "first_name",
        "nazwisko": "last_name", "last_name": "last_name",
        "telefon": "phone", "phone": "phone", "tel": "phone",
        "email": "email", "e-mail": "email",
        "auto": "vehicle", "vehicle": "vehicle", "pojazd": "vehicle", "samochód": "vehicle",
        "budżet": "budget", "budget": "budget",
        "rocznik": "year_model", "rok": "year_model",
        "przebieg": "mileage", "km": "mileage",
        "komentarz": "comment", "comment": "comment", "notatka": "comment",
        "wyposażenie": "equipment", "equipment": "equipment"
    }

    suggested = {}
    for col in columns:
        col_lower = col.lower().strip()
        if col_lower in mapping_hints:
            suggested[col] = mapping_hints[col_lower]

    preview_rows = df.head(5).values.tolist()
    preview_rows = [[str(cell) if pd.notna(cell) else "" for cell in row] for row in preview_rows]

    return CSVPreviewResponse(
        columns=columns,
        suggested_mapping=suggested,
        preview_rows=preview_rows
    )


@router.post("/import/execute", response_model=CSVImportResponse)
async def execute_csv_import(
    file: UploadFile = File(...),
    mapping: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["user", "manager"]))
):
    contents = await file.read()
    mapping_dict = json.loads(mapping)

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nie można odczytać pliku CSV: {str(e)}"
        )

    # Check required fields
    required_fields = ["first_name", "last_name", "phone", "vehicle"]
    mapped_fields = list(mapping_dict.values())

    for field in required_fields:
        if field not in mapped_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Musisz zamapować wymagane pole: {field}"
            )

    success_count = 0
    skipped_count = 0
    errors = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # +1 for 0-index, +1 for header

        try:
            lead_data = {}
            for csv_col, db_field in mapping_dict.items():
                if db_field != "--- Pomiń ---" and csv_col in row:
                    value = row[csv_col]
                    if pd.notna(value):
                        if db_field in ["budget", "year_model", "mileage"]:
                            lead_data[db_field] = int(float(value))
                        else:
                            lead_data[db_field] = str(value).strip()

            # Validate required fields
            for field in required_fields:
                if field not in lead_data or not lead_data[field]:
                    raise ValueError(f"Brak wymaganego pola: {field}")

            # Check duplicate
            is_duplicate, msg = LeadService.check_duplicate(db, lead_data["phone"], lead_data.get("email"))
            if is_duplicate:
                errors.append(CSVError(row=row_num, error=msg))
                skipped_count += 1
                continue

            # Create lead
            lead = Lead(
                first_name=lead_data["first_name"],
                last_name=lead_data["last_name"],
                phone=lead_data["phone"],
                email=lead_data.get("email"),
                vehicle=lead_data["vehicle"],
                budget=lead_data.get("budget"),
                year_model=lead_data.get("year_model"),
                mileage=lead_data.get("mileage"),
                equipment=lead_data.get("equipment"),
                comment=lead_data.get("comment"),
                assigned_user_id=current_user.id,
                status=LeadStatus.WANTS_CAR
            )
            db.add(lead)
            db.flush()

            LeadService.create_history_entry(db, lead.id, current_user, ChangeType.LEAD_CREATED)
            success_count += 1

        except Exception as e:
            errors.append(CSVError(row=row_num, error=str(e)))
            skipped_count += 1

    db.commit()

    return CSVImportResponse(
        success_count=success_count,
        skipped_count=skipped_count,
        errors=errors
    )
