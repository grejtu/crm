from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import User, Lead, LeadHistory, BiddingPipeline
from .models.user import UserRole
from .services.auth_service import AuthService
from .routers import (
    auth_router,
    users_router,
    leads_router,
    pipeline_router,
    bidder_router,
    manager_router
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CRM System API",
    description="System CRM do zarządzania leadami w procesie sprzedaży samochodów importowanych",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(leads_router)
app.include_router(pipeline_router)
app.include_router(bidder_router)
app.include_router(manager_router)


@app.on_event("startup")
def startup_event():
    """Create default admin user if not exists"""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@crm.pl").first()
        if not admin:
            admin = User(
                email="admin@crm.pl",
                password_hash=AuthService.get_password_hash("admin123"),
                name="Administrator",
                role=UserRole.MANAGER
            )
            db.add(admin)

            # Create demo users
            user = User(
                email="user@crm.pl",
                password_hash=AuthService.get_password_hash("user1234"),
                name="Jan Kowalski",
                role=UserRole.USER
            )
            db.add(user)

            bidder = User(
                email="bidder@crm.pl",
                password_hash=AuthService.get_password_hash("bidder12"),
                name="Piotr Licytant",
                role=UserRole.BIDDER
            )
            db.add(bidder)

            db.commit()
            print("Default users created:")
            print("  Manager: admin@crm.pl / admin123")
            print("  User: user@crm.pl / user1234")
            print("  Bidder: bidder@crm.pl / bidder12")
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "CRM System API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
