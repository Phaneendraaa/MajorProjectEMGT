import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLoanStatus } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowRight,
  TrendUp,
  FileText,
  CreditCard,
  Sparkle
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const LoanStatusPage = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loanId) {
      loadLoanStatus();
    }
  }, [loanId]);

  const loadLoanStatus = async () => {
    try {
      const { data } = await getLoanStatus(loanId);
      setLoan(data.loan);
    } catch (err) {
      toast.error('Failed to load loan status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Loan not found</p>
        <Button onClick={() => navigate('/loans')}>View All Loans</Button>
      </div>
    );
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { color: 'bg-blue-500', text: 'Pending Review', icon: Clock },
      under_review: { color: 'bg-purple-500', text: 'Under Review', icon: FileText },
      approved: { color: 'bg-green-500', text: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-500', text: 'Rejected', icon: XCircle },
      disbursed: { color: 'bg-green-500', text: 'Disbursed', icon: CreditCard },
      closed: { color: 'bg-gray-500', text: 'Closed', icon: CheckCircle }
    };
    return statusMap[status] || statusMap.pending;
  };

  const statusInfo = getStatusInfo(loan.status);
  const StatusIcon = statusInfo.icon;

  // Process steps
  const steps = [
    {
      name: 'Application Submitted',
      completed: true,
      icon: FileText,
      description: 'Your loan application has been submitted'
    },
    {
      name: 'Document Verification',
      completed: loan.status !== 'pending',
      icon: Sparkle,
      description: 'AI verifying your documents and salary slip'
    },
    {
      name: 'Credit Assessment',
      completed: loan.status !== 'pending' && loan.status !== 'under_review',
      icon: TrendUp,
      description: `Credit score: ${loan.credit_score || 'Calculating...'}`
    },
    {
      name: 'Approval Decision',
      completed: ['approved', 'disbursed', 'rejected', 'closed'].includes(loan.status),
      icon: CheckCircle,
      description: loan.underwriting_notes || 'Underwriting in progress'
    },
    {
      name: 'Loan Disbursement',
      completed: ['disbursed', 'closed'].includes(loan.status),
      icon: CreditCard,
      description: loan.status === 'disbursed' || loan.status === 'closed' ? 'Funds transferred' : 'Awaiting disbursement'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          onClick={() => navigate('/loans')}
          className="mb-4"
        >
          ← Back to Loans
        </Button>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Loan Application Status
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your loan application progress
        </p>
      </div>

      {/* Status Overview */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Current Status</p>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${statusInfo.color} flex items-center justify-center`}>
                <StatusIcon className="w-6 h-6 text-white" weight="fill" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{statusInfo.text}</h2>
                <p className="text-sm text-muted-foreground">
                  Applied on {new Date(loan.applied_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Loan Amount</p>
            <p className="text-3xl font-bold text-foreground">₹{loan.amount?.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Approved Amount</p>
            <p className="text-lg font-semibold text-foreground">
              {loan.approved_amount ? `₹${loan.approved_amount.toLocaleString('en-IN')}` : 'Pending'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">EMI / Month</p>
            <p className="text-lg font-semibold text-foreground">
              {loan.emi_amount ? `₹${loan.emi_amount.toLocaleString('en-IN')}` : 'Calculating...'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Interest Rate</p>
            <p className="text-lg font-semibold text-foreground">
              {loan.interest_rate ? `${loan.interest_rate}%` : 'Pending'}
            </p>
          </div>
        </div>
      </div>

      {/* Process Timeline */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <h3 className="text-xl font-bold text-foreground mb-6">Application Progress</h3>
        <div className="space-y-6">
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    step.completed ? 'bg-green-500' : 'bg-muted'
                  }`}>
                    <StepIcon className={`w-6 h-6 ${step.completed ? 'text-white' : 'text-muted-foreground'}`} weight={step.completed ? 'fill' : 'regular'} />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 h-12 ${step.completed ? 'bg-green-500' : 'bg-muted'}`}></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{step.name}</h4>
                    {step.completed && (
                      <Badge variant="default" className="bg-green-500 text-white">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loan Details */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <h3 className="text-xl font-bold text-foreground mb-6">Loan Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Purpose</p>
            <p className="text-base font-medium text-foreground">{loan.purpose}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tenure</p>
            <p className="text-base font-medium text-foreground">{loan.tenure_months} months</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Employment Type</p>
            <p className="text-base font-medium text-foreground capitalize">{loan.employment_type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Monthly Income</p>
            <p className="text-base font-medium text-foreground">₹{loan.monthly_income?.toLocaleString('en-IN')}</p>
          </div>
          {loan.credit_score && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Credit Score</p>
              <p className="text-base font-medium text-green-500">{loan.credit_score}</p>
            </div>
          )}
          {loan.risk_level && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
              <Badge variant="outline" className="capitalize">{loan.risk_level}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      {loan.ai_decision && (
        <div className="bg-card border border-border rounded-2xl p-8">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkle className="w-6 h-6 text-purple-500" weight="fill" />
            AI Analysis
          </h3>
          <div className="space-y-4">
            {loan.ai_decision.underwriting_decision && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Decision Reason</p>
                <p className="text-base text-foreground">{loan.ai_decision.underwriting_decision.reason}</p>
                {loan.ai_decision.underwriting_decision.conditions && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">Conditions</p>
                    <ul className="list-disc list-inside space-y-1">
                      {loan.ai_decision.underwriting_decision.conditions.map((condition, idx) => (
                        <li key={idx} className="text-sm text-foreground">{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        {loan.status === 'approved' && (
          <Button 
            onClick={() => navigate('/chat')}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            Chat with AI to Negotiate
          </Button>
        )}
        {loan.status === 'rejected' && (
          <Button 
            onClick={() => navigate('/apply')}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            Apply Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default LoanStatusPage;
