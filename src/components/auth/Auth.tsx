// src/components/auth/Auth.tsx
import React, { useState } from 'react';
import { supabase } from '@/supabaseClient'; // Ensure this path is correct
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export const Auth: React.FC = () => {
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingMagicLink, setLoadingMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingPassword(true);
    setMessage('');
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
    }
    // Auth state change will be handled by the listener in App.tsx
    setLoadingPassword(false);
  };
  
  const handleMagicLinkLogin = async () => { // No event needed if it's a separate button
    if (!email) {
        setError("Please enter your email address to receive a magic link.");
        return;
    }
    setLoadingMagicLink(true);
    setMessage('');
    setError('');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // emailRedirectTo: window.location.origin, // Optional
      }
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setMessage('Check your email for the magic link!');
    }
    setLoadingMagicLink(false);
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Access your email dashboard using your preferred method.</CardDescription>
        </CardHeader>
        
        {/* Password Login Form */}
        <form onSubmit={handlePasswordLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loadingPassword || loadingMagicLink}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                // Not strictly required if they might use magic link
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (if using password)"
                disabled={loadingPassword || loadingMagicLink}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-y-3">
            <Button type="submit" disabled={loadingPassword || loadingMagicLink || !email || !password}>
              {loadingPassword ? 'Logging in...' : 'Login with Password'}
            </Button>
          </CardFooter>
        </form>

        {/* Separator and Magic Link Option */}
        <div className="px-6 py-4">
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-3"
            onClick={handleMagicLinkLogin} 
            disabled={loadingMagicLink || loadingPassword || !email}
          >
            {loadingMagicLink ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </div>
        
        {message && <p className="pt-0 p-4 text-center text-sm text-green-600">{message}</p>}
        {error && <p className="pt-0 p-4 text-center text-sm text-red-600">{error}</p>}
      </Card>
    </div>
  );
};