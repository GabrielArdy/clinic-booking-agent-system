import { useState } from 'react';
import { cms } from '../../../api/client';
import { useCrud } from '../../../hooks/useCrud';
import { IconTrash } from '../../../components/icons';

// Slot presets (reusable consultation lengths) + shift templates. Both are hard
// deletes per the contract, so the trash button removes the row outright.
export default function CmsScheduling({ token }) {
  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Scheduling</h1>
          <p className="section__sub">Reusable slot lengths and named shift templates.</p>
        </div>
      </div>
      <SlotPresets token={token} />
      <Shifts token={token} />
    </section>
  );
}

function SlotPresets({ token }) {
  const { items, loading, error, add, del, busy, mutError } = useCrud({
    load: (signal) => cms.listSlotPresets(token, { signal }).then((r) => r.slotPresets),
    create: (body) => cms.createSlotPreset(token, body).then((r) => r.slotPreset),
    remove: (id) => cms.deleteSlotPreset(token, id),
    deps: [token],
  });

  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await add({ label: label.trim(), minutes: Number(minutes) });
    if (ok) { setLabel(''); setMinutes(''); }
  };

  return (
    <form className="card panel" onSubmit={submit}>
      <h2>Slot presets</h2>
      <div className="form-row">
        <label className="field">
          <span>Label</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)}
                 maxLength={60} required placeholder="Standard consult" />
        </label>
        <label className="field field--sm">
          <span>Minutes</span>
          <input type="number" min="5" max="240" value={minutes}
                 onChange={(e) => setMinutes(e.target.value)} required placeholder="30" />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy || !label.trim() || !minutes}>
          {busy ? 'Saving…' : 'Add preset'}
        </button>
      </div>
      {mutError && <p className="form-error" role="alert">{mutError.message}</p>}

      {loading && <p className="muted">Loading presets…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {!loading && !error && (
        <table className="table" style={{ marginTop: 'var(--s-4)' }}>
          <thead><tr><th>ID</th><th>Label</th><th>Minutes</th><th aria-label="Actions"></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan="4" className="muted">No presets yet.</td></tr>}
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.label}</td>
                <td>{p.minutes} min</td>
                <td className="row-actions">
                  <button className="icon-btn icon-btn--danger" onClick={() => del(p.id)}
                          aria-label={`Delete ${p.label}`}><IconTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </form>
  );
}

function Shifts({ token }) {
  const { items, loading, error, add, del, busy, mutError } = useCrud({
    load: (signal) => cms.listShifts(token, { signal }).then((r) => r.shifts),
    create: (body) => cms.createShift(token, body).then((r) => r.shift),
    remove: (id) => cms.deleteShift(token, id),
    deps: [token],
  });

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await add({ name: name.trim(), startTime, endTime });
    if (ok) { setName(''); setStartTime(''); setEndTime(''); }
  };

  return (
    <form className="card panel" onSubmit={submit}>
      <h2>Shift templates</h2>
      <div className="form-row">
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)}
                 maxLength={60} required placeholder="Morning" />
        </label>
        <label className="field field--sm">
          <span>Start</span>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </label>
        <label className="field field--sm">
          <span>End</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy || !name.trim() || !startTime || !endTime}>
          {busy ? 'Saving…' : 'Add shift'}
        </button>
      </div>
      {mutError && <p className="form-error" role="alert">{mutError.message}</p>}

      {loading && <p className="muted">Loading shifts…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {!loading && !error && (
        <table className="table" style={{ marginTop: 'var(--s-4)' }}>
          <thead><tr><th>ID</th><th>Name</th><th>Window</th><th aria-label="Actions"></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan="4" className="muted">No shifts yet.</td></tr>}
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.startTime}–{s.endTime}</td>
                <td className="row-actions">
                  <button className="icon-btn icon-btn--danger" onClick={() => del(s.id)}
                          aria-label={`Delete ${s.name}`}><IconTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </form>
  );
}
