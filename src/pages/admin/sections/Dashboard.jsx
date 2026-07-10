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
  const doctorCount = data?.doctors?.length;

  return (
    <section className="section">
      <div className="section__head"><h1>Dashboard</h1></div>

      <div className="tiles">
        <div className="card tile">
          <span className="tile__label">Doctors on file</span>
          <span className="tile__value">{loading ? '…' : doctorCount ?? '—'}</span>
        </div>
        <div className="card tile">
          <span className="tile__label">Booking flow</span>
          <span className="tile__value tile__value--ok">Live</span>
        </div>
      </div>

      <div className="nav-cards">
        {CARDS.map((c) => (
          <button key={c.key} className="card nav-card" onClick={() => navigate(`/admin/${c.key}`)}>
            <span className="nav-card__icon" aria-hidden="true">{c.icon}</span>
            <span className="nav-card__title">{c.title}</span>
            <span className="nav-card__desc">{c.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
