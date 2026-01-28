from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from ..models.user import User, UserRole
from ..models.lead import Lead
from ..services.auth_service import AuthService
from ..middleware.auth_middleware import require_roles

router = APIRouter(prefix="/manager/users", tags=["User Management"])


@router.get("", response_model=List[UserListResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["manager"]))
):
    users = db.query(User).all()
    result = []
    for user in users:
        leads_count = db.query(Lead).filter(
            Lead.assigned_user_id == user.id,
            Lead.is_resigned == False
        ).count()
        result.append(UserListResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at,
            leads_count=leads_count
        ))
    return result


@router.post("/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["manager"]))
):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email już istnieje w systemie"
        )

    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=AuthService.get_password_hash(user_data.password),
        name=user_data.name,
        role=UserRole(user_data.role)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role.value,
        is_active=new_user.is_active,
        created_at=new_user.created_at
    )


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["manager"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Użytkownik nie znaleziony"
        )

    # Check email uniqueness if changed
    if user_data.email and user_data.email != user.email:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email już istnieje w systemie"
            )
        user.email = user_data.email

    if user_data.password:
        user.password_hash = AuthService.get_password_hash(user_data.password)

    if user_data.name:
        user.name = user_data.name

    if user_data.role:
        user.role = UserRole(user_data.role)

    if user_data.is_active is not None:
        # Check for active leads before deactivating
        if not user_data.is_active:
            active_leads = db.query(Lead).filter(
                Lead.assigned_user_id == user_id,
                Lead.is_resigned == False
            ).count()
            if active_leads > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Użytkownik ma przypisane aktywne leady. Najpierw przepisz je na innego użytkownika."
                )
        user.is_active = user_data.is_active

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["manager"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Użytkownik nie znaleziony"
        )

    # Check for active leads
    active_leads = db.query(Lead).filter(
        Lead.assigned_user_id == user_id,
        Lead.is_resigned == False
    ).count()
    if active_leads > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Użytkownik ma przypisane aktywne leady. Najpierw przepisz je na innego użytkownika."
        )

    # Soft delete
    user.is_active = False
    db.commit()

    return {"message": "Użytkownik został dezaktywowany"}
