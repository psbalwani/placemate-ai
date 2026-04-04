'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TruGenConfigResponse {
  enabled: boolean;
  agentId: string | null;
  embedUrl: string | null;
}

export default function InterviewVideoPage() {
  const [config, setConfig] = useState<TruGenConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mock-interview/trugen')
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="mx-auto max-w-4xl py-10 text-sm text-muted-foreground">Loading video interview...</div>;
  }

  if (!config?.enabled) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Video Interview (Beta)</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            TruGen integration is not enabled. Add TRUGEN_API_KEY and TRUGEN_AGENT_ID to enable this optional beta feature.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!config.embedUrl) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Video Interview (Beta)</h1>
        <Card>
          <CardHeader className="pb-2">TruGen enabled</CardHeader>
          <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
            <p>TRUGEN_API_KEY and TRUGEN_AGENT_ID are configured.</p>
            <p>Add TRUGEN_EMBED_URL to render the embedded video interviewer.</p>
            <p>Agent ID: {config.agentId}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Video Interview (Beta)</h1>
        <Button asChild variant="outline">
          <a href="/interview">Back to Core Interview</a>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <iframe
            title="TruGen Video Interview"
            src={config.embedUrl}
            className="h-[70vh] w-full rounded-xl border-0"
            allow="camera; microphone; autoplay"
          />
        </CardContent>
      </Card>
    </div>
  );
}
