import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface ActorConnectionNoticeProps {
  message?: string;
}

/**
 * Displays a loading notice while the backend actor is being initialized.
 * Shows a spinner and a user-friendly message.
 */
export function ActorConnectionNotice({ message = 'Connecting to service...' }: ActorConnectionNoticeProps) {
  return (
    <Alert className="max-w-2xl mx-auto">
      <Loader2 className="h-4 w-4 animate-spin" />
      <AlertTitle>Initializing</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
