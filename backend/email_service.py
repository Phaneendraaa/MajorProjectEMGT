import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
from datetime import datetime, timedelta

async def send_email(to_email: str, subject: str, html_content: str):
    """Send email using Gmail SMTP"""
    message = MIMEMultipart("alternative")
    message["From"] = os.environ["EMAIL_FROM"]
    message["To"] = to_email
    message["Subject"] = subject
    
    html_part = MIMEText(html_content, "html")
    message.attach(html_part)
    
    try:
        await aiosmtplib.send(
            message,
            hostname=os.environ["EMAIL_HOST"],
            port=int(os.environ["EMAIL_PORT"]),
            username=os.environ["EMAIL_USER"],
            password=os.environ["EMAIL_PASSWORD"],
            start_tls=True
        )
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

async def send_otp_email(to_email: str, otp: str):
    """Send OTP email"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Manrope', Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
            .logo {{ text-align: center; margin-bottom: 30px; }}
            .title {{ color: #1E3A8A; font-size: 24px; font-weight: 600; margin-bottom: 20px; }}
            .otp-box {{ background-color: #F1F5F9; border-left: 4px solid #1E3A8A; padding: 20px; margin: 20px 0; font-size: 32px; font-weight: bold; color: #1E3A8A; text-align: center; letter-spacing: 8px; }}
            .message {{ color: #64748B; line-height: 1.6; margin-bottom: 20px; }}
            .footer {{ color: #94A3B8; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1 style="color: #1E3A8A; margin: 0;">NBFC Bank</h1>
            </div>
            <h2 class="title">Your One-Time Password</h2>
            <p class="message">Please use the following OTP to complete your authentication. This code will expire in 10 minutes.</p>
            <div class="otp-box">{otp}</div>
            <p class="message">If you didn't request this code, please ignore this email or contact our support team.</p>
            <div class="footer">
                <p>© 2024 NBFC Bank. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """
    await send_email(to_email, "Your NBFC Bank OTP", html_content)

async def send_emi_reminder(to_email: str, user_name: str, emi_amount: float, due_date: datetime):
    """Send EMI reminder email"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Manrope', Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
            .title {{ color: #1E3A8A; font-size: 24px; font-weight: 600; margin-bottom: 20px; }}
            .alert-box {{ background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; }}
            .amount {{ font-size: 28px; font-weight: bold; color: #1E3A8A; margin: 10px 0; }}
            .message {{ color: #64748B; line-height: 1.6; margin-bottom: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2 class="title">EMI Payment Reminder</h2>
            <p class="message">Dear {user_name},</p>
            <div class="alert-box">
                <p style="margin: 0; color: #92400E; font-weight: 600;">Your EMI is due soon!</p>
                <div class="amount">₹{emi_amount:,.2f}</div>
                <p style="margin: 0; color: #92400E;">Due Date: {due_date.strftime('%d %B %Y')}</p>
            </div>
            <p class="message">Please ensure sufficient balance in your account to avoid late payment charges.</p>
        </div>
    </body>
    </html>
    """
    await send_email(to_email, "EMI Payment Reminder - NBFC Bank", html_content)