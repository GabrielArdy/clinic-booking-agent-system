import { useState } from 'react';
import { useRoute, navigate } from '../../lib/router';
import Login from './Login';
import Dashboard from './sections/Dashboard';
import Doctors from './sections/Doctors';
import Schedules from './sections/Schedules';
import Exceptions from './sections/Exceptions';
import Appointments from './sections/Appointments';
import {
  IconBrand, IconDashboard, IconDoctors, IconSchedules,
  IconExceptions, IconAppointments, IconBack, IconSignOut,
} from '../../components/icons';
import './admin.css';

const TOKEN_KEY = 'clinicAdminToken';
const NAV = [
  { key: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
  { key: 'doctors', label: 'Doctors', Icon: IconDoctors },
  { key: 'schedules', label: 'Schedules', Icon: IconSchedules },
  { key: 'exceptions', label: 'Exceptions', Icon: IconExceptions },
  { key: 'appointments', label: 'Appointments', Icon: IconAppointments },
];
const SECTIONS = { dashboard: Dashboard, doctors: Doctors, schedules: Schedules, exceptions: Exceptions, appointments: Appointments };

export default function AdminApp() {
  const route = useRoute();                       // e.g. /admin/doctors
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');

  const signIn = (t) => { localStorage.setItem(TOKEN_KEY, t); setToken(t); };
  const signOut = () => { localStorage.removeItem(TOKEN_KEY); setToken(''); navigate('/admin'); };

  if (!token) return <Login onSubmit={signIn} />;

  const section = route.split('/')[2] || 'dashboard';
  const Section = SECTIONS[section] ?? Dashboard;

  return (
    <div className="admin">
      <aside className="admin__side">
        <a className="admin__brand" href="#/">
          <IconBrand aria-hidden="true" /> City Care Clinic
        </a>
        <nav className="admin__nav" aria-label="Admin sections">
          {NAV.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`admin__navitem ${section === key ? 'is-active' : ''}`}
              aria-current={section === key ? 'page' : undefined}
              onClick={() => navigate(`/admin/${key}`)}
            >
              <Icon aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>
        <div className="admin__side-foot">
          <button className="admin__navitem" onClick={() => navigate('/')}><IconBack aria-hidden="true" /> Back to booking</button>
          <button className="admin__navitem" onClick={signOut}><IconSignOut aria-hidden="true" /> Sign out</button>
        </div>
      </aside>

      <main className="admin__main">
        <Section token={token} />
      </main>
    </div>
  );
}
