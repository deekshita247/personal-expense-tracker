function formatFieldLabel(label) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function AuthPage({
  mode,
  setMode,
  onSubmit,
  submitting,
  error,
}) {
  const isSignUp = mode === 'signup';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    if (!email || !password) {
      return;
    }

    await onSubmit({ email, password });
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label="Authentication form">
        <div className="auth-header">
          <p className="auth-kicker">Personal expense tracker</p>
          <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p className="auth-subtitle">
            {isSignUp
              ? 'Set up your secure sign-in to track household spending.'
              : 'Sign in to keep your budget organized.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>

        <div className="auth-toggle" aria-live="polite">
          <span>{isSignUp ? 'Already have an account?' : 'Need an account?'}</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setMode(isSignUp ? 'login' : 'signup')}
          >
            {isSignUp ? 'Log in' : 'Create account'}
          </button>
        </div>
      </section>
    </main>
  );
}
