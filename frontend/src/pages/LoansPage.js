import React, { useState, useEffect } from 'react';
import { getLoans } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Receipt } from '@phosphor-icons/react';

const LoansPage = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const { data } = await getLoans();
      setLoans(data.loans || []);
    } catch (err) {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      approved: { variant: 'default', icon: <CheckCircle weight="fill" />, label: 'Approved' },
      disbursed: { variant: 'default', icon: <CheckCircle weight="fill" />, label: 'Active' },
      pending: { variant: 'secondary', icon: <Clock weight="fill" />, label: 'Pending' },
      under_review: { variant: 'secondary', icon: <Clock weight="fill" />, label: 'Under Review' },
      rejected: { variant: 'destructive', icon: <XCircle weight="fill" />, label: 'Rejected' },
      closed: { variant: 'outline', icon: <CheckCircle weight="fill" />, label: 'Closed' }
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeLoans = loans.filter(l => ['approved', 'disbursed', 'under_review'].includes(l.status));
  const pastLoans = loans.filter(l => ['closed', 'rejected'].includes(l.status));

  return (
    <div className="space-y-6" data-testid="loans-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-light mb-2">
            My Loans
          </h1>
          <p className="text-muted-foreground">
            View and manage all your loans
          </p>
        </div>
        <Button onClick={() => navigate('/apply')} data-testid="apply-new-loan-button">
          Apply New Loan
        </Button>
      </div>

      {loans.length === 0 && (
        <Card data-testid="no-loans-card">
          <CardContent className="pt-6 text-center py-12">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" weight="duotone" />
            <p className="text-lg font-medium mb-2">No loans yet</p>
            <p className="text-muted-foreground mb-4">Apply for your first loan to get started</p>
            <Button onClick={() => navigate('/apply')} data-testid="apply-first-loan-button">
              Apply for Loan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div>
          <h2 className="text-2xl font-heading mb-4">Active Loans</h2>
          <div className="grid grid-cols-1 gap-4">
            {activeLoans.map((loan, idx) => (
              <Card key={idx} className="card-hover" data-testid={`active-loan-card-${idx}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{loan.purpose}</CardTitle>
                      {getStatusBadge(loan.status)}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Loan Amount</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{loan.approved_amount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">EMI</p>
                      <p className="font-medium">₹{loan.emi_amount?.toLocaleString('en-IN')}/mo</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Tenure</p>
                      <p className="font-medium">{loan.tenure_months} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Interest Rate</p>
                      <p className="font-medium">{loan.interest_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Risk Level</p>
                      <Badge variant="outline">{loan.risk_level || 'N/A'}</Badge>
                    </div>
                  </div>
                  {loan.credit_score && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">Credit Score at Application: <span className="font-bold text-success">{loan.credit_score}</span></p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Loans */}
      {pastLoans.length > 0 && (
        <div>
          <h2 className="text-2xl font-heading mb-4">Loan History</h2>
          <div className="grid grid-cols-1 gap-4">
            {pastLoans.map((loan, idx) => (
              <Card key={idx} className="opacity-75 hover:opacity-100 transition-smooth" data-testid={`past-loan-card-${idx}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-2">{loan.purpose}</CardTitle>
                      {getStatusBadge(loan.status)}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-muted-foreground">
                        ₹{loan.approved_amount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Applied: {new Date(loan.applied_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tenure: {loan.tenure_months} months</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">EMI: ₹{loan.emi_amount?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansPage;