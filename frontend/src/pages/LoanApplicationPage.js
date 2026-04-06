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
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('purpose', formData.purpose);
      formDataToSend.append('tenure_months', formData.tenure_months);
      formDataToSend.append('employment_type', formData.employment_type);
      formDataToSend.append('monthly_income', formData.monthly_income);
      formDataToSend.append('existing_loans', formData.existing_loans);
      
      if (salarySlip) {
        formDataToSend.append('salary_slip', salarySlip);
      }

      const { data } = await applyLoan(formDataToSend);
      toast.success('Loan application submitted successfully!');
      navigate('/loans');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto" data-testid="loan-application-page">
      <div className="mb-6">
        <h1 className="text-4xl font-heading font-light mb-2">
          Apply for a Loan
        </h1>
        <p className="text-muted-foreground">
          Our AI will analyze your application instantly
        </p>
      </div>

      <Card data-testid="loan-application-form-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendUp className="w-6 h-6 text-primary" weight="bold" />
            Loan Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Loan Purpose *
                </label>
                <Select value={formData.purpose} onValueChange={(val) => handleChange('purpose', val)} required>
                  <SelectTrigger data-testid="loan-purpose-select">
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
                <label className="block text-sm font-medium mb-2">
                  Tenure (Months) *
                </label>
                <Select value={formData.tenure_months} onValueChange={(val) => handleChange('tenure_months', val)} required>
                  <SelectTrigger data-testid="loan-tenure-select">
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
                <label className="block text-sm font-medium mb-2">
                  Employment Type *
                </label>
                <Select value={formData.employment_type} onValueChange={(val) => handleChange('employment_type', val)} required>
                  <SelectTrigger data-testid="employment-type-select">
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
                <label className="block text-sm font-medium mb-2">
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
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
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Upload Salary Slip (Optional) - AI will verify via OCR
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-smooth">
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
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Calculator className="w-12 h-12 text-muted-foreground" />
                    {salarySlipPreview ? (
                      <div className="mt-2">
                        <p className="text-sm text-success font-medium mb-2">✓ File uploaded</p>
                        {salarySlip?.name && (
                          <p className="text-xs text-muted-foreground">{salarySlip.name}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Click to upload salary slip</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or PDF (Max 5MB)</p>
                      </>
                    )}
                  </label>
                </div>
                {salarySlipPreview && (
                  <p className="text-xs text-muted-foreground mt-2">
                    AI will automatically verify your salary details using OCR technology
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={loading}
                data-testid="submit-loan-button"
              >
                {loading ? 'Processing...' : 'Submit Application'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/dashboard')}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6" data-testid="loan-info-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Submit your loan application with required details</li>
            <li>Our AI agents analyze your financial profile instantly</li>
            <li>Credit score is calculated based on multiple factors</li>
            <li>Underwriting agent reviews and approves your loan</li>
            <li>Get instant decision with customized EMI plan</li>
            <li>Chat with our AI assistant for any questions or negotiations</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanApplicationPage;