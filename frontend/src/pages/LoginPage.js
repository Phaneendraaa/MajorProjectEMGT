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
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #1e1b4b 50%, #312e81 100%)'
      }}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-pink-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl gradient-purple flex items-center justify-center shadow-2xl">
              <img 
                src="https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/41cfd2866828185eabb9bbe5a0d8ea17e90186b34883da31fcf4d07dc3b6a698.png"
                alt="NBFC Bank Logo"
                className="h-12 w-12"
              />
            </div>
          </div>
          <h1 className="text-5xl font-heading font-bold text-white mb-3">
            NBFC Bank
          </h1>
          <p className="text-slate-300 text-lg">
            AI-Powered Smart Lending
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-white/10 dark:bg-slate-900/40 border-white/20 shadow-2xl card-glow" data-testid="login-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-white">
              <CreditCard className="w-6 h-6 text-purple-400" />
              {step === 'phone' ? 'Sign In' : 'Verify OTP'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-4" data-testid="phone-form">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-200">
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
                    className="text-base bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-400"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-purple hover:opacity-90 transition-smooth py-6 text-lg font-semibold rounded-xl shadow-lg" 
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
                  <label className="block text-sm font-medium mb-2 text-slate-200">
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
                    className="text-base text-center text-2xl tracking-widest bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-400"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gradient-purple hover:opacity-90 transition-smooth py-6 text-lg font-semibold rounded-xl shadow-lg" 
                  disabled={loading}
                  data-testid="verify-otp-button"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-300 hover:text-white hover:bg-white/5"
                  onClick={() => setStep('phone')}
                  data-testid="back-button"
                >
                  Back to Phone
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4 backdrop-blur-xl bg-white/10 dark:bg-slate-900/40 border-white/20" data-testid="demo-credentials-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" weight="fill" />
              <div>
                <p className="text-sm font-medium mb-2 text-white">Demo Users (Test Login)</p>
                <div className="text-xs text-slate-300 space-y-1">
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