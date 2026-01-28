from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, date, timedelta
from typing import List, Dict
from ..models.lead import Lead, LeadStatus
from ..models.user import User, UserRole
from ..schemas.stats import (
    StatusCounts, Conversions, UserStatsResponse,
    DailyStats, WeeklyStats, MonthlyStats, TimeStatsResponse
)


class StatsService:
    @staticmethod
    def get_status_counts(db: Session, user_id: int = None) -> StatusCounts:
        query = db.query(Lead).filter(Lead.is_resigned == False)
        if user_id:
            query = query.filter(Lead.assigned_user_id == user_id)

        counts = {}
        for status in LeadStatus:
            counts[status.value] = query.filter(Lead.status == status).count()

        return StatusCounts(**counts)

    @staticmethod
    def get_conversions(db: Session, user_id: int = None) -> Conversions:
        query = db.query(Lead)
        if user_id:
            query = query.filter(Lead.assigned_user_id == user_id)

        total_leads = query.count()
        if total_leads == 0:
            return Conversions()

        contract_signed_or_later = query.filter(
            Lead.status.in_([
                LeadStatus.CONTRACT_SIGNED,
                LeadStatus.DEPOSIT,
                LeadStatus.BIDDING_ORDER,
                LeadStatus.WON
            ])
        ).count()

        won_leads = query.filter(Lead.status == LeadStatus.WON).count()

        wants_car_to_contract = (contract_signed_or_later / total_leads) * 100 if total_leads > 0 else 0
        contract_to_won = (won_leads / contract_signed_or_later) * 100 if contract_signed_or_later > 0 else 0

        return Conversions(
            wants_car_to_contract_signed=round(wants_car_to_contract, 1),
            contract_signed_to_won=round(contract_to_won, 1)
        )

    @staticmethod
    def get_user_stats(db: Session, user: User) -> UserStatsResponse:
        total_leads = db.query(Lead).filter(
            Lead.assigned_user_id == user.id,
            Lead.is_resigned == False
        ).count()

        return UserStatsResponse(
            user_id=user.id,
            user_name=user.name,
            total_leads=total_leads,
            by_status=StatsService.get_status_counts(db, user.id),
            conversions=StatsService.get_conversions(db, user.id)
        )

    @staticmethod
    def get_time_stats(db: Session, user_id: int = None) -> TimeStatsResponse:
        today = date.today()

        # Daily stats (last 7 days)
        daily = []
        for i in range(7):
            d = today - timedelta(days=i)
            query = db.query(Lead)
            if user_id:
                query = query.filter(Lead.assigned_user_id == user_id)

            new_leads = query.filter(
                func.date(Lead.created_at) == d
            ).count()

            won = query.filter(
                Lead.status == LeadStatus.WON,
                func.date(Lead.updated_at) == d
            ).count()

            daily.append(DailyStats(date=d, new_leads=new_leads, won=won))

        # Weekly stats (last 4 weeks)
        weekly = []
        for i in range(4):
            week_start = today - timedelta(days=today.weekday() + 7 * i)
            week_end = week_start + timedelta(days=6)

            query = db.query(Lead)
            if user_id:
                query = query.filter(Lead.assigned_user_id == user_id)

            new_leads = query.filter(
                func.date(Lead.created_at) >= week_start,
                func.date(Lead.created_at) <= week_end
            ).count()

            won = query.filter(
                Lead.status == LeadStatus.WON,
                func.date(Lead.updated_at) >= week_start,
                func.date(Lead.updated_at) <= week_end
            ).count()

            week_str = f"{week_start.year}-W{week_start.isocalendar()[1]:02d}"
            weekly.append(WeeklyStats(week=week_str, new_leads=new_leads, won=won))

        # Monthly stats (last 3 months)
        monthly = []
        for i in range(3):
            if today.month - i > 0:
                month = today.month - i
                year = today.year
            else:
                month = 12 + (today.month - i)
                year = today.year - 1

            query = db.query(Lead)
            if user_id:
                query = query.filter(Lead.assigned_user_id == user_id)

            new_leads = query.filter(
                func.extract('year', Lead.created_at) == year,
                func.extract('month', Lead.created_at) == month
            ).count()

            won = query.filter(
                Lead.status == LeadStatus.WON,
                func.extract('year', Lead.updated_at) == year,
                func.extract('month', Lead.updated_at) == month
            ).count()

            month_str = f"{year}-{month:02d}"
            monthly.append(MonthlyStats(month=month_str, new_leads=new_leads, won=won))

        return TimeStatsResponse(daily=daily, weekly=weekly, monthly=monthly)
