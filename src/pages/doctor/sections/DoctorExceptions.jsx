import { useState } from 'react';
import { doctor } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import { todayISO } from '../../../lib/calendar';

const plusDays = (iso, n) => {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Own blocking time (DOC_EXCEPTION). Whole-day = null start/end.
export default function DoctorExceptions({ token }) {
  const from = todayISO();
  const to = plusDays(from, 90);
  const q = useAsync((signal) => doctor.listExceptions(token, { from, to }, { signal }), [token]);
  const exceptions = q.data?.exceptions ?? [];

  const [form, setForm] = useState({ date: from, allDay: false, startTime: '09:00', endTime: '10:00', reason: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await doctor.createException(token, {
        date: form.date,
        startTime: form.allDay ? null : form.startTime,
        endTime: form.allDay ? null : form.endTime,
        reason: form.reason.trim() || null,
      });
      setForm((f) => ({ ...f, reason: '' }));
      q.refetch();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Blocking time</h1>
          <p className="section__sub">Block a whole day or a window when you’re unavailable.</p>
        </div>
      </div>

      <form className="card panel" onSubmit={create}>
        <h2>Add blocking time</h2>
        <div className="form-row">
          <label className="field field--sm">
            <span>Date</span>
            <input type="date" value={form.date} min={from} onChange={set('date')} required />
          </label>
          <label className="field field--check">
            <input type="checkbox" checked={form.allDay}
                   onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))} />
            <span>Whole day</span>
          </label>
          {!form.allDay && (
            <>
              <label className="field field--sm">
                <span>Start</span>
                <input type="time" value={form.startTime} onChange={set('startTime')} required />
              </label>
              <label className="field field--sm">
                <span>End</span>
                <input type="time" value={form.endTime} onChange={set('endTime')} required />
              </label>
            </>
          )}
          <label className="field">
            <span>Reason <em className="opt">optional</em></span>
            <input value={form.reason} onChange={set('reason')} maxLength={200} placeholder="e.g. conference" />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Adding…' : 'Block time'}
          </button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>

      {q.loading && <p className="muted">Loading…</p>}
      {q.error && <p className="form-error" role="alert">{q.error.message}</p>}
      {!q.loading && !q.error && (
        <div className="card table-card">
          <table className="table">
            <thead><tr><th>Date</th><th>Time</th><th>Reason</th></tr></thead>
            <tbody>
              {exceptions.length === 0 && <tr><td colSpan="3" className="muted">No blocking time in the next 90 days.</td></tr>}
              {exceptions.map((ex) => (
                <tr key={ex.id}>
                  <td>{ex.date}</td>
                  <td>{ex.startTime ? `${ex.startTime} – ${ex.endTime}` : 'All day'}</td>
                  <td>{ex.reason ?? <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
