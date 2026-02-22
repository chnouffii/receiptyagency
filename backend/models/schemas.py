"""Pydantic models for API requests and responses"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone


class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    company: str
    phone: str = ""
    category: str
    company_size: int = 10
    features: List[str] = []
    estimated_setup: float = 0
    estimated_monthly: float = 0
    language: str = "fr"
    status: str = "new"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LeadCreate(BaseModel):
    name: str
    email: str
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
    email: str
    phone: str = ""
    subject: str = ""
    message: str
    language: str = "fr"


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "admin"


class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


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
