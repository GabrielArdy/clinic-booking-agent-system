import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';

// No GET for exceptions in the contract, so we keep a session-local list of the
// ones added this session (optimistic) — honest about not being a full history.
export default function Exceptions({ token }) {
  const doctorsQ = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = doctorsQ.data?.doctors ?? [];

  const [form, setForm] = useState({ doctorId: '', date: '', wholeDay: true, startTime: '', endTime: '', reason: '' });
  const [added, setAdded] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError(null);
    try {
      const body = {
        doctorId: Number(form.doctorId),
        date: form.date,
        startTime: form.wholeDay ? null : form.startTime || null,
        endTime: form.wholeDay ? null : form.endTime || null,
        reason: form.reason || null,
      };
      const { id } = await admin.createException(token, body);
      const doc = doctors.find((d) => d.id === body.doctorId);
      setAdded((prev) => [{ id, ...body, doctorName: doc?.fullName }, ...prev]);
      setForm((f) => ({ ...f, date: '', startTime: '', endTime: '', reason: '' }));
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <section className="section">
      <div className="section__head"><h1>Exceptions</h1></div>

      <form className="card panel" onSubmit={submit}>
        <h2>Block time off</h2>
        <div className="form-row">
          <label className="field">
            <span>Doctor</span>
            <select value={form.doctorId} onChange={set('doctorId')} required>
              <option value="">Select…</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
            </select>
          </label>
          <label className="field field--sm">
            <span>Date</span>
            <input type="date" value={form.date} onChange={set('date')} required />
          </label>
          <label className="field field--check">
            <input type="checkbox" checked={form.wholeDay} onChange={set('wholeDay')} />
            <span>Whole day</span>
          </label>
        </div>
        {!form.wholeDay && (
          <div className="form-row">
            <label className="field field--sm">
              <span>From</span>
              <input type="time" value={form.startTime} onChange={set('startTime')} />
            </label>
            <label className="field field--sm">
              <span>To</span>
              <input type="time" value={form.endTime} onChange={set('endTime')} />
            </label>
          </div>
        )}
        <div className="form-row">
          <label className="field">
            <span>Reason (optional)</span>
            <input value={form.reason} onChange={set('reason')} maxLength={200}
                   placeholder="e.g. Clinic training" />
          </label>
          <button className="btn btn-primary" type="submit"
                  disabled={saving || !form.doctorId || !form.date}>
            {saving ? 'Saving…' : '+ Add exception'}
          </button>
        </div>
        {formError && <p className="form-error" role="alert">{formError}</p>}
      </form>

      {added.length > 0 && (
        <table className="table">
          <thead><tr><th>Doctor</th><th>Date</th><th>Window</th><th>Reason</th></tr></thead>
          <tbody>
            {added.map((x) => (
              <tr key={x.id}>
                <td>{x.doctorName ?? x.doctorId}</td>
                <td>{x.date}</td>
                <td>{x.startTime ? `${x.startTime} – ${x.endTime}` : 'Whole day'}</td>
                <td>{x.reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted">Showing exceptions added this session (no list endpoint in the API).</p>
    </section>
  );
}
