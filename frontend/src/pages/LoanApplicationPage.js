import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyLoan } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { TrendUp, Calculator } from '@phosphor-icons/react';

const LoanApplicationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    tenure_months: '',
    employment_type: '',
    monthly_income: '',
    existing_loans: '0'
  });
  const [salarySlip, setSalarySlip] = useState(null);
  const [salarySlipPreview, setSalarySlipPreview] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSalarySlip(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSalarySlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!');
    
    // Validation
    if (!formData.amount || !formData.purpose || !formData.tenure_months || 
        !formData.employment_type || !formData.monthly_income) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    console.log('Form data:', formData);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('purpose', formData.purpose);
      formDataToSend.append('tenure_months', formData.tenure_months);
      formDataToSend.append('employment_type', formData.employment_type);
      formDataToSend.append('monthly_income', formData.monthly_income);
      formDataToSend.append('existing_loans', formData.existing_loans || '0');
      
      if (salarySlip) {
        console.log('Attaching salary slip:', salarySlip.name);
        formDataToSend.append('salary_slip', salarySlip);
      }

      console.log('Sending loan application...');
      toast.info('Processing your application with AI...');
      
      const { data } = await applyLoan(formDataToSend);
      console.log('Loan application response:', data);
      
      // Show success with AI decision
      const decision = data.ai_analysis?.underwriting_decision?.decision || data.loan?.status || 'submitted';
      toast.success(`Loan ${decision}! Redirecting to status page...`);
      
      // Navigate to loan status page
      setTimeout(() => {
        const loanId = data.loan?.loan_id || data.loan?._id;
        if (loanId) {
          console.log('Navigating to loan status:', loanId);
          navigate(`/loan/${loanId}`);
        } else {
          console.log('No loan ID, navigating to loans page');
          navigate('/loans');
        }
      }, 2000);
    } catch (err) {
      console.error('Loan application error:', err);
      console.error('Error details:', err.response?.data);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to submit application. Please try again.';
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="loan-application-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Apply for a Loan
        </h1>
        <p className="text-muted-foreground text-lg">
          Our AI will analyze your application instantly
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8" data-testid="loan-application-form-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Loan Amount *
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                required
                min="10000"
                max="10000000"
                data-testid="loan-amount-input"
                className="h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Loan Purpose *
              </label>
              <Select value={formData.purpose} onValueChange={(val) => handleChange('purpose', val)} required>
                <SelectTrigger data-testid="loan-purpose-select" className="h-12">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Home Renovation">Home Renovation</SelectItem>
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Tenure (Months) *
              </label>
              <Select value={formData.tenure_months} onValueChange={(val) => handleChange('tenure_months', val)} required>
                <SelectTrigger data-testid="loan-tenure-select" className="h-12">
                  <SelectValue placeholder="Select tenure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="18">18 Months</SelectItem>
                  <SelectItem value="24">24 Months</SelectItem>
                  <SelectItem value="36">36 Months</SelectItem>
                  <SelectItem value="48">48 Months</SelectItem>
                  <SelectItem value="60">60 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Employment Type *
              </label>
              <Select value={formData.employment_type} onValueChange={(val) => handleChange('employment_type', val)} required>
                <SelectTrigger data-testid="employment-type-select" className="h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salaried">Salaried</SelectItem>
                  <SelectItem value="self-employed">Self Employed</SelectItem>
                  <SelectItem value="business">Business Owner</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Monthly Income *
              </label>
              <Input
                type="number"
                placeholder="Enter monthly income"
                value={formData.monthly_income}
                onChange={(e) => handleChange('monthly_income', e.target.value)}
                required
                min="15000"
                data-testid="monthly-income-input"
                className="h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Existing Loans
              </label>
              <Input
                type="number"
                placeholder="Number of existing loans"
                value={formData.existing_loans}
                onChange={(e) => handleChange('existing_loans', e.target.value)}
                min="0"
                max="10"
                data-testid="existing-loans-input"
                className="h-12"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-foreground">
                Upload Salary Slip (Optional) - AI will verify via OCR
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-purple-500 transition-smooth bg-muted/30">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="salary-slip-upload"
                  data-testid="salary-slip-input"
                />
                <label 
                  htmlFor="salary-slip-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Calculator className="w-8 h-8 text-purple-500" />
                  </div>
                  {salarySlipPreview ? (
                    <div>
                      <p className="text-sm text-green-500 font-medium mb-1">✓ File uploaded</p>
                      {salarySlip?.name && (
                        <p className="text-xs text-muted-foreground">{salarySlip.name}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-foreground font-medium">Click to upload salary slip</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or PDF (Max 5MB)</p>
                    </>
                  )}
                </label>
              </div>
              {salarySlipPreview && (
                <p className="text-xs text-muted-foreground mt-2">
                  ✨ AI will automatically verify your salary details using OCR technology
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white h-12 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading}
              data-testid="submit-loan-button"
              onClick={(e) => {
                console.log('Button clicked!');
                console.log('Form data at click:', formData);
              }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Processing with AI...</span>
                </div>
              ) : (
                'Submit Application'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/dashboard')}
              data-testid="cancel-button"
              className="h-12 rounded-xl"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mt-6" data-testid="loan-info-card">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-purple-500" />
          How It Works
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Submit your loan application with required details</li>
          <li>Our AI agents analyze your financial profile instantly</li>
          <li>Credit score is calculated based on multiple factors</li>
          <li>Underwriting agent reviews and approves your loan</li>
          <li>Get instant decision with customized EMI plan</li>
          <li>Chat with our AI assistant for any questions</li>
        </ol>
      </div>
    </div>
  );
};

export default LoanApplicationPage;