import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CreditCard, ArrowRight, Star } from '@phosphor-icons/react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const data = await sendOTP(phone);
      setEmail(data.email);
      setStep('otp');
      toast.success('OTP sent to your registered email');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(email, otp);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/d2effbc066ebe8a7a25226e9d01e2e8a14791f77453b778b6cfaf0229eef2eac.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/41cfd2866828185eabb9bbe5a0d8ea17e90186b34883da31fcf4d07dc3b6a698.png"
              alt="NBFC Bank Logo"
              className="h-16 w-16"
            />
          </div>
          <h1 className="text-4xl font-heading font-light text-white mb-2">
            NBFC Bank
          </h1>
          <p className="text-slate-300 text-base">
            Intelligent Lending, Powered by AI
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-border shadow-2xl" data-testid="login-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="w-6 h-6 text-primary" />
              {step === 'phone' ? 'Sign In' : 'Verify OTP'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-4" data-testid="phone-form">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    required
                    data-testid="phone-input"
                    className="text-base"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                  data-testid="send-otp-button"
                >
                  {loading ? (
                    'Sending...'
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-2" weight="bold" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4" data-testid="otp-form">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter OTP sent to {email}
                  </label>
                  <Input
                    type="text"
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    data-testid="otp-input"
                    className="text-base text-center text-2xl tracking-widest"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                  data-testid="verify-otp-button"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('phone')}
                  data-testid="back-button"
                >
                  Back to Phone
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-border" data-testid="demo-credentials-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <Star className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" weight="fill" />
              <div>
                <p className="text-sm font-medium mb-2">Demo Users (Test Login)</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 9121647597 (Vamshi Joshi)</p>
                  <p>• 9063454476 (Naga Phaneendra)</p>
                  <p>• 9398123664 (Ram Charan M)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;