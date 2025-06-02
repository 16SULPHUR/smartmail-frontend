// src/components/auth/Auth.tsx
import React, { useState } from 'react';
import { supabase } from '@/supabaseClient'; // Ensure this path is correct
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
// Tabs are no longer needed if we only have one auth method
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Magic Link Login
  const handleMagicLinkLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // emailRedirectTo: you can specify a path here, e.g., `${window.location.origin}/dashboard`
        // If not specified, it defaults to your Supabase project's Site URL.
      }
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage('Check your email for the magic link!');
    }
    setLoading(false);
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md"> {/* Added width constraints */}
        <CardHeader>
          <CardTitle>Access Your Account</CardTitle> {/* More generic title */}
          <CardDescription>Enter your email to receive a magic link to sign in.</CardDescription>
        </CardHeader>
        <form onSubmit={handleMagicLinkLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="magic-link-email">Email</Label>
              <Input
                id="magic-link-email"
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch"> {/* Removed gap-y-3 as only one button */}
            <Button type="submit" disabled={loading || !email}>
              {loading ? 'Sending Magic Link...' : 'Send Magic Link'}
            </Button>
          </CardFooter>
        </form>
        {/* Moved messages outside the form, but still within the Card or main div */}
        {message && <p className="mt-4 p-4 text-center text-sm text-green-600">{message}</p>}
        {error && <p className="mt-4 p-4 text-center text-sm text-red-600">{error}</p>}
      </Card>
    </div>
  );
};