import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Schedules({ token }) {
  const doctorsQ = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = doctorsQ.data?.doctors ?? [];
  const [doctorId, setDoctorId] = useState('');

  // Rules load only once a doctor is chosen (immediate:false + manual refetch).
  const rulesQ = useAsync(
    (signal) => admin.listSchedules(token, doctorId, { signal }),
    [token, doctorId],
    { immediate: false },
  );
  const rules = rulesQ.data?.rules ?? [];

  const onPickDoctor = (id) => { setDoctorId(id); if (id) rulesQ.refetch(); };

  const [form, setForm] = useState({ weekday: 1, startTime: '09:00', endTime: '17:00', slotMinutes: 30 });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addRule = async (e) => {
    e.preventDefault();
    if (!doctorId) return;
    setSaving(true); setFormError(null);
    try {
      await admin.createSchedule(token, {
        doctorId: Number(doctorId),
        weekday: Number(form.weekday),
        startTime: form.startTime,
        endTime: form.endTime,
        slotMinutes: Number(form.slotMinutes),
      });
      rulesQ.refetch();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <section className="section">
      <div className="section__head"><h1>Schedules</h1></div>

      <label className="field field--inline">
        <span>Doctor</span>
        <select value={doctorId} onChange={(e) => onPickDoctor(e.target.value)}>
          <option value="">Select a doctor…</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
        </select>
      </label>

      {!doctorId && <p className="muted">Pick a doctor to view and edit weekly rules.</p>}

      {doctorId && (
        <>
          <form className="card panel" onSubmit={addRule}>
            <h2>Add weekly rule</h2>
            <div className="form-row">
              <label className="field">
                <span>Weekday</span>
                <select value={form.weekday} onChange={set('weekday')}>
                  {WEEKDAYS.map((w, i) => <option key={i} value={i}>{w}</option>)}
                </select>
              </label>
              <label className="field field--sm">
                <span>Start</span>
                <input type="time" value={form.startTime} onChange={set('startTime')} required />
              </label>
              <label className="field field--sm">
                <span>End</span>
                <input type="time" value={form.endTime} onChange={set('endTime')} required />
              </label>
              <label className="field field--sm">
                <span>Slot (min)</span>
                <input type="number" min="5" max="240" value={form.slotMinutes} onChange={set('slotMinutes')} />
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : '+ Add rule'}
              </button>
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
          </form>

          {rulesQ.loading && <p className="muted">Loading rules…</p>}
          {rulesQ.error && <p className="form-error" role="alert">{rulesQ.error.message}</p>}
          {!rulesQ.loading && !rulesQ.error && (
            <table className="table">
              <thead><tr><th>Weekday</th><th>Hours</th><th>Slot</th></tr></thead>
              <tbody>
                {rules.length === 0 && <tr><td colSpan="3" className="muted">No rules yet.</td></tr>}
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td>{WEEKDAYS[r.weekday]}</td>
                    <td>{r.startTime} – {r.endTime}</td>
                    <td>{r.slotMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
