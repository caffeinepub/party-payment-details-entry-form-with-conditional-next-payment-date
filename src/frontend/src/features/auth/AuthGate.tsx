import { ReactNode } from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useActor } from '@/hooks/useActor';
import { useGetCallerUserProfile, useGetCallerUserRole } from './authApi';
import { LoginScreen } from './LoginScreen';
import { RegistrationScreen } from './RegistrationScreen';
import { Loader2 } from 'lucide-react';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { identity, isInitializing: iiInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched } = useGetCallerUserRole();

  const isAuthenticated = !!identity;

  // Show loading screen while initializing
  if (iiInitializing || actorFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Authenticated but still loading role/profile data
  if (roleLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Check if user needs to register (guest role or no profile)
  const needsRegistration = roleFetched && (userRole === 'guest' || userRole === null);
  const needsProfile = profileFetched && userProfile === null && userRole === 'user';

  if (needsRegistration || needsProfile) {
    return <RegistrationScreen />;
  }

  // Fully authenticated and registered - show app
  return <>{children}</>;
}
