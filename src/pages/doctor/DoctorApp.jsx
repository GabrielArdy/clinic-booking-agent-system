import { useRoute, navigate } from '../../lib/router';
import { can, clearAuth } from '../../lib/auth';
import { auth as authApi } from '../../api/client';
import DoctorSchedule from './sections/DoctorSchedule';
import DoctorExceptions from './sections/DoctorExceptions';
import DoctorAppointments from './sections/DoctorAppointments';
import {
  IconBrand, IconSchedules, IconExceptions, IconAppointments,
  IconBack, IconSignOut,
} from '../../components/icons';
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
    <div className="admin">
      <aside className="admin__side">
        <span className="admin__brand"><IconBrand aria-hidden="true" /> Doctor Console</span>
        <nav className="admin__nav" aria-label="Doctor sections">
          <div className="admin__navgroup">
            {allowed.map(({ key, label, Icon }) => (
              <button key={key}
                className={`admin__navitem ${active?.key === key ? 'is-active' : ''}`}
                aria-current={active?.key === key ? 'page' : undefined}
                onClick={() => navigate(`/doctor/${key}`)}>
                <Icon aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </nav>
        <div className="admin__side-foot">
          {auth.user && <p className="admin__who">{auth.user.fullName ?? auth.user.email}</p>}
          <button className="admin__navitem" onClick={() => navigate('/')}><IconBack aria-hidden="true" /> Back to booking</button>
          <button className="admin__navitem" onClick={signOut}><IconSignOut aria-hidden="true" /> Sign out</button>
        </div>
      </aside>
      <main className="admin__main">
        {Section ? <Section token={token} />
          : <p className="muted">You don’t have access to any doctor sections.</p>}
      </main>
    </div>
  );
}
