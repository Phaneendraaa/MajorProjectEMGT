from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import local modules
from models import *
from auth import *
from email_service import send_otp_email, generate_otp, send_emi_reminder
from ai_agents import LoanOrchestratorAgent, ChatbotAgent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="NBFC Loan Management System")

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@api_router.post("/auth/register")
async def register(request: RegisterRequest):
    """Register new user with KYC details"""
    try:
        # Check if user already exists
        existing = await db.users.find_one({
            "$or": [
                {"email": request.email},
                {"phone": request.phone}
            ]
        })
        if existing:
            raise HTTPException(status_code=400, detail="User already exists with this email or phone")
        
        # Create user document
        user_data = request.model_dump()
        user_data["created_at"] = datetime.utcnow()
        user_data["account_balance"] = 50000.0  # Initial balance
        user_data["role"] = "user"
        user_data["is_verified"] = False
        
        result = await db.users.insert_one(user_data)
        user_id = str(result.inserted_id)
        
        # Send OTP for verification
        otp = generate_otp()
        otp_data = {
            "email": request.email,
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "verified": False,
            "created_at": datetime.utcnow()
        }
        await db.otps.insert_one(otp_data)
        
        # Send OTP email
        await send_otp_email(request.email, otp)
        
        return {
            "message": "Registration successful. OTP sent to your email.",
            "user_id": user_id,
            "email": request.email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    """Send OTP to user email"""
    try:
        # Check if user exists
        user = await db.users.find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate and save OTP
        otp = generate_otp()
        otp_data = {
            "email": request.email,
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "verified": False,
            "created_at": datetime.utcnow()
        }
        
        # Delete old OTPs
        await db.otps.delete_many({"email": request.email})
        await db.otps.insert_one(otp_data)
        
        # Send OTP email
        await send_otp_email(request.email, otp)
        
        return {"message": "OTP sent to your email", "email": request.email}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send OTP error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest, response: Response):
    """Verify OTP and login user"""
    try:
        # Find OTP
        otp_doc = await db.otps.find_one({
            "email": request.email,
            "otp": request.otp,
            "verified": False
        })
        
        if not otp_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        # Check expiration
        if datetime.utcnow() > otp_doc["expires_at"]:
            raise HTTPException(status_code=400, detail="OTP expired")
        
        # Mark OTP as verified
        await db.otps.update_one(
            {"_id": otp_doc["_id"]},
            {"$set": {"verified": True}}
        )
        
        # Get user
        user = await db.users.find_one({"email": request.email}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Mark user as verified
        user_id = str((await db.users.find_one({"email": request.email}))["_id"])
        await db.users.update_one(
            {"email": request.email},
            {"$set": {"is_verified": True}}
        )
        
        # Create tokens
        access_token = create_access_token(user_id, request.email)
        refresh_token = create_refresh_token(user_id)
        
        # Set cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=604800,  # 7 days
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=2592000,  # 30 days
            path="/"
        )
        
        user["id"] = user_id
        return {
            "message": "Login successful",
            "user": user,
            "access_token": access_token
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify OTP error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login")
async def login(request: LoginRequest):
    """Login with phone number (sends OTP)"""
    try:
        # Find user by phone
        user = await db.users.find_one({"phone": request.phone})
        if not user:
            raise HTTPException(status_code=404, detail="User not found with this phone number")
        
        # Send OTP to user's email
        email = user["email"]
        otp = generate_otp()
        
        otp_data = {
            "email": email,
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "verified": False,
            "created_at": datetime.utcnow()
        }
        
        await db.otps.delete_many({"email": email})
        await db.otps.insert_one(otp_data)
        
        await send_otp_email(email, otp)
        
        return {
            "message": "OTP sent to your registered email",
            "email": email,
            "phone": request.phone
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user"""
    try:
        user = await get_current_user(request, db)
        return {"user": user}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get me error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

# ============================================================================
# USER DASHBOARD ENDPOINTS
# ============================================================================

@api_router.get("/user/dashboard")
async def get_dashboard(request: Request):
    """Get complete dashboard data"""
    try:
        user = await get_current_user(request, db)
        user_id = user["id"]
        
        # Get active loans
        active_loans = await db.loans.find({
            "user_id": user_id,
            "status": {"$in": ["approved", "disbursed", "under_review", "pending"]}
        }, {"_id": 0}).to_list(100)
        
        # Get past loans
        past_loans = await db.loans.find({
            "user_id": user_id,
            "status": {"$in": ["closed", "rejected"]}
        }, {"_id": 0}).to_list(100)
        
        # Get recent transactions
        recent_transactions = await db.transactions.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        # Get upcoming EMIs
        upcoming_emis = await db.repayments.find({
            "user_id": user_id,
            "status": "pending"
        }, {"_id": 0}).sort("due_date", 1).limit(5).to_list(5)
        
        # Calculate totals
        total_loan_amount = sum(loan.get("approved_amount", 0) for loan in active_loans)
        total_emi_pending = sum(emi.get("amount", 0) for emi in upcoming_emis)
        
        return {
            "user": user,
            "account_balance": user.get("account_balance", 0),
            "credit_score": user.get("credit_score"),
            "active_loans": active_loans,
            "past_loans": past_loans,
            "active_loans_count": len(active_loans),
            "past_loans_count": len(past_loans),
            "total_loan_amount": total_loan_amount,
            "recent_transactions": recent_transactions,
            "upcoming_emis": upcoming_emis,
            "total_emi_pending": total_emi_pending
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/user/transactions")
async def get_transactions(request: Request, limit: int = 50):
    """Get user transactions"""
    try:
        user = await get_current_user(request, db)
        user_id = user["id"]
        
        transactions = await db.transactions.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {"transactions": transactions}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get transactions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/user/loans")
async def get_loans(request: Request):
    """Get all user loans"""
    try:
        user = await get_current_user(request, db)
        user_id = user["id"]
        
        loans = await db.loans.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("applied_at", -1).to_list(100)
        
        # Add loan IDs
        loans_with_ids = []
        for loan in loans:
            loan_doc = await db.loans.find_one({"user_id": user_id, "amount": loan["amount"]})
            if loan_doc:
                loan["loan_id"] = str(loan_doc["_id"])
            loans_with_ids.append(loan)
        
        return {"loans": loans_with_ids}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get loans error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/user/emi-schedule/{loan_id}")
async def get_emi_schedule(loan_id: str, request: Request):
    """Get EMI schedule for a loan"""
    try:
        user = await get_current_user(request, db)
        
        # Validate loan belongs to user
        try:
            loan = await db.loans.find_one({
                "_id": ObjectId(loan_id),
                "user_id": user["id"]
            }, {"_id": 0})
        except:
            raise HTTPException(status_code=400, detail="Invalid loan ID")
        
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        # Get repayments
        repayments = await db.repayments.find(
            {"loan_id": loan_id},
            {"_id": 0}
        ).sort("emi_number", 1).to_list(100)
        
        return {
            "loan": loan,
            "emi_schedule": repayments
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get EMI schedule error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# LOAN APPLICATION ENDPOINTS
# ============================================================================

@api_router.post("/loan/apply")
async def apply_loan(loan_request: LoanApplicationRequest, request: Request):
    """Apply for a new loan"""
    try:
        user = await get_current_user(request, db)
        user_id = user["id"]
        
        # Get user's complete financial data
        past_loans = await db.loans.find({"user_id": user_id}, {"_id": 0}).to_list(100)
        total_transactions = await db.transactions.count_documents({"user_id": user_id})
        
        user_context = {
            "name": user.get("name"),
            "email": user.get("email"),
            "aadhar": user.get("aadhar"),
            "pan": user.get("pan"),
            "face_image": user.get("face_image"),
            "account_balance": user.get("account_balance", 0),
            "past_loans": past_loans,
            "total_transactions": total_transactions
        }
        
        loan_data = loan_request.model_dump()
        
        # Process through AI orchestrator
        orchestrator = LoanOrchestratorAgent()
        ai_result = await orchestrator.process_loan_application(user_context, loan_data)
        
        # Create loan document
        decision = ai_result["underwriting_decision"]
        credit_analysis = ai_result["credit_analysis"]
        emi_calc = ai_result["emi_calculation"]
        
        loan_doc = {
            "user_id": user_id,
            "amount": loan_request.amount,
            "approved_amount": decision.get("approved_amount", loan_request.amount),
            "purpose": loan_request.purpose,
            "tenure_months": loan_request.tenure_months,
            "interest_rate": emi_calc.get("interest_rate", 11.0),
            "emi_amount": emi_calc.get("emi_amount"),
            "status": decision.get("decision", "approved"),
            "credit_score": credit_analysis.get("credit_score"),
            "risk_level": credit_analysis.get("risk_level"),
            "employment_type": loan_request.employment_type,
            "monthly_income": loan_request.monthly_income,
            "existing_loans": loan_request.existing_loans,
            "underwriting_notes": decision.get("reason"),
            "ai_decision": ai_result,
            "applied_at": datetime.utcnow(),
            "approved_at": datetime.utcnow() if decision.get("decision") == "approved" else None
        }
        
        result = await db.loans.insert_one(loan_doc)
        loan_id = str(result.inserted_id)
        
        # Update user credit score
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"credit_score": credit_analysis.get("credit_score")}}
        )
        
        # If approved, create EMI schedule
        if decision.get("decision") == "approved":
            approved_amount = decision.get("approved_amount", loan_request.amount)
            emi_amount = emi_calc.get("emi_amount")
            
            for i in range(1, loan_request.tenure_months + 1):
                due_date = datetime.utcnow() + timedelta(days=30 * i)
                repayment = {
                    "loan_id": loan_id,
                    "user_id": user_id,
                    "emi_number": i,
                    "due_date": due_date,
                    "amount": emi_amount,
                    "status": "pending",
                    "penalty": 0.0
                }
                await db.repayments.insert_one(repayment)
        
        loan_doc["loan_id"] = loan_id
        return {
            "message": f"Loan application {decision.get('decision', 'processed')}",
            "loan": loan_doc,
            "ai_analysis": ai_result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Loan application error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/loan/status/{loan_id}")
async def get_loan_status(loan_id: str, request: Request):
    """Get loan status"""
    try:
        user = await get_current_user(request, db)
        
        try:
            loan = await db.loans.find_one({
                "_id": ObjectId(loan_id),
                "user_id": user["id"]
            }, {"_id": 0})
        except:
            raise HTTPException(status_code=400, detail="Invalid loan ID")
        
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        loan["loan_id"] = loan_id
        return {"loan": loan}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get loan status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# AI CHATBOT ENDPOINTS
# ============================================================================

@api_router.post("/chat/message")
async def chat_message(chat_request: ChatMessageRequest, request: Request):
    """Send message to AI chatbot"""
    try:
        user = await get_current_user(request, db)
        user_id = user["id"]
        
        # Get user context
        active_loans = await db.loans.find({
            "user_id": user_id,
            "status": {"$in": ["approved", "disbursed"]}
        }).to_list(10)
        
        past_loans = await db.loans.find({
            "user_id": user_id,
            "status": "closed"
        }).to_list(10)
        
        user_context = {
            "name": user.get("name"),
            "account_balance": user.get("account_balance", 0),
            "credit_score": user.get("credit_score"),
            "active_loans": len(active_loans),
            "past_loans_count": len(past_loans)
        }
        
        # Create chatbot agent
        chatbot = ChatbotAgent(user_id)
        
        # Get response
        ai_response = await chatbot.chat_with_user(chat_request.message, user_context)
        
        # Save chat history
        await db.chat_history.insert_one({
            "user_id": user_id,
            "role": "user",
            "message": chat_request.message,
            "loan_id": chat_request.loan_id,
            "created_at": datetime.utcnow()
        })
        
        await db.chat_history.insert_one({
            "user_id": user_id,
            "role": "assistant",
            "message": ai_response,
            "loan_id": chat_request.loan_id,
            "created_at": datetime.utcnow()
        })
        
        return {
            "message": ai_response,
            "timestamp": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/history")
async def get_chat_history(request: Request, limit: int = 50):
    """Get chat history"""
    try:
        user = await get_current_user(request, db)
        user_id = user["id"]
        
        history = await db.chat_history.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Reverse to show oldest first
        history.reverse()
        
        return {"history": history}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get chat history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/chat/negotiate")
async def negotiate_loan(nego_request: NegotiateRequest, request: Request):
    """Negotiate loan terms with AI"""
    try:
        user = await get_current_user(request, db)
        user_id = user["id"]
        
        # Get loan
        try:
            loan = await db.loans.find_one({
                "_id": ObjectId(nego_request.loan_id),
                "user_id": user_id
            })
        except:
            raise HTTPException(status_code=400, detail="Invalid loan ID")
        
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        # Create negotiation message
        message_parts = []
        if nego_request.requested_amount:
            message_parts.append(f"loan amount of ₹{nego_request.requested_amount:,.2f}")
        if nego_request.requested_tenure:
            message_parts.append(f"tenure of {nego_request.requested_tenure} months")
        if nego_request.requested_emi:
            message_parts.append(f"EMI of ₹{nego_request.requested_emi:,.2f}")
        
        message = f"I would like to negotiate my loan terms. I'm requesting " + " and ".join(message_parts) + f". My current approved loan is ₹{loan.get('approved_amount', 0):,.2f} for {loan.get('tenure_months')} months with EMI of ₹{loan.get('emi_amount', 0):,.2f}."
        
        # Get chatbot response
        chatbot = ChatbotAgent(user_id)
        user_context = {
            "name": user.get("name"),
            "account_balance": user.get("account_balance", 0),
            "credit_score": user.get("credit_score"),
            "active_loans": 1,
            "past_loans_count": 0
        }
        
        ai_response = await chatbot.chat_with_user(message, user_context)
        
        return {
            "message": ai_response,
            "original_loan": {
                "amount": loan.get("approved_amount"),
                "tenure": loan.get("tenure_months"),
                "emi": loan.get("emi_amount")
            },
            "requested": {
                "amount": nego_request.requested_amount,
                "tenure": nego_request.requested_tenure,
                "emi": nego_request.requested_emi
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Negotiate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# HEALTH CHECK
# ============================================================================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "NBFC Loan Management System",
        "timestamp": datetime.utcnow().isoformat()
    }

@api_router.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NBFC Loan Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Include router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and seed data"""
    logger.info("Starting NBFC Loan Management System...")
    
    # Create indexes
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("phone", unique=True)
        await db.loans.create_index("user_id")
        await db.transactions.create_index("user_id")
        await db.repayments.create_index("loan_id")
        await db.otps.create_index("email")
        await db.chat_history.create_index("user_id")
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
    
    logger.info("NBFC Loan Management System started successfully!")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection"""
    client.close()
    logger.info("Database connection closed")
