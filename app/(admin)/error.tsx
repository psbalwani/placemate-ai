'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/20">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Admin Error</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {error.message || 'Failed to load admin data. Please try again.'}
        </p>
      </div>
      <Button onClick={reset} variant="outline" id="admin-error-reset">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
