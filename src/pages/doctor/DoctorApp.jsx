import { useRoute, navigate } from '../../lib/router';
import { can, clearAuth } from '../../lib/auth';
import { auth as authApi } from '../../api/client';
import ConsoleShell from '../../components/ConsoleShell';
import DoctorSchedule from './sections/DoctorSchedule';
import DoctorExceptions from './sections/DoctorExceptions';
import DoctorAppointments from './sections/DoctorAppointments';
import { IconSchedules, IconExceptions, IconAppointments } from '../../components/icons';
import '../admin/admin.css';

const NAV = [
  { key: 'schedule', label: 'Schedule', Icon: IconSchedules, role: 'DOC_DASHBOARD', C: DoctorSchedule },
  { key: 'exceptions', label: 'Blocking time', Icon: IconExceptions, role: 'DOC_EXCEPTION', C: DoctorExceptions },
  { key: 'appointments', label: 'Appointments', Icon: IconAppointments, role: 'DOC_APPOINTMENT', C: DoctorAppointments },
];

export default function DoctorApp({ auth }) {
  const route = useRoute();
  const token = auth.token;

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
      brand="Doctor Console"
      groups={[{ items: allowed }]} activeKey={active?.key}
      onNavigate={(key) => navigate(`/doctor/${key}`)}
      user={auth.user} onSignOut={signOut}
    >
      {Section ? <Section token={token} />
        : <p className="text-sm text-gray-500">You don&rsquo;t have access to any doctor sections.</p>}
    </ConsoleShell>
  );
}
