"""Pydantic models for API requests and responses"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone


# ============== ROLES ==============
class UserRole:
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    CLOSER = "closer"


class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    company: str = ""
    phone: str = ""
    category: str = ""
    company_size: int = 10
    features: List[str] = []
    estimated_setup: float = 0
    estimated_monthly: float = 0
    language: str = "fr"
    status: str = "new"
    type: str = "lead"
    subject: str = ""
    message: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    company: str
    phone: str = ""
    category: str
    company_size: int = 10
    features: List[str] = []
    estimated_setup: float = 0
    estimated_monthly: float = 0
    language: str = "fr"


class LeadStatusUpdate(BaseModel):
    status: str


class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    subject: str = ""
    message: str
    language: str = "fr"


class AdminLogin(BaseModel):
    email: str
    password: str


def _validate_password_strength(v: str) -> str:
    if len(v) < 12:
        raise ValueError("Password must be at least 12 characters long")
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.islower() for c in v):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least one digit")
    if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in v):
        raise ValueError("Password must contain at least one special character")
    return v


class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "admin"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return _validate_password_strength(v)
        return v


class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    admin_email: str
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class QuoteCreate(BaseModel):
    client_name: str
    client_email: Optional[str] = ""
    client_company: Optional[str] = ""
    service_description: str
    price_ht: float
    notes: Optional[str] = ""
    lead_id: Optional[str] = None


class AuditCreate(BaseModel):
    client_name: str
    client_city: str = ""
    client_sector: str = ""
    client_email: str = ""
    problem_description: str
    hours_lost_per_week: float
    hourly_cost: float
    complexity: str = "medium"
    notes: str = ""
    lead_id: Optional[str] = None


class ChatMessageInput(BaseModel):
    session_id: str
    message: str
    language: str = "fr"


class CaseStudyCreate(BaseModel):
    title_fr: str
    title_en: str = ""
    category: str
    roi: str
    desc_fr: str
    desc_en: str = ""
    challenge_fr: str = ""
    challenge_en: str = ""
    solution_fr: str = ""
    solution_en: str = ""
    results_fr: List[str] = []
    results_en: List[str] = []
    image_url: str = ""
    tags: List[str] = []
    duration_fr: str = ""
    duration_en: str = ""
    team_fr: str = ""
    team_en: str = ""
    tech: List[str] = []
    published: bool = True


class CaseStudyUpdate(BaseModel):
    title_fr: Optional[str] = None
    title_en: Optional[str] = None
    category: Optional[str] = None
    roi: Optional[str] = None
    desc_fr: Optional[str] = None
    desc_en: Optional[str] = None
    challenge_fr: Optional[str] = None
    challenge_en: Optional[str] = None
    solution_fr: Optional[str] = None
    solution_en: Optional[str] = None
    results_fr: Optional[List[str]] = None
    results_en: Optional[List[str]] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = None
    duration_fr: Optional[str] = None
    duration_en: Optional[str] = None
    team_fr: Optional[str] = None
    team_en: Optional[str] = None
    tech: Optional[List[str]] = None
    published: Optional[bool] = None


class SolutionCreate(BaseModel):
    name_fr: str
    name_en: str = ""
    tag_fr: str = ""
    tag_en: str = ""
    desc_fr: str = ""
    desc_en: str = ""
    features_fr: List[str] = []
    features_en: List[str] = []
    icon: str = "users"
    chart_type: str = "area"
    published: bool = True


class SolutionUpdate(BaseModel):
    name_fr: Optional[str] = None
    name_en: Optional[str] = None
    tag_fr: Optional[str] = None
    tag_en: Optional[str] = None
    desc_fr: Optional[str] = None
    desc_en: Optional[str] = None
    features_fr: Optional[List[str]] = None
    features_en: Optional[List[str]] = None
    icon: Optional[str] = None
    chart_type: Optional[str] = None
    published: Optional[bool] = None



# ============== CLOSER SYSTEM ==============

class DealStatus:
    EN_COURS = "en_cours"
    SIGNE = "signe"
    PERDU = "perdu"


class DealCreate(BaseModel):
    """Schema for creating a new deal"""
    client_name: str
    client_email: str = ""
    amount_ht: float  # Montant du devis HT
    notes: str = ""


class DealUpdate(BaseModel):
    """Schema for updating a deal"""
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    amount_ht: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None  # Only admin can change to 'signe'


class Deal(BaseModel):
    """Full deal model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    closer_id: str  # ID of the closer who created this deal
    closer_email: str
    client_name: str
    client_email: str = ""
    amount_ht: float
    status: str = DealStatus.EN_COURS
    notes: str = ""
    commission_rate: float = 0  # Set when deal is signed
    commission_amount: float = 0  # Set when deal is signed
    signed_at: Optional[str] = None  # Set when deal is signed
    validated_by: Optional[str] = None  # Admin who validated
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CommissionTierCreate(BaseModel):
    """Schema for creating a commission tier"""
    name: str  # e.g., "Bronze", "Silver", "Gold"
    min_deals: int  # Minimum number of signed deals to reach this tier
    rate: float  # Commission rate (e.g., 10 for 10%, 12.5 for 12.5%)


class CommissionTierUpdate(BaseModel):
    """Schema for updating a commission tier"""
    name: Optional[str] = None
    min_deals: Optional[int] = None
    rate: Optional[float] = None


class CommissionTier(BaseModel):
    """Full commission tier model"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    min_deals: int
    rate: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CloserPermissions(BaseModel):
    """Closer permissions model"""
    modules: List[str] = []  # List of accessible modules: leads, chat, cases, solutions, content, users, quotes, audits
    can_view_all_data: bool = False  # Can view all data or only their own


class CloserCreate(BaseModel):
    """Schema for creating a closer"""
    email: EmailStr
    password: str
    name: str
    permissions: Optional[CloserPermissions] = None


class CloserUpdate(BaseModel):
    """Schema for updating a closer"""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[CloserPermissions] = None


class CloserStats(BaseModel):
    """Closer statistics"""
    closer_id: str
    closer_email: str
    closer_name: str
    total_deals: int = 0
    deals_en_cours: int = 0
    deals_signes: int = 0
    deals_perdus: int = 0
    total_ca: float = 0  # Total CA signé
    total_commission: float = 0
    conversion_rate: float = 0  # deals_signes / total_deals * 100
    current_tier_name: str = ""
    current_tier_rate: float = 0


# ============== FAQ ==============
class FAQCreate(BaseModel):
    question_fr: str
    question_en: str
    answer_fr: str
    answer_en: str
    order: int = 0
    published: bool = True


class FAQUpdate(BaseModel):
    question_fr: Optional[str] = None
    question_en: Optional[str] = None
    answer_fr: Optional[str] = None
    answer_en: Optional[str] = None
    order: Optional[int] = None
    published: Optional[bool] = None
