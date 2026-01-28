from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.bidding import BidderPipelineResponse, BidderLeadResponse, BiddingStatusUpdate
from ..models.user import User, UserRole
from ..models.lead import Lead, LeadStatus
from ..models.lead_history import ChangeType
from ..models.bidding_pipeline import BiddingPipeline, BiddingStatus
from ..services.lead_service import LeadService
from ..middleware.auth_middleware import require_roles

router = APIRouter(prefix="/bidder", tags=["Bidder Panel"])


@router.get("/pipeline", response_model=BidderPipelineResponse)
def get_bidder_pipeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["bidder", "manager"]))
):
    # Get all leads in bidding pipeline
    bidding_entries = db.query(BiddingPipeline).all()

    pipeline = {
        "bidding_order": [],
        "carfax_ok": [],
        "won": []
    }

    for entry in bidding_entries:
        lead = entry.lead

        # Skip if lead status doesn't match
        if lead.status not in [LeadStatus.BIDDING_ORDER, LeadStatus.WON]:
            continue

        lead_response = BidderLeadResponse(
            id=lead.id,
            first_name=lead.first_name,
            last_name=lead.last_name,
            vehicle=lead.vehicle,
            budget=lead.budget,
            final_budget=lead.final_budget,
            bidding_status=entry.bidding_status.value
        )

        if entry.bidding_status == BiddingStatus.PENDING:
            pipeline["bidding_order"].append(lead_response)
        elif entry.bidding_status == BiddingStatus.CARFAX_OK:
            pipeline["carfax_ok"].append(lead_response)
        elif entry.bidding_status == BiddingStatus.WON:
            pipeline["won"].append(lead_response)

    return BidderPipelineResponse(**pipeline)


@router.post("/leads/{lead_id}/update-status")
def update_bidding_status(
    lead_id: int,
    status_data: BiddingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["bidder", "manager"]))
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead nie znaleziony")

    bidding = db.query(BiddingPipeline).filter(BiddingPipeline.lead_id == lead_id).first()
    if not bidding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead nie jest w pipeline licytacji"
        )

    old_status = bidding.bidding_status
    new_status = BiddingStatus(status_data.bidding_status.value)

    if new_status == BiddingStatus.LOST:
        # Lead goes back to User at contract_signed status
        lead.status = LeadStatus.CONTRACT_SIGNED
        db.delete(bidding)

        LeadService.create_history_entry(
            db, lead.id, current_user, ChangeType.STATUS_CHANGE,
            "status", LeadStatus.BIDDING_ORDER.value, LeadStatus.CONTRACT_SIGNED.value
        )
        LeadService.create_history_entry(
            db, lead.id, current_user, ChangeType.STATUS_CHANGE,
            "bidding_status", old_status.value, "lost"
        )

    elif new_status == BiddingStatus.WON:
        lead.status = LeadStatus.WON
        bidding.bidding_status = new_status

        LeadService.create_history_entry(
            db, lead.id, current_user, ChangeType.STATUS_CHANGE,
            "status", lead.status.value, LeadStatus.WON.value
        )
        LeadService.create_history_entry(
            db, lead.id, current_user, ChangeType.STATUS_CHANGE,
            "bidding_status", old_status.value, new_status.value
        )

    else:  # CARFAX_OK or PENDING
        bidding.bidding_status = new_status

        LeadService.create_history_entry(
            db, lead.id, current_user, ChangeType.STATUS_CHANGE,
            "bidding_status", old_status.value, new_status.value
        )

    db.commit()
    db.refresh(lead)

    return {
        "id": lead.id,
        "status": lead.status.value,
        "bidding_status": new_status.value if new_status != BiddingStatus.LOST else None,
        "updated_at": lead.updated_at.isoformat()
    }
