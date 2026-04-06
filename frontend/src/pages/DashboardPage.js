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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover" data-testid="account-balance-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-[0.2em]">
              Account Balance
            </CardTitle>
            <Wallet className="h-5 w-5 text-primary" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ₹{account_balance?.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available funds
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="credit-score-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-[0.2em]">
              Credit Score
            </CardTitle>
            <ChartLine className="h-5 w-5 text-success" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {credit_score || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {credit_score >= 750 ? 'Excellent' : credit_score >= 650 ? 'Good' : 'Fair'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="active-loans-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-[0.2em]">
              Active Loans
            </CardTitle>
            <CreditCard className="h-5 w-5 text-accent" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {active_loans?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{total_loan_amount?.toLocaleString('en-IN')} total
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="upcoming-emi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-[0.2em]">
              Upcoming EMI
            </CardTitle>
            <Clock className="h-5 w-5 text-warning" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              ₹{upcoming_emis?.[0]?.amount?.toLocaleString('en-IN') || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {upcoming_emis?.[0] ? new Date(upcoming_emis[0].due_date).toLocaleDateString() : 'No pending EMI'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-testid="quick-actions-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => navigate('/apply')}
              data-testid="apply-loan-button"
            >
              <TrendUp className="mr-2" weight="bold" />
              Apply for Loan
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/loans')}
              data-testid="view-loans-button"
            >
              <Receipt className="mr-2" />
              View All Loans
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/chat')}
              data-testid="chat-assistant-button"
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
