from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class LoanStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISBURSED = "disbursed"
    CLOSED = "closed"

class EMIStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"

class TransactionType(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"
    EMI_PAYMENT = "emi_payment"
    LOAN_DISBURSEMENT = "loan_disbursement"

# Request/Response Models
class RegisterRequest(BaseModel):
    name: str
    phone: str
    email: EmailStr
    aadhar: str
    pan: str
    address: str
    nominee_name: str
    nominee_relation: str
    parent_name: str
    parent_phone: str
    face_image: Optional[str] = None  # Base64 encoded

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class LoginRequest(BaseModel):
    phone: str

class LoanApplicationRequest(BaseModel):
    amount: float
    purpose: str
    tenure_months: int
    employment_type: str
    monthly_income: float
    existing_loans: Optional[int] = 0

class ChatMessageRequest(BaseModel):
    message: str
    loan_id: Optional[str] = None

class NegotiateRequest(BaseModel):
    loan_id: str
    requested_amount: Optional[float] = None
    requested_tenure: Optional[int] = None
    requested_emi: Optional[float] = None

# Database Models
class UserDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    name: str
    phone: str
    email: EmailStr
    aadhar: str
    pan: str
    address: str
    nominee_name: str
    nominee_relation: str
    parent_name: str
    parent_phone: str
    face_image: Optional[str] = None
    account_balance: float = Field(default=50000.0)
    credit_score: Optional[int] = None
    role: str = "user"
    is_verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class LoanDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    amount: float
    approved_amount: Optional[float] = None
    purpose: str
    tenure_months: int
    interest_rate: float
    emi_amount: Optional[float] = None
    status: LoanStatus
    credit_score: Optional[int] = None
    risk_level: Optional[str] = None
    employment_type: str
    monthly_income: float
    existing_loans: int
    underwriting_notes: Optional[str] = None
    ai_decision: Optional[Dict[str, Any]] = None
    applied_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    approved_at: Optional[datetime] = None
    disbursed_at: Optional[datetime] = None

class TransactionDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    type: TransactionType
    amount: float
    description: str
    balance_after: float
    loan_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class RepaymentDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    loan_id: str
    user_id: str
    emi_number: int
    due_date: datetime
    amount: float
    status: EMIStatus
    paid_date: Optional[datetime] = None
    penalty: float = 0.0

class OTPDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    email: EmailStr
    otp: str
    expires_at: datetime
    verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class ChatHistoryDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    role: str  # 'user' or 'assistant'
    message: str
    loan_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())