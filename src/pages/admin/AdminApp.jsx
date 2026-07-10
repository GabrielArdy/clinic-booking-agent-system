import { useState } from 'react';
import { useRoute, navigate } from '../../lib/router';
import Login from './Login';
import Dashboard from './sections/Dashboard';
import Doctors from './sections/Doctors';
import Schedules from './sections/Schedules';
import Exceptions from './sections/Exceptions';
import Appointments from './sections/Appointments';
import CmsSettings from './sections/CmsSettings';
import CmsSpecialties from './sections/CmsSpecialties';
import CmsStaff from './sections/CmsStaff';
import CmsScheduling from './sections/CmsScheduling';
import CmsRoster from './sections/CmsRoster';
import {
  IconBrand, IconDashboard, IconDoctors, IconSchedules,
  IconExceptions, IconAppointments, IconBack, IconSignOut,
  IconSettings, IconSpecialty, IconStaff, IconShift, IconRoster,
} from '../../components/icons';
import './admin.css';

const TOKEN_KEY = 'clinicAdminToken';
// Two chunks (Miller): day-to-day Operations vs Clinic CMS content/config.
const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { key: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
      { key: 'doctors', label: 'Doctors', Icon: IconDoctors },
      { key: 'schedules', label: 'Schedules', Icon: IconSchedules },
      { key: 'exceptions', label: 'Exceptions', Icon: IconExceptions },
      { key: 'appointments', label: 'Appointments', Icon: IconAppointments },
    ],
  },
  {
    label: 'Clinic CMS',
    items: [
      { key: 'settings', label: 'Settings', Icon: IconSettings },
      { key: 'specialties', label: 'Specialties', Icon: IconSpecialty },
      { key: 'staff', label: 'Staff', Icon: IconStaff },
      { key: 'scheduling', label: 'Scheduling', Icon: IconShift },
      { key: 'roster', label: 'Roster', Icon: IconRoster },
    ],
  },
];
const SECTIONS = {
  dashboard: Dashboard, doctors: Doctors, schedules: Schedules,
  exceptions: Exceptions, appointments: Appointments,
  settings: CmsSettings, specialties: CmsSpecialties, staff: CmsStaff,
  scheduling: CmsScheduling, roster: CmsRoster,
};

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
          {NAV_GROUPS.map((group) => (
            <div className="admin__navgroup" key={group.label}>
              <p className="admin__navlabel">{group.label}</p>
              {group.items.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={`admin__navitem ${section === key ? 'is-active' : ''}`}
                  aria-current={section === key ? 'page' : undefined}
                  onClick={() => navigate(`/admin/${key}`)}
                >
                  <Icon aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
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
