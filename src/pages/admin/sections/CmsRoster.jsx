import { useState } from 'react';
import { cms, admin } from '../../../api/client';
import { useCrud } from '../../../hooks/useCrud';
import { useAsync } from '../../../hooks/useAsync';
import Modal from '../../../components/Modal';
import { IconTrash, IconPlus } from '../../../components/icons';

const today = () => new Date().toISOString().slice(0, 10);

// On-duty roster: assign a shift to exactly one doctor OR staff member for a date.
// The person picker encodes the choice as "doctor:<id>" / "staff:<id>" so the
// XOR constraint is impossible to violate from the UI.
export default function CmsRoster({ token }) {
  const [date, setDate] = useState(today);

  const { items, loading, error, refetch, add, del, busy, mutError } = useCrud({
    load: (signal) => cms.listAssignments(token, date, { signal }).then((r) => r.assignments),
    create: (body) => cms.createAssignment(token, body).then((r) => r.assignment),
    remove: (id) => cms.deleteAssignment(token, id),
    deps: [token, date],
  });

  // Pickers — read-only reference lists (no refetch on date change).
  const shifts = useAsync((s) => cms.listShifts(token, { signal: s }).then((r) => r.shifts), [token]);
  const doctors = useAsync((s) => admin.listDoctors(token, { signal: s }).then((r) => r.doctors), [token]);
  const staff = useAsync((s) => cms.listStaff(token, { signal: s }).then((r) => r.staff), [token]);

  const shiftList = shifts.data ?? [];
  const doctorList = doctors.data ?? [];
  const staffList = staff.data ?? [];

  const [open, setOpen] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [person, setPerson] = useState(''); // "doctor:3" | "staff:5"

  const nameOf = (a) => {
    if (a.doctorId != null) return doctorList.find((d) => d.id === a.doctorId)?.fullName ?? `Doctor #${a.doctorId}`;
    if (a.staffId != null) return staffList.find((s) => s.id === a.staffId)?.fullName ?? `Staff #${a.staffId}`;
    return '—';
  };
  const shiftName = (id) => shiftList.find((s) => s.id === id)?.name ?? `#${id}`;

  const submit = async (e) => {
    e.preventDefault();
    const [kind, id] = person.split(':');
    const who = kind === 'doctor' ? { doctorId: Number(id) } : { staffId: Number(id) };
    const ok = await add({ shiftId: Number(shiftId), date, ...who });
    if (ok) { setShiftId(''); setPerson(''); setOpen(false); }
  };

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Roster</h1>
          <p className="section__sub">Who is on duty, by shift and day.</p>
        </div>
        <div className="section__actions">
          <button className="btn btn-ghost" onClick={refetch}>Refresh</button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus aria-hidden="true" /> Assign</button>
        </div>
      </div>

      <div className="filters">
        <label className="field field--sm">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      {loading && <p className="muted">Loading roster…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {!loading && !error && (
        <div className="card table-card">
          <table className="table">
            <thead><tr><th>Shift</th><th>Person</th><th>Type</th><th aria-label="Actions"></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan="4" className="muted">Nobody assigned on {date}.</td></tr>}
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{shiftName(a.shiftId)}</td>
                  <td>{nameOf(a)}</td>
                  <td><span className="pill pill-muted">{a.doctorId != null ? 'Doctor' : 'Staff'}</span></td>
                  <td className="row-actions">
                    <button className="icon-btn icon-btn--danger" onClick={() => del(a.id)}
                            aria-label="Remove assignment"><IconTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Assign to shift — ${date}`}>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span>Shift</span>
              <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} required>
                <option value="" disabled>Choose…</option>
                {shiftList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Person</span>
              <select value={person} onChange={(e) => setPerson(e.target.value)} required>
                <option value="" disabled>Choose…</option>
                {doctorList.length > 0 && (
                  <optgroup label="Doctors">
                    {doctorList.map((d) => <option key={`d${d.id}`} value={`doctor:${d.id}`}>{d.fullName}</option>)}
                  </optgroup>
                )}
                {staffList.length > 0 && (
                  <optgroup label="Staff">
                    {staffList.map((s) => <option key={`s${s.id}`} value={`staff:${s.id}`}>{s.fullName}</option>)}
                  </optgroup>
                )}
              </select>
            </label>
          </div>
          {mutError && <p className="form-error" role="alert">{mutError.message}</p>}
          <div className="modal__foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !shiftId || !person}>
              {busy ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
