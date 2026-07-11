import { useRoute, navigate } from '../../lib/router';
import { canAny, clearAuth } from '../../lib/auth';
import { auth as authApi } from '../../api/client';
import Dashboard from './sections/Dashboard';
import Doctors from './sections/Doctors';
import Schedules from './sections/Schedules';
import Exceptions from './sections/Exceptions';
import Appointments from './sections/Appointments';
import AuditLog from './sections/AuditLog';
import CmsSettings from './sections/CmsSettings';
import CmsSpecialties from './sections/CmsSpecialties';
import CmsStaff from './sections/CmsStaff';
import CmsScheduling from './sections/CmsScheduling';
import CmsRoster from './sections/CmsRoster';
import CmsPositions from './sections/CmsPositions';
import CmsUsers from './sections/CmsUsers';
import {
  IconBrand, IconDashboard, IconDoctors, IconSchedules,
  IconExceptions, IconAppointments, IconBack, IconSignOut,
  IconSettings, IconSpecialty, IconStaff, IconShift, IconRoster,
  IconAudit, IconPosition, IconUsers,
} from '../../components/icons';
import './admin.css';

// Each section names the role(s) that grant it (any = access). Nav filters by them
// so users only see what they can open (Hick — no dead options).
const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { key: 'dashboard', label: 'Dashboard', Icon: IconDashboard, roles: ['ADM_DASHBOARD'], C: Dashboard },
      { key: 'doctors', label: 'Doctors', Icon: IconDoctors, roles: ['ADM_DASHBOARD'], C: Doctors },
      { key: 'schedules', label: 'Schedules', Icon: IconSchedules, roles: ['ADM_DASHBOARD'], C: Schedules },
      { key: 'exceptions', label: 'Exceptions', Icon: IconExceptions, roles: ['ADM_DASHBOARD'], C: Exceptions },
      { key: 'appointments', label: 'Appointments', Icon: IconAppointments, roles: ['ADM_DASHBOARD'], C: Appointments },
      { key: 'audit', label: 'Audit Log', Icon: IconAudit, roles: ['AUDIT_LOG'], C: AuditLog },
    ],
  },
  {
    label: 'Clinic CMS',
    items: [
      { key: 'settings', label: 'Settings', Icon: IconSettings, roles: ['CMS_CLINIC', 'CMS_THEME'], C: CmsSettings },
      { key: 'specialties', label: 'Specialties', Icon: IconSpecialty, roles: ['CMS_STAFF_DOCTOR'], C: CmsSpecialties },
      { key: 'staff', label: 'Staff', Icon: IconStaff, roles: ['CMS_STAFF_DOCTOR'], C: CmsStaff },
      { key: 'scheduling', label: 'Scheduling', Icon: IconShift, roles: ['CMS_SLOT'], C: CmsScheduling },
      { key: 'roster', label: 'Roster', Icon: IconRoster, roles: ['CMS_ROSTER'], C: CmsRoster },
    ],
  },
  {
    label: 'Access',
    items: [
      { key: 'positions', label: 'Positions', Icon: IconPosition, roles: ['CMS_POSITION'], C: CmsPositions },
      { key: 'users', label: 'Users', Icon: IconUsers, roles: ['CMS_POSITION'], C: CmsUsers },
    ],
  },
];

export default function AdminApp({ auth }) {
  const route = useRoute();
  const token = auth.token;

  const signOut = async () => {
    try { await authApi.logout(token); } catch { /* revoke best-effort */ }
    clearAuth();
    navigate('/');
  };

  // Nav filtered to permitted sections; groups with nothing left are dropped.
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((it) => canAny(auth, it.roles)) }))
    .filter((g) => g.items.length > 0);
  const allowed = groups.flatMap((g) => g.items);

  const wanted = route.split('/')[2] || allowed[0]?.key;
  const active = allowed.find((it) => it.key === wanted);
  const Section = active?.C;

  return (
    <div className="admin">
      <aside className="admin__side">
        <a className="admin__brand" href="#/">
          <IconBrand aria-hidden="true" /> City Care Clinic
        </a>
        <nav className="admin__nav" aria-label="Admin sections">
          {groups.map((group) => (
            <div className="admin__navgroup" key={group.label}>
              <p className="admin__navlabel">{group.label}</p>
              {group.items.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={`admin__navitem ${active?.key === key ? 'is-active' : ''}`}
                  aria-current={active?.key === key ? 'page' : undefined}
                  onClick={() => navigate(`/admin/${key}`)}
                >
                  <Icon aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin__side-foot">
          {auth.user && <p className="admin__who">{auth.user.fullName ?? auth.user.email}</p>}
          <button className="admin__navitem" onClick={() => navigate('/')}><IconBack aria-hidden="true" /> Back to booking</button>
          <button className="admin__navitem" onClick={signOut}><IconSignOut aria-hidden="true" /> Sign out</button>
        </div>
      </aside>

      <main className="admin__main">
        {Section ? <Section token={token} auth={auth} />
          : <p className="muted">You don’t have access to any admin sections.</p>}
      </main>
    </div>
  );
}
