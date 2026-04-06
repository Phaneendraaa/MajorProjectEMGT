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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-heading font-light mb-2">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Here's your financial overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient-card card-glow hover:-translate-y-1 transition-smooth overflow-hidden relative" data-testid="account-balance-card">
          <div className="absolute top-0 right-0 w-32 h-32 gradient-purple opacity-20 blur-3xl rounded-full"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl gradient-purple flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" weight="fill" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 uppercase tracking-wider font-medium">
              Total Balance
            </p>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              ₹{account_balance?.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Available funds
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card card-glow hover:-translate-y-1 transition-smooth overflow-hidden relative" data-testid="credit-score-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 opacity-20 blur-3xl rounded-full"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <ChartLine className="h-6 w-6 text-white" weight="bold" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 uppercase tracking-wider font-medium">
              Credit Score
            </p>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-success">
              {credit_score || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {credit_score >= 750 ? 'Excellent' : credit_score >= 650 ? 'Good' : 'Fair'}
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card card-glow hover:-translate-y-1 transition-smooth overflow-hidden relative" data-testid="active-loans-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" weight="fill" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 uppercase tracking-wider font-medium">
              Active Loans
            </p>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-foreground">
              {active_loans?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ₹{total_loan_amount?.toLocaleString('en-IN')} total
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card card-glow hover:-translate-y-1 transition-smooth overflow-hidden relative" data-testid="upcoming-emi-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-20 blur-3xl rounded-full"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" weight="fill" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 uppercase tracking-wider font-medium">
              Next EMI
            </p>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-foreground">
              ₹{upcoming_emis?.[0]?.amount?.toLocaleString('en-IN') || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {upcoming_emis?.[0] ? new Date(upcoming_emis[0].due_date).toLocaleDateString() : 'No pending EMI'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="gradient-card card-glow" data-testid="quick-actions-card">
        <CardHeader>
          <CardTitle className="text-2xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => navigate('/apply')}
              data-testid="apply-loan-button"
              className="gradient-purple hover:opacity-90 transition-smooth px-6 py-6 text-base font-semibold rounded-2xl shadow-lg"
            >
              <TrendUp className="mr-2 w-5 h-5" weight="bold" />
              Apply for Loan
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/loans')}
              data-testid="view-loans-button"
              className="border-2 border-primary/30 hover:border-primary hover:bg-primary/5 px-6 py-6 text-base rounded-2xl transition-smooth"
            >
              <Receipt className="mr-2 w-5 h-5" />
              View All Loans
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/chat')}
              data-testid="chat-assistant-button"
              className="border-2 border-secondary/30 hover:border-secondary hover:bg-secondary/5 px-6 py-6 text-base rounded-2xl transition-smooth"
            >
              <img 
                src="https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/6410e99b2c0f1e05ee693f795dbd10e96bde9208795e8b9ffb8cbb277abfba2f.png"
                alt="AI"
                className="w-5 h-5 mr-2"
              />
              Chat with AI Assistant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Loans */}
      {active_loans && active_loans.length > 0 && (
        <Card data-testid="active-loans-section">
          <CardHeader>
            <CardTitle>Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {active_loans.map((loan, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-muted/50 transition-smooth"
                  data-testid={`active-loan-${idx}`}
                >
                  <div>
                    <p className="font-medium">{loan.purpose}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{loan.approved_amount?.toLocaleString('en-IN')} • {loan.tenure_months} months
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">
                      ₹{loan.emi_amount?.toLocaleString('en-IN')}/mo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {loan.status === 'disbursed' ? 'Active' : 'Processing'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {recent_transactions && recent_transactions.length > 0 && (
        <Card data-testid="recent-transactions-section">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent_transactions.slice(0, 5).map((txn, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                  data-testid={`transaction-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    {txn.type === 'credit' || txn.type === 'loan_disbursement' ? (
                      <TrendUp className="text-success" weight="bold" />
                    ) : (
                      <Receipt className="text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`font-medium ${
                    txn.type === 'credit' || txn.type === 'loan_disbursement' 
                      ? 'text-success' 
                      : 'text-destructive'
                  }`}>
                    {txn.type === 'credit' || txn.type === 'loan_disbursement' ? '+' : '-'}
                    ₹{txn.amount?.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
            <Button 
              variant="link" 
              className="w-full mt-4"
              onClick={() => navigate('/transactions')}
              data-testid="view-all-transactions-button"
            >
              View All Transactions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Past Loans Summary */}
      {past_loans && past_loans.length > 0 && (
        <Card data-testid="past-loans-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="text-success" weight="fill" />
              Loan History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You have successfully completed <span className="font-bold text-success">{past_loans.length}</span> loans with us.
              This reflects positively on your credit profile.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
