import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Connect to MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Preloaded users data
PRELOADED_USERS = [
    {
        "name": "Vamshi Joshi",
        "phone": "9121647597",
        "email": "vamshijoshi25@gmail.com",
        "aadhar": "1234-5678-9001",
        "pan": "ABCDE1234F",
        "address": "Plot 123, Hitech City, Hyderabad, Telangana - 500081",
        "nominee_name": "Priya Joshi",
        "nominee_relation": "Spouse",
        "parent_name": "Ramesh Joshi",
        "parent_phone": "9876543210",
        "account_balance": 125000.0,
        "credit_score": 750,
        "role": "user",
        "is_verified": True
    },
    {
        "name": "Naga Phaneendra",
        "phone": "9063454476",
        "email": "nagaphaneendrapuranam@gmail.com",
        "aadhar": "2345-6789-0012",
        "pan": "BCDEF2345G",
        "address": "Flat 45, Gachibowli, Hyderabad, Telangana - 500032",
        "nominee_name": "Lakshmi Puranam",
        "nominee_relation": "Mother",
        "parent_name": "Venkat Puranam",
        "parent_phone": "9876543211",
        "account_balance": 98000.0,
        "credit_score": 720,
        "role": "user",
        "is_verified": True
    },
    {
        "name": "Ram Charan M",
        "phone": "9398123664",
        "email": "cgoud129@gmail.com",
        "aadhar": "3456-7890-0123",
        "pan": "CDEFG3456H",
        "address": "House 78, Madhapur, Hyderabad, Telangana - 500033",
        "nominee_name": "Sita Charan",
        "nominee_relation": "Sister",
        "parent_name": "Krishna Charan",
        "parent_phone": "9876543212",
        "account_balance": 156000.0,
        "credit_score": 780,
        "role": "user",
        "is_verified": True
    }
]

async def generate_loan_history(user_id: str, user_email: str, count: int = 2):
    """Generate past loan history for a user"""
    loans = []
    
    for i in range(count):
        loan_amount = random.choice([50000, 75000, 100000, 150000, 200000])
        tenure = random.choice([12, 18, 24, 36])
        interest_rate = random.uniform(8.5, 12.5)
        
        # Calculate EMI
        monthly_rate = interest_rate / 12 / 100
        emi = loan_amount * monthly_rate * ((1 + monthly_rate) ** tenure) / (((1 + monthly_rate) ** tenure) - 1)
        
        applied_date = datetime.utcnow() - timedelta(days=random.randint(180, 730))
        approved_date = applied_date + timedelta(days=random.randint(1, 3))
        disbursed_date = approved_date + timedelta(days=1)
        
        loan = {
            "user_id": user_id,
            "amount": loan_amount,
            "approved_amount": loan_amount,
            "purpose": random.choice(["Personal", "Education", "Home Renovation", "Medical"]),
            "tenure_months": tenure,
            "interest_rate": round(interest_rate, 2),
            "emi_amount": round(emi, 2),
            "status": "closed",
            "credit_score": random.randint(680, 760),
            "risk_level": "low",
            "employment_type": "salaried",
            "monthly_income": random.randint(40000, 80000),
            "existing_loans": 0,
            "underwriting_notes": "Approved based on good credit history",
            "applied_at": applied_date,
            "approved_at": approved_date,
            "disbursed_at": disbursed_date
        }
        
        result = await db.loans.insert_one(loan)
        loans.append(str(result.inserted_id))
        
        # Generate repayment history
        for emi_num in range(1, tenure + 1):
            due_date = disbursed_date + timedelta(days=30 * emi_num)
            paid_date = due_date - timedelta(days=random.randint(0, 3))
            
            repayment = {
                "loan_id": str(result.inserted_id),
                "user_id": user_id,
                "emi_number": emi_num,
                "due_date": due_date,
                "amount": round(emi, 2),
                "status": "paid",
                "paid_date": paid_date,
                "penalty": 0.0
            }
            await db.repayments.insert_one(repayment)
        
        # Create loan disbursement transaction
        transaction = {
            "user_id": user_id,
            "type": "loan_disbursement",
            "amount": loan_amount,
            "description": f"Loan disbursement - {loan['purpose']}",
            "balance_after": loan_amount,
            "loan_id": str(result.inserted_id),
            "created_at": disbursed_date
        }
        await db.transactions.insert_one(transaction)
    
    return loans

async def generate_transactions(user_id: str, count: int = 15):
    """Generate transaction history for a user"""
    balance = random.uniform(50000, 150000)
    
    for i in range(count):
        transaction_type = random.choice(["credit", "credit", "debit"])  # More credits
        amount = random.uniform(1000, 25000)
        
        if transaction_type == "credit":
            balance += amount
            descriptions = ["Salary Credit", "Bonus Credit", "Refund Credit", "Interest Credit"]
        else:
            balance -= amount
            descriptions = ["Bill Payment", "Shopping", "Transfer", "Utility Payment"]
        
        transaction = {
            "user_id": user_id,
            "type": transaction_type,
            "amount": round(amount, 2),
            "description": random.choice(descriptions),
            "balance_after": round(balance, 2),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 180))
        }
        await db.transactions.insert_one(transaction)

async def seed_database():
    """Seed database with preloaded users and their data"""
    print("Starting database seeding...")
    
    # Create indexes
    print("Creating indexes...")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone", unique=True)
    await db.loans.create_index("user_id")
    await db.transactions.create_index("user_id")
    await db.repayments.create_index("loan_id")
    await db.otps.create_index("email")
    await db.chat_history.create_index("user_id")
    
    # Seed preloaded users
    for user_data in PRELOADED_USERS:
        print(f"\nSeeding user: {user_data['name']}...")
        
        # Check if user exists
        existing = await db.users.find_one({"email": user_data["email"]})
        if existing:
            print(f"User {user_data['name']} already exists, skipping...")
            user_id = str(existing["_id"])
        else:
            # Insert user
            user_data["created_at"] = datetime.utcnow()
            result = await db.users.insert_one(user_data)
            user_id = str(result.inserted_id)
            print(f"Created user with ID: {user_id}")
        
        # Check if history already exists
        existing_loans = await db.loans.count_documents({"user_id": user_id})
        if existing_loans > 0:
            print(f"Loan history already exists for {user_data['name']}, skipping...")
            continue
        
        # Generate loan history
        print(f"Generating loan history for {user_data['name']}...")
        loans = await generate_loan_history(user_id, user_data["email"], count=2)
        print(f"Created {len(loans)} past loans")
        
        # Generate transactions
        print(f"Generating transactions for {user_data['name']}...")
        await generate_transactions(user_id, count=15)
        print(f"Created 15 transactions")
    
    print("\n" + "="*50)
    print("DATABASE SEEDING COMPLETED!")
    print("="*50)
    print("\nPreloaded Users:")
    for user in PRELOADED_USERS:
        print(f"  - {user['name']}: {user['phone']} / {user['email']}")
    print("\nThese users can login directly for testing.")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(seed_database())