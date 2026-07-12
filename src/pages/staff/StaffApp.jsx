import { useRoute, navigate } from '../../lib/router';
import { can, clearAuth } from '../../lib/auth';
import { auth as authApi } from '../../api/client';
import { useStaffChatNotifications } from '../../hooks/useLiveChat';
import { toast } from '../../lib/toast';
import ConsoleShell from '../../components/ConsoleShell';
import StaffShift from './sections/StaffShift';
import LiveChatSection from '../../components/livechat/LiveChatSection';
import { IconOnDuty, IconChat } from '../../components/icons';
import '../admin/admin.css';

const NAV = [
  { key: 'today', label: 'Today', Icon: IconOnDuty, role: 'STF_DASHBOARD', C: StaffShift },
  { key: 'chat', label: 'Live chat', Icon: IconChat, role: 'STF_CHAT', C: LiveChatSection },
];

export default function StaffApp({ auth }) {
  const route = useRoute();
  const token = auth.token;

  // Dashboard socket — toast when a patient wants to connect, regardless of the
  // section in view. Only relevant to users who can handle chats.
  useStaffChatNotifications(can(auth, 'STF_CHAT') ? token : null, (f) => {
    const who = f?.session?.patientName ? ` from ${f.session.patientName}` : '';
    toast(`New live chat request${who}. Open Live chat to claim.`, { type: 'info' });
  });

  const signOut = async () => {
    try { await authApi.logout(token); } catch { /* best-effort */ }
    clearAuth();
    navigate('/');
  };

  const allowed = NAV.filter((it) => can(auth, it.role));
  const wanted = route.split('/')[2] || allowed[0]?.key;
  const active = allowed.find((it) => it.key === wanted);
  const Section = active?.C;

  return (
    <ConsoleShell
      brand="Staff Console"
      groups={[{ items: allowed }]}
      activeKey={active?.key}
      onNavigate={(key) => navigate(`/staff/${key}`)}
      user={auth.user}
      onSignOut={signOut}
    >
      {Section ? <Section token={token} />
        : <p className="text-sm text-gray-500">You don&rsquo;t have access to any staff sections.</p>}
    </ConsoleShell>
  );
}
