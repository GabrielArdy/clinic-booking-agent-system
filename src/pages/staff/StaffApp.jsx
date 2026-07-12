import { navigate } from '../../lib/router';
import { can, clearAuth } from '../../lib/auth';
import { auth as authApi } from '../../api/client';
import ConsoleShell from '../../components/ConsoleShell';
import StaffShift from './sections/StaffShift';
import { IconOnDuty } from '../../components/icons';
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
    <ConsoleShell
      brand="Staff Console"
      groups={[{ items: [{ key: 'today', label: 'Today', Icon: IconOnDuty }] }]}
      activeKey="today" onNavigate={() => {}}
      user={auth.user} onSignOut={signOut}
    >
      {allowed ? <StaffShift token={token} />
        : <p className="text-sm text-gray-500">You don&rsquo;t have access to any staff sections.</p>}
    </ConsoleShell>
  );
}
