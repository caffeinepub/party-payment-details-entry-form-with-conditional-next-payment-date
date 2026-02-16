import { useState } from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fingerprint, Loader2, ShieldCheck } from 'lucide-react';
import { safeErrorMessage } from '../partyPayments/components/safeErrorMessage';

export function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState<string | null>(null);

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (err: any) {
      setError(safeErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Party Payment Manager
          </h1>
          <p className="text-muted-foreground">
            Secure payment tracking and management
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Sign in securely using Internet Identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Fingerprint className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Biometric Authentication</p>
                  <p>
                    Sign in using your device's passkey or biometric authentication (fingerprint, Face ID, etc.) 
                    where supported. Your biometric data never leaves your device.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Sign In with Internet Identity
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to use this application securely and responsibly.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Internet Computer blockchain technology
        </p>
      </div>
    </div>
  );
}
