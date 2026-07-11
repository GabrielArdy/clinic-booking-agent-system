import { useState } from 'react';
import { navigate } from '../lib/router';
import { auth as authApi } from '../api/client';
import { setAuth, defaultPath } from '../lib/auth';
import { IconBrand } from '../components/icons';
import './admin/admin.css';

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
    <div className="admin-login">
      <form className="card admin-login__card" onSubmit={submit}>
        <span className="admin-login__mark" aria-hidden="true"><IconBrand /></span>
        <h1>City Care Console</h1>
        <p className="admin-login__lead">Sign in to your clinic account.</p>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="username" required autoFocus placeholder="you@clinic.test" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 autoComplete="current-password" required placeholder="••••••••" />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn-primary" type="submit"
                disabled={busy || !email.trim() || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}>
          Back to booking
        </button>
      </form>
    </div>
  );
}
