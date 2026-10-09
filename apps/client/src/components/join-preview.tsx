'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinSpaceSchema } from '@/lib/validators/join-space';
import { useUiStore } from '@/stores/ui-store';

export function JoinPreview() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = joinSpaceSchema.safeParse({ email, inviteCode });

    if (!result.success) {
      setMessage(result.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setMessage(`Ready to join with ${result.data.email}`);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join a space</CardTitle>
        <CardDescription>
          Zod validates the form. Zustand tracks UI state
          {sidebarOpen ? ' (sidebar open)' : ' (sidebar closed)'}.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onValueChange={setEmail}
              placeholder="you@company.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-code">Invite code</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onValueChange={setInviteCode}
              placeholder="ABC123"
            />
          </div>
          {message ? (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="submit">Validate</Button>
          <Button type="button" variant="outline" onClick={toggleSidebar}>
            Toggle UI state
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
