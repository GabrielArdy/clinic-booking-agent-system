import { useState } from 'react';
import { useRoute, navigate } from '../../lib/router';
import Login from './Login';
import Dashboard from './sections/Dashboard';
import Doctors from './sections/Doctors';
import Schedules from './sections/Schedules';
import Exceptions from './sections/Exceptions';
import Appointments from './sections/Appointments';
import './admin.css';

const TOKEN_KEY = 'clinicAdminToken';
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'doctors', label: 'Doctors', icon: '👩‍⚕️' },
  { key: 'schedules', label: 'Schedules', icon: '🗓️' },
  { key: 'exceptions', label: 'Exceptions', icon: '🚫' },
  { key: 'appointments', label: 'Appointments', icon: '📋' },
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
          <span aria-hidden="true">🩺</span> City Care Clinic
        </a>
        <nav className="admin__nav" aria-label="Admin sections">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`admin__navitem ${section === n.key ? 'is-active' : ''}`}
              aria-current={section === n.key ? 'page' : undefined}
              onClick={() => navigate(`/admin/${n.key}`)}
            >
              <span aria-hidden="true">{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div className="admin__side-foot">
          <button className="admin__navitem" onClick={() => navigate('/')}>← Back to booking</button>
          <button className="admin__navitem" onClick={signOut}>⎋ Sign out</button>
        </div>
      </aside>

      <main className="admin__main">
        <Section token={token} />
      </main>
    </div>
  );
}
