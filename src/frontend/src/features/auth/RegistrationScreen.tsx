import { useState } from 'react';
import { useRegisterUser, useSaveCallerUserProfile, useGetCallerUserProfile } from './authApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { safeErrorMessage } from '../partyPayments/components/safeErrorMessage';

export function RegistrationScreen() {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'register' | 'profile' | 'complete'>('register');
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useRegisterUser();
  const saveProfileMutation = useSaveCallerUserProfile();
  const { refetch: refetchProfile } = useGetCallerUserProfile();

  const handleRegister = async () => {
    setError(null);
    try {
      await registerMutation.mutateAsync();
      setStep('profile');
    } catch (err: any) {
      setError(safeErrorMessage(err));
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setError(null);
    try {
      await saveProfileMutation.mutateAsync({ name: name.trim() });
      await refetchProfile();
      setStep('complete');
      // The AuthGate will automatically transition to the app
    } catch (err: any) {
      setError(safeErrorMessage(err));
    }
  };

  const isLoading = registerMutation.isPending || saveProfileMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Welcome!
          </h1>
          <p className="text-muted-foreground">
            Complete your registration to get started
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">
              {step === 'register' && 'Create Account'}
              {step === 'profile' && 'Set Up Profile'}
              {step === 'complete' && 'All Set!'}
            </CardTitle>
            <CardDescription>
              {step === 'register' && 'Register as a new user to access the application'}
              {step === 'profile' && 'Tell us your name to personalize your experience'}
              {step === 'complete' && 'Your account is ready'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'register' && (
              <>
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p>
                    You're signed in with Internet Identity, but you need to register 
                    to use this application. Click below to create your account.
                  </p>
                </div>
                <Button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register Account
                    </>
                  )}
                </Button>
              </>
            )}

            {step === 'profile' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading || !name.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </>
            )}

            {step === 'complete' && (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Loading your dashboard...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
