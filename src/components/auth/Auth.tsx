// src/components/auth/AuthPage.tsx
import React, { useCallback, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, Mail, Zap, BellRing, DatabaseZap, MessageSquareText, SearchCheck } from 'lucide-react'; // Added more icons


interface LoginCardProps {
  onPasswordLogin: (event: React.FormEvent) => Promise<void>;
  onMagicLinkLogin: () => Promise<void>;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loadingPassword?: boolean;
  loadingMagicLink?: boolean;
  message?: string;
  error?: string;
}


const LoginCard: React.FC<LoginCardProps> = ({
  onPasswordLogin,
  onMagicLinkLogin,
  email,
  setEmail,
  password,
  setPassword,
  loadingPassword,
  loadingMagicLink,
  message,
  error,
}) => (
  <Card className="w-full max-w-md animate-in fade-in duration-500 bg-slate-800/70 backdrop-blur-md border-slate-700">
    <CardHeader>
      <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
      <CardDescription className="text-center text-slate-400">Access your SmartMail dashboard.</CardDescription>
    </CardHeader>
    <form onSubmit={onPasswordLogin}>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="login-email" className="text-slate-300">Email</Label>
          <Input id="login-email" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500" disabled={loadingPassword || loadingMagicLink} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="login-password" className="text-slate-300">Password</Label>
          <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500" disabled={loadingPassword || loadingMagicLink} />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-y-3">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loadingPassword || loadingMagicLink || !email || !password}>
          {loadingPassword ? 'Logging in...' : 'Login with Password'}
        </Button>
      </CardFooter>
    </form>
    <div className="px-6 py-4">
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-600" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-800/70 px-2 text-slate-400">Or</span>
        </div>
      </div>
      <Button variant="outline" className="w-full mt-3 border-slate-600 hover:bg-slate-700/50 text-slate-300" onClick={onMagicLinkLogin} disabled={loadingMagicLink || loadingPassword || !email}>
        {loadingMagicLink ? 'Sending...' : 'Send Magic Link'}
      </Button>
    </div>
    {message && <p className="pt-0 p-4 text-center text-sm text-green-400">{message}</p>}
    {error && <p className="pt-0 p-4 text-center text-sm text-red-400">{error}</p>}
  </Card>
);



