import { useEffect, useMemo, useState } from 'react';
import './App.css';
import AuthPage from './components/AuthPage';
import Dashboard from './pages/Dashboard';
import {
  getCurrentSession,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeToAuthChanges,
} from './lib/auth';

function formatAuthError(error) {
  const message = error?.message || 'Something went wrong.';

  if (/invalid login credentials|invalid credentials/i.test(message)) {
    return 'Incorrect email or password. Please try again.';
  }

  if (/email.*already.*registered|user already registered|already exists/i.test(message)) {
    return 'An account with this email already exists. Please log in instead.';
  }

  if (/password/i.test(message) && /least|minimum|6 characters/i.test(message)) {
    return 'Password must be at least 6 characters long.';
  }

  if (/email not confirmed|confirm your email/i.test(message)) {
    return 'Please check your email and confirm your account before signing in.';
  }

  if (/rate limit|too many requests/i.test(message)) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (/network|fetch/i.test(message)) {
    return 'We could not reach the authentication service. Please try again.';
  }

  return 'Unable to complete that action. Please check your details and try again.';
}

function App() {
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const user = useMemo(() => session?.user ?? null, [session]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await getCurrentSession();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setSession(currentSession);
        }
      } catch (error) {
        if (isMounted) {
          setAuthError(formatAuthError(error));
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    restoreSession();

    const { data: { subscription } } = subscribeToAuthChanges(({ session: nextSession }) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      if (!nextSession) {
        setAuthMode('login');
      }
      setAuthError('');
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSubmit = async ({ email, password }) => {
    setAuthError('');
    setIsSubmitting(true);

    try {
      const request = authMode === 'signup'
        ? signUpWithEmail({ email, password })
        : signInWithEmail({ email, password });

      const { data, error } = await request;

      if (error) {
        throw error;
      }

      if (authMode === 'signup' && data?.user && !data.session) {
        setAuthError('Account created successfully. Check your email to confirm your sign-in.');
      }
    } catch (error) {
      setAuthError(formatAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOutUser();

    if (error) {
      setAuthError(formatAuthError(error));
      return;
    }

    setSession(null);
    setAuthMode('login');
  };

  if (isCheckingSession) {
    return (
      <main className="auth-shell auth-loading">
        <section className="auth-card loading-card" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Checking your session...</p>
        </section>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        onSubmit={handleAuthSubmit}
        submitting={isSubmitting}
        error={authError}
      />
    );
  }

  return <Dashboard onLogout={handleLogout} isLoggingOut={false} />;
}

export default App;
