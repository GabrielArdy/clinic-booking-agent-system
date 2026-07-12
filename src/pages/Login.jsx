import { useState } from 'react';
import { navigate } from '../lib/router';
import { auth as authApi } from '../api/client';
import { setAuth, defaultPath } from '../lib/auth';
import { IconBrand } from '../components/icons';
import { Button, Input, Card } from '../components/base';

// V4: real login. Email + password → Bearer session; lands on the console for the
// user's group (admin / doctor / staff).
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const session = await authApi.login({ email: email.trim(), password });
      setAuth(session);
      navigate(defaultPath(session));
    } catch (err) {
      setError(err.code === 'UNAUTHORIZED'
        ? 'Wrong email or password, or the account is inactive.'
        : err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card as="form" onSubmit={submit} className="w-full max-w-sm p-8">
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600" aria-hidden="true">
            <IconBrand className="size-6" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">City Care Console</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your clinic account.</p>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="username" required autoFocus placeholder="you@clinic.test" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 autoComplete="current-password" required placeholder="••••••••" />

          {error && <p className="text-sm text-error-600" role="alert">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={busy || !email.trim() || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => navigate('/')}>
            Back to booking
          </Button>
        </div>
      </Card>
    </div>
  );
}