export const Auth: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);

  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingMagicLink, setLoadingMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  const handlePasswordLogin = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingPassword(true);
    setMessage('');
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setLoadingPassword(false);
  }, [email, password]); // Dependencies: email, password

  
  const handleMagicLinkLogin = useCallback(async () => {
    if (!email) {
        setError("Please enter your email address.");
        return;
    }
    setLoadingMagicLink(true);
    setMessage('');
    setError('');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (otpError) setError(otpError.message);
    else setMessage('Check your email for the magic link!');
    setLoadingMagicLink(false);
  }, [email]); // Dependency: email


  const goToExternalDemoSite = () => {
    window.location.href = 'https://smartmail-demo.varietyheaven.in'; 
  };

  const toggleShowLogin = useCallback(() => {
      setShowLogin(prev => !prev);
      // Clear form fields and messages when toggling
      setEmail('');
      setPassword('');
      setMessage('');
      setError('');
  }, []);

  interface DemoLandingPageProps {
  onLoginClick: () => void;
  onGoToExternalDemo: () => void;
}


  const DemoLandingPage: React.FC<DemoLandingPageProps> = ({ onLoginClick, onGoToExternalDemo }) => (
  <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 md:p-8 text-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white animate-in fade-in duration-1000">
      <div className="absolute top-6 right-6 z-10">
          <Button variant="outline" onClick={onLoginClick} className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/30 shadow-lg text-xs">
              <LogIn className="mr-2 h-4 w-4" /> Admin Login
          </Button>
      </div>
      <main className="max-w-5xl mx-auto mt-12 md:mt-0">
          <div className="flex flex-col items-center mb-8">
              <div className="p-3 bg-purple-500/20 rounded-full mb-4 animate-pulse">
                  <Mail size={48} className="text-purple-300" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  SmartMail Notifier
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto">
                  Real-Time Email Categorization & Discord Alerts for E-commerce Sellers.
                  Turn your inbox into an intelligent, actionable command center.
              </p>
          </div>
          <div className="mb-12 shadow-2xl rounded-xl overflow-hidden border-2 border-purple-500/50 transform hover:scale-105 transition-transform duration-300">
              <video 
                  src="https://media.varietyheaven.in/smartmail-demo/demo-video.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-auto aspect-video"
                  // poster="YOUR_VIDEO_POSTER_URL.jpg" 
              />
          </div>
          <Button 
              onClick={onGoToExternalDemo} 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white text-xl font-semibold py-4 px-10 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-150"
          >
              <Eye className="mr-3 h-6 w-6" /> View Full Interactive Demo
          </Button>
          <p className="text-xs text-slate-400 mt-4 mb-12">
              (Opens the live demo application. No login required.)
          </p>
          <div className="text-left mb-12">
              <h2 className="text-3xl font-semibold mb-8 text-center text-purple-300">Key Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FeatureCard icon={<Zap size={28} className="text-yellow-400" />} title="LLM-Powered Classification" description="Leverages Gemini API for intelligent email categorization into e-commerce specific labels like New Orders, Inquiries, and Returns." />
                  <FeatureCard icon={<BellRing size={28} className="text-blue-400" />} title="Instant Discord Alerts" description="Receive real-time Discord notifications for critical email types, ensuring prompt attention and action." />
                  <FeatureCard icon={<DatabaseZap size={28} className="text-green-400" />} title="Reliable IMAP Sync" description="Real-time email aggregation using IMAP IDLE, backed by cron-based polling for robust and dependable synchronization."/>
                  <FeatureCard icon={<MessageSquareText size={28} className="text-pink-400" />} title="RAG & Semantic Search" description="Ongoing RAG implementation with a vectorized database and Elasticsearch for advanced semantic search capabilities (Coming Soon!)." />
                  <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>} title="Supabase Integration" description="Utilizes Supabase Edge Functions for event processing and PostgreSQL for structured email data storage." />
                  <FeatureCard icon={<SearchCheck size={28} className="text-orange-400" />} title="Modular Architecture" description="Built with a Node/Express backend and TypeScript for a scalable and maintainable RESTful system." />
              </div>
          </div>
      </main>
      <footer className="w-full py-10 mt-16 text-center border-t border-slate-700/50">
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} SmartMail Notifier. Transform Your Inbox.</p>
      </footer>
  </div>
);


  // FeatureCard helper component
  const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({icon, title, description}) => (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-slate-100">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );



//   const LoginPage = () => (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 relative text-white">
//          <div className="absolute top-6 right-6">
//             <Button variant="outline" onClick={() => setShowLogin(false)} className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/30">
//                 <Eye className="mr-2 h-4 w-4" /> View Demo Page
//             </Button>
//         </div>
//         <Card className="w-full max-w-md animate-in fade-in duration-500 bg-slate-800/70 backdrop-blur-md border-slate-700">
//             <CardHeader>
//                 <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
//                 <CardDescription className="text-center text-slate-400">Access your SmartMail dashboard.</CardDescription>
//             </CardHeader>
//             <form onSubmit={handlePasswordLogin}>
//                 <CardContent className="space-y-4">
//                     <div className="space-y-1">
//                         <Label htmlFor="login-email" className="text-slate-300">Email</Label>
//                         <Input id="login-email" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500" disabled={loadingPassword || loadingMagicLink} />
//                     </div>
//                     <div className="space-y-1">
//                         <Label htmlFor="login-password" className="text-slate-300">Password</Label>
//                         <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500" disabled={loadingPassword || loadingMagicLink} />
//                     </div>
//                 </CardContent>
//                 <CardFooter className="flex flex-col items-stretch gap-y-3">
//                     <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loadingPassword || loadingMagicLink || !email || !password}>
//                         {loadingPassword ? 'Logging in...' : 'Login with Password'}
//                     </Button>
//                 </CardFooter>
//             </form>
//             <div className="px-6 py-4">
//                 <div className="relative my-2">
//                     <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-600" /></div>
//                     <div className="relative flex justify-center text-xs uppercase">
//                         <span className="bg-slate-800/70 px-2 text-slate-400">Or</span>
//                     </div>
//                 </div>
//                 <Button variant="outline" className="w-full mt-3 border-slate-600 hover:bg-slate-700/50 text-slate-300" onClick={handleMagicLinkLogin} disabled={loadingMagicLink || loadingPassword || !email}>
//                     {loadingMagicLink ? 'Sending...' : 'Send Magic Link'}
//                 </Button>
//             </div>
//             {message && <p className="pt-0 p-4 text-center text-sm text-green-400">{message}</p>}
//             {error && <p className="pt-0 p-4 text-center text-sm text-red-400">{error}</p>}
//         </Card>
//     </div>
//   );



  if (showLogin) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 relative text-white">
            <div className="absolute top-6 right-6 z-10">
                <Button variant="outline" onClick={toggleShowLogin} className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/30">
                    <Eye className="mr-2 h-4 w-4" /> View Demo Page
                </Button>
            </div>
            <LoginCard 
                onPasswordLogin={handlePasswordLogin}
                onMagicLinkLogin={handleMagicLinkLogin}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loadingPassword={loadingPassword}
                loadingMagicLink={loadingMagicLink}
                message={message}
                error={error}
            />
        </div>
    );
  }

  return (
    <DemoLandingPage 
        onLoginClick={toggleShowLogin}
        onGoToExternalDemo={goToExternalDemoSite}
    />
  );


      

  // Main return for AuthPage: renders either DemoLandingPage or LoginPage
//   return showLogin ? <LoginPage /> : <DemoLandingPage />;
};