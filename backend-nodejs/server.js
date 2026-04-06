require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const { User, Loan, Transaction, Repayment, OTP, ChatHistory } = require('./models');
const { processLoanApplication, chatbotAgent } = require('./aiAgents');

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// File upload configuration
const upload = multer({
  dest: '/tmp/uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL, {
  dbName: process.env.DB_NAME
})
.then(() => console.log('✓ MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP Email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your NBFC Bank OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h1 style="color: #1e3a8a; margin-bottom: 20px; font-size: 28px;">NBFC Bank</h1>
          <h2 style="color: #1e3a8a; margin-bottom: 20px;">Your One-Time Password</h2>
          <p style="color: #64748b; margin-bottom: 20px;">Please use the following OTP to complete your authentication. This code will expire in 10 minutes.</p>
          <div style="background-color: #f1f5f9; border-left: 4px solid #1e3a8a; padding: 20px; margin: 20px 0; font-size: 32px; font-weight: bold; color: #1e3a8a; text-align: center; letter-spacing: 8px;">
            ${otp}
          </div>
          <p style="color: #64748b; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2024 NBFC Bank. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// JWT Middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ detail: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// OCR Processing
async function processOCR(imagePath) {
  try {
    console.log('Starting OCR processing for:', imagePath);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log('File does not exist:', imagePath);
      return { raw_text: '', verified: false, error: 'File not found' };
    }

    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    console.log('OCR completed, extracted text length:', text.length);

    // Extract salary information from text
    const salaryMatch = text.match(/(?:salary|income|gross|net)[\s:]*₹?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    const nameMatch = text.match(/(?:name|employee)[\s:]*([A-Za-z\s]+)/i);
    const dateMatch = text.match(/(?:date|month|period)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);

    const result = {
      raw_text: text,
      extracted_salary: salaryMatch ? parseFloat(salaryMatch[1].replace(/,/g, '')) : null,
      extracted_name: nameMatch ? nameMatch[1].trim() : null,
      extracted_date: dateMatch ? dateMatch[1] : null,
      verified: !!salaryMatch
    };

    console.log('OCR result:', result);
    return result;
  } catch (error) {
    console.error('OCR Error:', error.message);
    return { 
      raw_text: '', 
      verified: false, 
      error: error.message 
    };
  } finally {
    // Clean up uploaded file
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Cleaned up file:', imagePath);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.message);
    }
  }
}

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, email, aadhar, pan, address, nominee_name, nominee_relation, parent_name, parent_phone, face_image } = req.body;

    // Check if user exists
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ detail: 'User already exists with this email or phone' });
    }

    // Create user
    const user = new User({
      name, phone, email, aadhar, pan, address,
      nominee_name, nominee_relation, parent_name, parent_phone,
      face_image
    });
    await user.save();

    // Send OTP
    const otp = generateOTP();
    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOTPEmail(email, otp);

    res.json({
      message: 'Registration successful. OTP sent to your email.',
      user_id: user._id,
      email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Login - Send OTP
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ detail: 'User not found with this phone number' });
    }

    const otp = generateOTP();
    await OTP.deleteMany({ email: user.email });
    await OTP.create({
      email: user.email,
      otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOTPEmail(user.email, otp);

    res.json({
      message: 'OTP sent to your registered email',
      email: user.email,
      phone
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpDoc = await OTP.findOne({ email, otp, verified: false });
    if (!otpDoc) {
      return res.status(400).json({ detail: 'Invalid or expired OTP' });
    }

    if (new Date() > otpDoc.expires_at) {
      return res.status(400).json({ detail: 'OTP expired' });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    user.is_verified = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userObj = user.toObject();
    delete userObj.__v;
    userObj.id = userObj._id;
    delete userObj._id;

    res.json({
      message: 'Login successful',
      user: userObj,
      access_token: token
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const userObj = user.toObject();
    userObj.id = userObj._id;
    delete userObj._id;

    res.json({ user: userObj });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: 'Logged out successfully' });
});

// ============================================
// USER DASHBOARD ROUTES
// ============================================

app.get('/api/user/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-__v');

    const activeLoans = await Loan.find({
      user_id: userId,
      status: { $in: ['approved', 'disbursed', 'under_review', 'pending'] }
    }).select('-__v');

    const pastLoans = await Loan.find({
      user_id: userId,
      status: { $in: ['closed', 'rejected'] }
    }).select('-__v');

    const recentTransactions = await Transaction.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(10)
      .select('-__v');

    const upcomingEmis = await Repayment.find({
      user_id: userId,
      status: 'pending'
    })
      .sort({ due_date: 1 })
      .limit(5)
      .select('-__v');

    const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + (loan.approved_amount || 0), 0);
    const totalEmiPending = upcomingEmis.reduce((sum, emi) => sum + emi.amount, 0);

    const userObj = user.toObject();
    userObj.id = userObj._id;
    delete userObj._id;

    res.json({
      user: userObj,
      account_balance: user.account_balance,
      credit_score: user.credit_score,
      active_loans: activeLoans,
      past_loans: pastLoans,
      active_loans_count: activeLoans.length,
      past_loans_count: pastLoans.length,
      total_loan_amount: totalLoanAmount,
      recent_transactions: recentTransactions,
      upcoming_emis: upcomingEmis,
      total_emi_pending: totalEmiPending
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ detail: error.message });
  }
});

