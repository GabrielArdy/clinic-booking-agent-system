import { useState } from 'react';
import { navigate } from '../../lib/router';

export default function Login({ onSubmit }) {
  const [token, setToken] = useState('');
  return (
    <div className="admin-login">
      <form className="card admin-login__card" onSubmit={(e) => { e.preventDefault(); onSubmit(token.trim()); }}>
        <span className="admin-login__mark" aria-hidden="true">🩺</span>
        <h1>Admin Console</h1>
        <p className="admin-login__lead">Enter your admin token to manage the clinic.</p>
        <label className="field">
          <span>Admin token</span>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
                 placeholder="x-admin-token" autoComplete="off" autoFocus />
        </label>
        <button className="btn btn-primary" type="submit" disabled={!token.trim()}>Sign in</button>
        <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}>
          Back to booking
        </button>
      </form>
    </div>
  );
}
