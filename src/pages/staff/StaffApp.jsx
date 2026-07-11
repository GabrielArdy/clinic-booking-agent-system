import { navigate } from '../../lib/router';
import { can, clearAuth } from '../../lib/auth';
import { auth as authApi } from '../../api/client';
import StaffShift from './sections/StaffShift';
import { IconBrand, IconOnDuty, IconBack, IconSignOut } from '../../components/icons';
import '../admin/admin.css';

export default function StaffApp({ auth }) {
  const token = auth.token;
  const allowed = can(auth, 'STF_DASHBOARD');

  const signOut = async () => {
    try { await authApi.logout(token); } catch { /* best-effort */ }
    clearAuth();
    navigate('/');
  };

  return (
    <div className="admin">
      <aside className="admin__side">
        <span className="admin__brand"><IconBrand aria-hidden="true" /> Staff Console</span>
        <nav className="admin__nav" aria-label="Staff sections">
          <div className="admin__navgroup">
            <button className="admin__navitem is-active"><IconOnDuty aria-hidden="true" /> Today</button>
          </div>
        </nav>
        <div className="admin__side-foot">
          {auth.user && <p className="admin__who">{auth.user.fullName ?? auth.user.email}</p>}
          <button className="admin__navitem" onClick={() => navigate('/')}><IconBack aria-hidden="true" /> Back to booking</button>
          <button className="admin__navitem" onClick={signOut}><IconSignOut aria-hidden="true" /> Sign out</button>
        </div>
      </aside>
      <main className="admin__main">
        {allowed ? <StaffShift token={token} />
          : <p className="muted">You don’t have access to any staff sections.</p>}
      </main>
    </div>
  );
}