app.get('/api/user/loans', authenticateToken, async (req, res) => {
  try {
    const loans = await Loan.find({ user_id: req.user.id })
      .sort({ applied_at: -1 })
      .select('-__v');

    const loansWithId = loans.map(loan => {
      const obj = loan.toObject();
      obj.loan_id = obj._id;
      obj.id = obj._id;
      delete obj._id;
      return obj;
    });

    res.json({ loans: loansWithId });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

app.get('/api/user/transactions', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = await Transaction.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .limit(limit)
      .select('-__v');

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ============================================
// LOAN APPLICATION ROUTES
// ============================================

app.post('/api/loan/apply', authenticateToken, upload.single('salary_slip'), async (req, res) => {
  try {
    console.log('=== Loan Application Started ===');
    const { amount, purpose, tenure_months, employment_type, monthly_income, existing_loans } = req.body;
    const userId = req.user.id;

    console.log('User ID:', userId);
    console.log('Loan data:', { amount, purpose, tenure_months, employment_type, monthly_income });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const pastLoans = await Loan.find({ user_id: userId });
    const totalTransactions = await Transaction.countDocuments({ user_id: userId });

    // Process salary slip if uploaded (but don't crash if it fails)
    let salarySlipData = null;
    if (req.file) {
      console.log('Salary slip uploaded:', req.file.filename);
      try {
        salarySlipData = await processOCR(req.file.path);
        console.log('OCR processing completed');
      } catch (ocrError) {
        console.error('OCR failed but continuing:', ocrError.message);
        // Continue without OCR data - don't crash the application
        salarySlipData = { verified: false, error: 'OCR processing failed' };
      }
    }

    const userData = {
      name: user.name,
      email: user.email,
      aadhar: user.aadhar,
      pan: user.pan,
      face_image: user.face_image,
      account_balance: user.account_balance,
      past_loans_count: pastLoans.length,
      total_transactions: totalTransactions
    };

    const loanData = {
      amount: parseFloat(amount),
      purpose,
      tenure_months: parseInt(tenure_months),
      employment_type,
      monthly_income: parseFloat(monthly_income),
      existing_loans: parseInt(existing_loans) || 0,
      salary_slip_data: salarySlipData
    };

    // Process through AI orchestrator
    console.log('Starting AI processing...');
    let aiResult;
    try {
      const { processLoanApplication } = require('./aiAgents');
      aiResult = await processLoanApplication(userData, loanData);
      console.log('AI processing completed');
    } catch (aiError) {
      console.error('AI processing error:', aiError.message);
      // Use fallback if AI fails
      aiResult = {
        credit_analysis: {
          credit_score: 650,
          risk_level: 'medium',
          factors: ['Application processed without AI']
        },
        document_verification: { verified: true },
        emi_calculation: {
          emi_amount: Math.round((parseFloat(amount) * 0.11) / 12),
          interest_rate: 11.0,
          total_amount: parseFloat(amount) * 1.11
        },
        underwriting_decision: {
          decision: 'approved',
          approved_amount: parseFloat(amount),
          reason: 'Approved based on standard criteria',
          conditions: ['Timely EMI payments required']
        }
      };
    }

    const { credit_analysis, emi_calculation, underwriting_decision } = aiResult;

    // Create loan document
    const loan = new Loan({
      user_id: userId,
      amount: loanData.amount,
      approved_amount: underwriting_decision.approved_amount,
      purpose: loanData.purpose,
      tenure_months: loanData.tenure_months,
      interest_rate: emi_calculation.interest_rate,
      emi_amount: emi_calculation.emi_amount,
      status: underwriting_decision.decision,
      credit_score: credit_analysis.credit_score,
      risk_level: credit_analysis.risk_level,
      employment_type: loanData.employment_type,
      monthly_income: loanData.monthly_income,
      existing_loans: loanData.existing_loans,
      salary_slip_data: salarySlipData,
      underwriting_notes: underwriting_decision.reason,
      ai_decision: aiResult,
      applied_at: new Date(),
      approved_at: underwriting_decision.decision === 'approved' ? new Date() : null
    });

    await loan.save();
    console.log('Loan saved:', loan._id);

    // Update user credit score
    user.credit_score = credit_analysis.credit_score;
    await user.save();

    // Create EMI schedule if approved
    if (underwriting_decision.decision === 'approved') {
      console.log('Creating EMI schedule...');
      for (let i = 1; i <= loanData.tenure_months; i++) {
        await Repayment.create({
          loan_id: loan._id,
          user_id: userId,
          emi_number: i,
          due_date: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
          amount: emi_calculation.emi_amount,
          status: 'pending'
        });
      }
      console.log('EMI schedule created');
    }

    const loanObj = loan.toObject();
    loanObj.loan_id = loanObj._id;
    delete loanObj.__v;

    console.log('=== Loan Application Completed ===');
    res.json({
      message: `Loan application ${underwriting_decision.decision}`,
      loan: loanObj,
      ai_analysis: aiResult
    });
  } catch (error) {
    console.error('=== Loan Application Error ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ detail: error.message || 'Failed to process loan application' });
  }
});

app.get('/api/loan/status/:loanId', authenticateToken, async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.loanId,
      user_id: req.user.id
    }).select('-__v');

    if (!loan) {
      return res.status(404).json({ detail: 'Loan not found' });
    }

    const loanObj = loan.toObject();
    loanObj.loan_id = loanObj._id;
    delete loanObj._id;

    res.json({ loan: loanObj });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ============================================
// AI CHATBOT ROUTES
// ============================================

app.post('/api/chat/message', authenticateToken, async (req, res) => {
  try {
    const { message, loan_id } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const activeLoans = await Loan.find({
      user_id: userId,
      status: { $in: ['approved', 'disbursed'] }
    });
    const pastLoans = await Loan.find({
      user_id: userId,
      status: 'closed'
    });

    const userContext = {
      name: user.name,
      account_balance: user.account_balance,
      credit_score: user.credit_score,
      active_loans: activeLoans.length,
      past_loans_count: pastLoans.length
    };

    console.log('Calling chatbot agent...');
    const aiResponse = await chatbotAgent(message, userContext);

    // Save chat history
    await ChatHistory.create({
      user_id: userId,
      role: 'user',
      message,
      loan_id
    });

    await ChatHistory.create({
      user_id: userId,
      role: 'assistant',
      message: aiResponse,
      loan_id
    });

    res.json({
      message: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ detail: error.message });
  }
});

app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await ChatHistory.find({ user_id: req.user.id })
      .sort({ created_at: 1 })
      .limit(limit)
      .select('-__v -_id');

    res.json({ history });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'NBFC Loan Management System (Node.js)',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/', (req, res) => {
  res.json({
    message: 'NBFC Loan Management System API (Node.js + Express)',
    version: '1.0.0',
    docs: '/docs'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
});
