import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import { navigate } from '../../../lib/router';

const CARDS = [
  { key: 'doctors', title: 'Doctors', desc: 'Add and review clinic doctors', icon: '👩‍⚕️' },
  { key: 'schedules', title: 'Schedules', desc: 'Set weekly availability rules', icon: '🗓️' },
  { key: 'exceptions', title: 'Exceptions', desc: 'Block days or windows off', icon: '🚫' },
  { key: 'appointments', title: 'Appointments', desc: 'View bookings by doctor & date', icon: '📋' },
];

export default function Dashboard({ token }) {
  const { data, loading } = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = data?.doctors ?? [];
  const active = doctors.filter((d) => d.active).length;
  const specialties = new Set(doctors.map((d) => d.specialtyName ?? d.specialtyId)).size;

  const tiles = [
    { label: 'Doctors on file', value: loading ? '…' : doctors.length, accent: 'teal' },
    { label: 'Active doctors', value: loading ? '…' : active, accent: 'green' },
    { label: 'Specialties', value: loading ? '…' : specialties, accent: 'sky' },
    { label: 'Booking flow', value: 'Live', accent: 'green', small: true },
  ];

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Dashboard</h1>
          <p className="section__sub">Overview of your clinic at a glance.</p>
        </div>
      </div>

      <div className="tiles">
        {tiles.map((t) => (
          <div key={t.label} className={`tile tile--${t.accent}`}>
            <span className="tile__label">{t.label}</span>
            <span className={`tile__value ${t.small ? 'tile__value--sm' : ''}`}>{t.value}</span>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="panel-tint dash-panel">
          <div className="dash-panel__head">
            <h2>Doctors</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/doctors')}>
              Manage →
            </button>
          </div>
          <div className="card table-card">
            <table className="table">
              <thead><tr><th>Name</th><th>Specialty</th><th>Status</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan="3" className="muted">Loading…</td></tr>}
                {!loading && doctors.length === 0 && (
                  <tr><td colSpan="3" className="muted">No doctors yet.</td></tr>
                )}
                {doctors.slice(0, 6).map((d) => (
                  <tr key={d.id}>
                    <td>{d.fullName}</td>
                    <td>{d.specialtyName ?? d.specialtyId}</td>
                    <td>
                      <span className={`pill ${d.active ? 'pill-success' : 'pill-muted'}`}>
                        {d.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-tint dash-panel">
          <div className="dash-panel__head"><h2>Quick actions</h2></div>
          <div className="nav-cards">
            {CARDS.map((c) => (
              <button key={c.key} className="card nav-card" onClick={() => navigate(`/admin/${c.key}`)}>
                <span className="nav-card__icon" aria-hidden="true">{c.icon}</span>
                <span className="nav-card__title">{c.title}</span>
                <span className="nav-card__desc">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
