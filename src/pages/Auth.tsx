import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/app');
      }
    };
    
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/app');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Call our edge function to verify code in Airtable
      const { data, error } = await supabase.functions.invoke('verify-shuffler-user', {
        body: { code }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        // Check if it's a code verification error
        if (data.error.includes('not authorized') || data.error.includes('not found')) {
          setError('Please verify that you entered the correct code. If this issue persists, contact admin (mshahrani@kfupm.edu.sa).');
        } else {
          setError(data.error);
        }
      } else if (data.success && data.user) {
        // Airtable validation passed - sign in directly with provided password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.user.email,
          password: data.user.tempPassword
        });
        
        if (signInError) {
          setError('Authentication failed: ' + signInError.message);
        } else {
          // Store user data in localStorage for header display
          localStorage.setItem('userFullName', data.user.fullName || '');
          localStorage.setItem('userEmail', data.user.email || '');
          
          toast({
            title: `Welcome${data.user.fullName ? `, ${data.user.fullName}` : ''}!`,
            description: `Logged in as ${data.user.email}`,
          });
          // Auth state listener will handle redirect
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError('Please verify that you entered the correct code. If this issue persists, contact admin (mshahrani@kfupm.edu.sa).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-academic flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Enter Access Code</CardTitle>
          <CardDescription>
            Enter your access code to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 relative">
              <Input
                type={showCode ? "text" : "password"}
                placeholder="Enter your access code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={loading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showCode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !code}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Only authorized access codes can access this application.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;