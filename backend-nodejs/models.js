const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  aadhar: { type: String, required: true },
  pan: { type: String, required: true },
  address: { type: String, required: true },
  nominee_name: { type: String, required: true },
  nominee_relation: { type: String, required: true },
  parent_name: { type: String, required: true },
  parent_phone: { type: String, required: true },
  face_image: String,
  account_balance: { type: Number, default: 50000 },
  credit_score: Number,
  role: { type: String, default: 'user' },
  is_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const loanSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  approved_amount: Number,
  purpose: { type: String, required: true },
  tenure_months: { type: Number, required: true },
  interest_rate: Number,
  emi_amount: Number,
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'closed'],
    default: 'pending'
  },
  credit_score: Number,
  risk_level: String,
  employment_type: { type: String, required: true },
  monthly_income: { type: Number, required: true },
  existing_loans: { type: Number, default: 0 },
  salary_slip: String,
  salary_slip_data: Object,
  underwriting_notes: String,
  ai_decision: Object,
  applied_at: { type: Date, default: Date.now },
  approved_at: Date,
  disbursed_at: Date
});

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['credit', 'debit', 'emi_payment', 'loan_disbursement'],
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  balance_after: { type: Number, required: true },
  loan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  created_at: { type: Date, default: Date.now }
});

const repaymentSchema = new mongoose.Schema({
  loan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emi_number: { type: Number, required: true },
  due_date: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  paid_date: Date,
  penalty: { type: Number, default: 0 }
});

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expires_at: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const chatHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  message: { type: String, required: true },
  loan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
  created_at: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Loan: mongoose.model('Loan', loanSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  Repayment: mongoose.model('Repayment', repaymentSchema),
  OTP: mongoose.model('OTP', otpSchema),
  ChatHistory: mongoose.model('ChatHistory', chatHistorySchema)
};