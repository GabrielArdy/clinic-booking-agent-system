import { useState } from 'react';
import { doctor } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import { todayISO } from '../../../lib/calendar';

const plusDays = (iso, n) => {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Own appointment list (DOC_APPOINTMENT) + on-demand detail by reference.
export default function DoctorAppointments({ token }) {
  const from = todayISO();
  const to = plusDays(from, 30);
  const listQ = useAsync((signal) => doctor.listAppointments(token, { from, to }, { signal }), [token]);
  const appointments = listQ.data?.appointments ?? [];

  const [ref, setRef] = useState('');
  const detailQ = useAsync(
    (signal) => (ref ? doctor.getAppointment(token, ref, { signal }) : Promise.resolve(null)),
    [token, ref],
  );
  const detail = detailQ.data;

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>My appointments</h1>
          <p className="section__sub">Next 30 days. Select a row for detail.</p>
        </div>
      </div>

      {detail && (
        <div className="card panel">
          <h2>{detail.appointment.reference}</h2>
          <dl className="detail-grid">
            <div><dt>Patient</dt><dd>{detail.patient.fullName}</dd></div>
            <div><dt>Phone</dt><dd>{detail.patient.phone}</dd></div>
            <div><dt>Date</dt><dd>{detail.appointment.date}</dd></div>
            <div><dt>Time</dt><dd>{detail.appointment.startTime}–{detail.appointment.endTime}</dd></div>
            <div><dt>Status</dt><dd>
              <span className={`pill ${detail.appointment.status === 'active' ? 'pill-success' : 'pill-muted'}`}>
                {detail.appointment.status}
              </span>
            </dd></div>
          </dl>
        </div>
      )}
      {detailQ.error && <p className="form-error" role="alert">{detailQ.error.message}</p>}

      {listQ.loading && <p className="muted">Loading…</p>}
      {listQ.error && <p className="form-error" role="alert">{listQ.error.message}</p>}
      {!listQ.loading && !listQ.error && (
        <div className="card table-card">
          <table className="table">
            <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Status</th><th>Ref</th></tr></thead>
            <tbody>
              {appointments.length === 0 && <tr><td colSpan="5" className="muted">No appointments in the next 30 days.</td></tr>}
              {appointments.map((a) => (
                <tr key={a.id} className={ref === a.reference ? 'is-selected-row' : ''}
                    style={{ cursor: 'pointer' }} onClick={() => setRef(a.reference)}>
                  <td>{a.date}</td>
                  <td>{a.startTime}–{a.endTime}</td>
                  <td>{a.patient.fullName}</td>
                  <td>
                    <span className={`pill ${a.status === 'active' ? 'pill-success' : 'pill-muted'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td><code>{a.reference}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
