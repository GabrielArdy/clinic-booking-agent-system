import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';

const today = () => new Date().toISOString().slice(0, 10);

export default function Appointments({ token }) {
  const doctorsQ = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = doctorsQ.data?.doctors ?? [];
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(today());

  const canQuery = !!doctorId && !!date;
  const bookingsQ = useAsync(
    (signal) => admin.listBookings(token, { doctorId, date }, { signal }),
    [token, doctorId, date],
    { immediate: false },
  );
  const bookings = bookingsQ.data?.bookings ?? [];

  const load = () => { if (canQuery) bookingsQ.refetch(); };

  return (
    <section className="section">
      <div className="section__head"><h1>Appointments</h1></div>

      <div className="filters">
        <label className="field field--inline">
          <span>Doctor</span>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">Select…</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
          </select>
        </label>
        <label className="field field--inline">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button className="btn btn-primary" onClick={load} disabled={!canQuery}>View</button>
      </div>

      {!canQuery && <p className="muted">Pick a doctor and date, then View.</p>}
      {bookingsQ.loading && <p className="muted">Loading appointments…</p>}
      {bookingsQ.error && <p className="form-error" role="alert">{bookingsQ.error.message}</p>}
      {bookingsQ.data && !bookingsQ.loading && (
        <table className="table">
          <thead><tr><th>Reference</th><th>Time</th><th>Patient</th><th>Status</th></tr></thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan="4" className="muted">No appointments.</td></tr>}
            {bookings.map((b) => (
              <tr key={b.id}>
                <td><code>{b.reference}</code></td>
                <td>{b.startTime} – {b.endTime}</td>
                <td>{b.patientId}</td>
                <td>
                  <span className={`pill ${b.status === 'active' ? 'pill-success' : 'pill-muted'}`}>
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
