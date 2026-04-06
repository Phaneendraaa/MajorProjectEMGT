require('dotenv').config();
const mongoose = require('mongoose');
const { User, Loan, Transaction, Repayment } = require('./models');

const PRELOADED_USERS = [
  {
    name: 'Vamshi Joshi',
    phone: '9121647597',
    email: 'vamshijoshi25@gmail.com',
    aadhar: '1234-5678-9001',
    pan: 'ABCDE1234F',
    address: 'Plot 123, Hitech City, Hyderabad, Telangana - 500081',
    nominee_name: 'Priya Joshi',
    nominee_relation: 'Spouse',
    parent_name: 'Ramesh Joshi',
    parent_phone: '9876543210',
    account_balance: 125000,
    credit_score: 750,
    is_verified: true
  },
  {
    name: 'Naga Phaneendra',
    phone: '9063454476',
    email: 'nagaphaneendrapuranam@gmail.com',
    aadhar: '2345-6789-0012',
    pan: 'BCDEF2345G',
    address: 'Flat 45, Gachibowli, Hyderabad, Telangana - 500032',
    nominee_name: 'Lakshmi Puranam',
    nominee_relation: 'Mother',
    parent_name: 'Venkat Puranam',
    parent_phone: '9876543211',
    account_balance: 98000,
    credit_score: 720,
    is_verified: true
  },
  {
    name: 'Ram Charan M',
    phone: '9398123664',
    email: 'cgoud129@gmail.com',
    aadhar: '3456-7890-0123',
    pan: 'CDEFG3456H',
    address: 'House 78, Madhapur, Hyderabad, Telangana - 500033',
    nominee_name: 'Sita Charan',
    nominee_relation: 'Sister',
    parent_name: 'Krishna Charan',
    parent_phone: '9876543212',
    account_balance: 156000,
    credit_score: 780,
    is_verified: true
  }
];

async function generateLoanHistory(userId, count = 2) {
  const loans = [];
  const amounts = [50000, 75000, 100000, 150000, 200000];
  const tenures = [12, 18, 24, 36];
  const purposes = ['Personal', 'Education', 'Home Renovation', 'Medical'];

  for (let i = 0; i < count; i++) {
    const loanAmount = amounts[Math.floor(Math.random() * amounts.length)];
    const tenure = tenures[Math.floor(Math.random() * tenures.length)];
    const interestRate = 8.5 + Math.random() * 4;
    
    const monthlyRate = interestRate / 12 / 100;
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / 
                 (Math.pow(1 + monthlyRate, tenure) - 1);

    const appliedDate = new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000);
    const approvedDate = new Date(appliedDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
    const disbursedDate = new Date(approvedDate.getTime() + 24 * 60 * 60 * 1000);

    const loan = await Loan.create({
      user_id: userId,
      amount: loanAmount,
      approved_amount: loanAmount,
      purpose: purposes[Math.floor(Math.random() * purposes.length)],
      tenure_months: tenure,
      interest_rate: interestRate,
      emi_amount: Math.round(emi),
      status: 'closed',
      credit_score: 680 + Math.floor(Math.random() * 80),
      risk_level: 'low',
      employment_type: 'salaried',
      monthly_income: 40000 + Math.floor(Math.random() * 40000),
      existing_loans: 0,
      underwriting_notes: 'Approved based on good credit history',
      applied_at: appliedDate,
      approved_at: approvedDate,
      disbursed_at: disbursedDate
    });

    loans.push(loan._id);

    // Generate repayment history
    for (let j = 1; j <= tenure; j++) {
      const dueDate = new Date(disbursedDate.getTime() + j * 30 * 24 * 60 * 60 * 1000);
      const paidDate = new Date(dueDate.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000);

      await Repayment.create({
        loan_id: loan._id,
        user_id: userId,
        emi_number: j,
        due_date: dueDate,
        amount: Math.round(emi),
        status: 'paid',
        paid_date: paidDate,
        penalty: 0
      });
    }

    // Create loan disbursement transaction
    await Transaction.create({
      user_id: userId,
      type: 'loan_disbursement',
      amount: loanAmount,
      description: `Loan disbursement - ${loan.purpose}`,
      balance_after: loanAmount,
      loan_id: loan._id,
      created_at: disbursedDate
    });
  }

  return loans;
}

async function generateTransactions(userId, count = 15) {
  const types = ['credit', 'credit', 'debit'];
  const creditDesc = ['Salary Credit', 'Bonus Credit', 'Refund Credit', 'Interest Credit'];
  const debitDesc = ['Bill Payment', 'Shopping', 'Transfer', 'Utility Payment'];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const amount = 1000 + Math.random() * 24000;
    const desc = type === 'credit' ? 
      creditDesc[Math.floor(Math.random() * creditDesc.length)] :
      debitDesc[Math.floor(Math.random() * debitDesc.length)];

    await Transaction.create({
      user_id: userId,
      type,
      amount: Math.round(amount),
      description: desc,
      balance_after: 50000 + Math.random() * 100000,
      created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
    });
  }
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: process.env.DB_NAME
    });

    console.log('\nStarting database seeding...\n');

    for (const userData of PRELOADED_USERS) {
      console.log(`Seeding user: ${userData.name}...`);

      let user = await User.findOne({ email: userData.email });
      
      if (user) {
        console.log(`  User already exists, skipping...`);
        continue;
      }

      user = await User.create(userData);
      console.log(`  ✓ Created user`);

      await generateLoanHistory(user._id, 2);
      console.log(`  ✓ Created 2 past loans`);

      await generateTransactions(user._id, 15);
      console.log(`  ✓ Created 15 transactions\n`);
    }

    console.log('='.repeat(50));
    console.log('DATABASE SEEDING COMPLETED!');
    console.log('='.repeat(50));
    console.log('\nPreloaded Users:');
    PRELOADED_USERS.forEach(u => {
      console.log(`  - ${u.name}: ${u.phone} / ${u.email}`);
    });
    console.log('\nThese users can login directly for testing.');
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
