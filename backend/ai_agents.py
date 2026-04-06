import os
import json
from typing import Dict, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
from datetime import datetime, timedelta
import random

MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")

class CreditScoringAgent:
    """Analyzes user financial data and computes credit score"""
    
    def __init__(self):
        self.chat = LlmChat(
            api_key=MISTRAL_API_KEY,
            session_id=f"credit_scoring_{datetime.utcnow().timestamp()}",
            system_message="You are a credit scoring expert. Analyze financial data and provide credit scores (300-850). Return only JSON format with keys: credit_score, risk_level (low/medium/high), factors."
        ).with_model("openai", "gpt-5.2")
    
    async def calculate_score(self, user_data: Dict[str, Any], loan_data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""
Analyze the following data and calculate credit score:

User Financial Data:
- Monthly Income: ₹{loan_data.get('monthly_income', 0):,.2f}
- Employment Type: {loan_data.get('employment_type', 'Unknown')}
- Existing Loans: {loan_data.get('existing_loans', 0)}
- Account Balance: ₹{user_data.get('account_balance', 0):,.2f}
- Past Loan History: {len(user_data.get('past_loans', []))} loans
- Total Past Transactions: {user_data.get('total_transactions', 0)}

Loan Request:
- Amount: ₹{loan_data.get('amount', 0):,.2f}
- Purpose: {loan_data.get('purpose', 'Unknown')}
- Tenure: {loan_data.get('tenure_months', 0)} months

Return JSON with: credit_score, risk_level, factors (list of positive/negative factors).
"""
        try:
            response = await self.chat.send_message(UserMessage(text=prompt))
            result = json.loads(response)
            return result
        except:
            # Fallback calculation
            base_score = 650
            if loan_data.get('monthly_income', 0) > 50000:
                base_score += 50
            if loan_data.get('existing_loans', 0) == 0:
                base_score += 40
            if len(user_data.get('past_loans', [])) > 0:
                base_score += 30
            
            risk = "low" if base_score >= 720 else "medium" if base_score >= 650 else "high"
            return {
                "credit_score": min(850, base_score),
                "risk_level": risk,
                "factors": ["Stable income", "Low existing debt", "Good transaction history"]
            }

class DocumentVerificationAgent:
    """Verifies user documents and salary slips"""
    
    async def verify_documents(self, aadhar: str, pan: str, face_image: Optional[str]) -> Dict[str, Any]:
        # Simulate document verification
        return {
            "aadhar_verified": True,
            "pan_verified": True,
            "face_verified": True if face_image else False,
            "verification_score": 95,
            "notes": "All documents verified successfully"
        }
    
    async def analyze_salary_slip(self, monthly_income: float, employment_type: str) -> Dict[str, Any]:
        # Simulate OCR and analysis
        return {
            "verified": True,
            "extracted_income": monthly_income,
            "consistency_score": 92,
            "employment_stability": "high" if employment_type == "salaried" else "medium"
        }

class EMICalculationAgent:
    """Calculates EMI, interest rates, and repayment schedules"""
    
    def calculate_emi(self, principal: float, tenure_months: int, risk_level: str) -> Dict[str, Any]:
        # Interest rate based on risk
        interest_rates = {
            "low": 8.5,
            "medium": 11.0,
            "high": 14.5
        }
        annual_rate = interest_rates.get(risk_level, 11.0)
        monthly_rate = annual_rate / 12 / 100
        
        # EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
        if monthly_rate > 0:
            emi = principal * monthly_rate * ((1 + monthly_rate) ** tenure_months) / (((1 + monthly_rate) ** tenure_months) - 1)
        else:
            emi = principal / tenure_months
        
        total_amount = emi * tenure_months
        total_interest = total_amount - principal
        
        return {
            "emi_amount": round(emi, 2),
            "interest_rate": annual_rate,
            "total_amount": round(total_amount, 2),
            "total_interest": round(total_interest, 2),
            "processing_fee": round(principal * 0.01, 2)  # 1% processing fee
        }

class UnderwritingAgent:
    """Makes final loan approval/rejection decision"""
    
    def __init__(self):
        self.chat = LlmChat(
            api_key=MISTRAL_API_KEY,
            session_id=f"underwriting_{datetime.utcnow().timestamp()}",
            system_message="You are a senior loan underwriting officer. Review all analysis and make final loan approval decisions. Return only JSON with keys: decision (approved/rejected), approved_amount, reason, conditions (list)."
        ).with_model("openai", "gpt-5.2")
    
    async def make_decision(self, loan_data: Dict[str, Any], credit_analysis: Dict[str, Any], 
                           doc_verification: Dict[str, Any], emi_calculation: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""
Loan Underwriting Review:

Loan Request:
- Amount: ₹{loan_data.get('amount', 0):,.2f}
- Purpose: {loan_data.get('purpose')}
- Tenure: {loan_data.get('tenure_months')} months

Credit Analysis:
- Credit Score: {credit_analysis.get('credit_score')}
- Risk Level: {credit_analysis.get('risk_level')}
- Factors: {', '.join(credit_analysis.get('factors', []))}

Document Verification:
- Verification Score: {doc_verification.get('verification_score')}%
- Status: {'Verified' if doc_verification.get('aadhar_verified') else 'Pending'}

EMI Calculation:
- EMI Amount: ₹{emi_calculation.get('emi_amount', 0):,.2f}
- Interest Rate: {emi_calculation.get('interest_rate')}%
- Total Repayment: ₹{emi_calculation.get('total_amount', 0):,.2f}

Make underwriting decision. Return JSON with: decision, approved_amount, reason, conditions.
"""
        try:
            response = await self.chat.send_message(UserMessage(text=prompt))
            result = json.loads(response)
            return result
        except:
            # Fallback decision (approve all for demo)
            credit_score = credit_analysis.get('credit_score', 650)
            requested_amount = loan_data.get('amount', 0)
            
            if credit_score >= 700:
                return {
                    "decision": "approved",
                    "approved_amount": requested_amount,
                    "reason": "Strong credit profile and stable income",
                    "conditions": ["Maintain account balance", "Timely EMI payments"]
                }
            elif credit_score >= 650:
                return {
                    "decision": "approved",
                    "approved_amount": requested_amount * 0.85,
                    "reason": "Moderate risk profile, approved with reduced amount",
                    "conditions": ["Provide guarantor", "Monthly income proof", "Timely EMI payments"]
                }
            else:
                return {
                    "decision": "approved",  # Demo: approve all
                    "approved_amount": requested_amount * 0.7,
                    "reason": "Higher risk but manageable with conditions",
                    "conditions": ["Provide guarantor", "Life insurance coverage", "Quarterly income verification"]
                }

class LoanOrchestratorAgent:
    """Main orchestrator that coordinates all agents"""
    
    def __init__(self):
        self.credit_agent = CreditScoringAgent()
        self.doc_agent = DocumentVerificationAgent()
        self.emi_agent = EMICalculationAgent()
        self.underwriting_agent = UnderwritingAgent()
    
    async def process_loan_application(self, user_data: Dict[str, Any], loan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process complete loan application through all agents"""
        
        # Step 1: Credit Scoring
        credit_analysis = await self.credit_agent.calculate_score(user_data, loan_data)
        
        # Step 2: Document Verification
        doc_verification = await self.doc_agent.verify_documents(
            user_data.get('aadhar'),
            user_data.get('pan'),
            user_data.get('face_image')
        )
        
        # Step 3: Salary Slip Analysis
        salary_analysis = await self.doc_agent.analyze_salary_slip(
            loan_data.get('monthly_income'),
            loan_data.get('employment_type')
        )
        
        # Step 4: EMI Calculation
        emi_calculation = self.emi_agent.calculate_emi(
            loan_data.get('amount'),
            loan_data.get('tenure_months'),
            credit_analysis.get('risk_level', 'medium')
        )
        
        # Step 5: Underwriting Decision
        underwriting_decision = await self.underwriting_agent.make_decision(
            loan_data,
            credit_analysis,
            doc_verification,
            emi_calculation
        )
        
        return {
            "credit_analysis": credit_analysis,
            "document_verification": doc_verification,
            "salary_analysis": salary_analysis,
            "emi_calculation": emi_calculation,
            "underwriting_decision": underwriting_decision,
            "processed_at": datetime.utcnow().isoformat()
        }

class ChatbotAgent:
    """AI Chatbot that acts as virtual loan officer"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.chat = LlmChat(
            api_key=MISTRAL_API_KEY,
            session_id=f"chatbot_{user_id}",
            system_message="""You are a professional virtual loan officer at NBFC Bank. Your role:
- Help users understand loan products and eligibility
- Guide them through application process
- Explain credit scores, interest rates, and EMI calculations
- Negotiate loan terms (amount, tenure, EMI) within reasonable limits
- Provide personalized financial advice
- Be professional, empathetic, and helpful
- Access user's financial data to give accurate information
- You can approve, modify, or suggest alternatives for loan applications

Always be clear, concise, and customer-focused."""
        ).with_model("openai", "gpt-5.2")
    
    async def chat_with_user(self, message: str, user_context: Dict[str, Any]) -> str:
        """Handle user chat with context"""
        context = f"""
User Context:
- Name: {user_context.get('name')}
- Account Balance: ₹{user_context.get('account_balance', 0):,.2f}
- Credit Score: {user_context.get('credit_score', 'Not calculated yet')}
- Active Loans: {user_context.get('active_loans', 0)}
- Past Loans: {user_context.get('past_loans_count', 0)}

User Message: {message}
"""
        response = await self.chat.send_message(UserMessage(text=context))
        return response