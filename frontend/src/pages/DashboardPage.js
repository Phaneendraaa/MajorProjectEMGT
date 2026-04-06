import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboard } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Wallet, 
  TrendUp, 
  Receipt, 
  CreditCard,
  ChartLine,
  CheckCircle,
  Clock
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await getDashboard();
      setDashboardData(data);
    } catch (err) {
      toast.error('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="dashboard-loading">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const { 
    account_balance, 
    credit_score,
    active_loans,
    past_loans,
    recent_transactions,
    upcoming_emis,
    total_loan_amount,
    total_emi_pending
  } = dashboardData || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's your financial overview
        </p>
      </div>

      {/* Stats Grid - Minimal Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-smooth" data-testid="account-balance-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-purple-500" weight="fill" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">
            Total Balance
          </p>
          <p className="text-3xl font-bold text-foreground">
            ₹{account_balance?.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Available funds</p>
        </div>

        {/* Credit Score Card */}
        <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-smooth" data-testid="credit-score-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <ChartLine className="h-6 w-6 text-green-500" weight="bold" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">
            Credit Score
          </p>
          <p className="text-3xl font-bold text-green-500">
            {credit_score || 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {credit_score >= 750 ? 'Excellent' : credit_score >= 650 ? 'Good' : 'Fair'}
          </p>
        </div>

        {/* Active Loans Card */}
        <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-smooth" data-testid="active-loans-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-blue-500" weight="fill" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">
            Active Loans
          </p>
          <p className="text-3xl font-bold text-foreground">
            {active_loans?.length || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            ₹{total_loan_amount?.toLocaleString('en-IN')} total
          </p>
        </div>

        {/* Next EMI Card */}
        <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-smooth" data-testid="upcoming-emi-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-500" weight="fill" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">
            Next EMI
          </p>
          <p className="text-3xl font-bold text-foreground">
            ₹{upcoming_emis?.[0]?.amount?.toLocaleString('en-IN') || '0'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {upcoming_emis?.[0] ? new Date(upcoming_emis[0].due_date).toLocaleDateString() : 'No pending EMI'}
          </p>
        </div>
      </div>

      {/* Quick Actions - Minimal */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => navigate('/apply')}
            data-testid="apply-loan-button"
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-5 rounded-xl font-medium transition-smooth"
          >
            <TrendUp className="mr-2 w-5 h-5" weight="bold" />
            Apply for Loan
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/loans')}
            data-testid="view-loans-button"
            className="border-2 px-6 py-5 rounded-xl font-medium transition-smooth"
          >
            <Receipt className="mr-2 w-5 h-5" />
            View All Loans
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/chat')}
            data-testid="chat-assistant-button"
            className="border-2 px-6 py-5 rounded-xl font-medium transition-smooth"
          >
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/6410e99b2c0f1e05ee693f795dbd10e96bde9208795e8b9ffb8cbb277abfba2f.png"
              alt="AI"
              className="w-5 h-5 mr-2"
            />
            Chat with AI
          </Button>
        </div>
      </div>

      {/* Active Loans */}
      {active_loans && active_loans.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6" data-testid="active-loans-section">
          <h2 className="text-xl font-bold mb-4">Active Loans</h2>
          <div className="space-y-3">
            {active_loans.map((loan, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-smooth"
                data-testid={`active-loan-${idx}`}
              >
                <div>
                  <p className="font-medium text-foreground">{loan.purpose}</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{loan.approved_amount?.toLocaleString('en-IN')} • {loan.tenure_months} months
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    ₹{loan.emi_amount?.toLocaleString('en-IN')}/mo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {loan.status === 'disbursed' ? 'Active' : 'Processing'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recent_transactions && recent_transactions.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6" data-testid="recent-transactions-section">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {recent_transactions.slice(0, 5).map((txn, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between pb-3 border-b border-border last:border-0"
                data-testid={`transaction-${idx}`}
              >
                <div className="flex items-center gap-3">
                  {txn.type === 'credit' || txn.type === 'loan_disbursement' ? (
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <TrendUp className="text-green-500 w-5 h-5" weight="bold" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Receipt className="text-red-500 w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm text-foreground">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  txn.type === 'credit' || txn.type === 'loan_disbursement' 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {txn.type === 'credit' || txn.type === 'loan_disbursement' ? '+' : '-'}
                  ₹{txn.amount?.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Loans Summary */}
      {past_loans && past_loans.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6" data-testid="past-loans-section">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-green-500 w-6 h-6" weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Loan History</h3>
              <p className="text-muted-foreground">
                You have successfully completed <span className="font-bold text-green-500">{past_loans.length}</span> loans with us.
                This reflects positively on your credit profile.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
