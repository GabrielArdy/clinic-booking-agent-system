import { useState } from 'react';
import { cms } from '../../../api/client';
import { useCrud } from '../../../hooks/useCrud';

// Specialties CMS. DELETE is a soft deactivate in the contract, so the row never
// leaves the list — the Active/Inactive toggle (PUT) is the real control.
export default function CmsSpecialties({ token }) {
  const { items, loading, error, refetch, add, patch, busy, mutError } = useCrud({
    load: (signal) => cms.listSpecialties(token, { signal }).then((r) => r.specialties),
    create: (body) => cms.createSpecialty(token, body).then((r) => r.specialty),
    remove: (id) => cms.deleteSpecialty(token, id),
    deps: [token],
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await add({ name: name.trim(), description: description.trim() || null });
    if (ok) { setName(''); setDescription(''); }
  };

  const toggle = async (s) => {
    const { specialty } = await cms.updateSpecialty(token, s.id, { active: !s.active });
    patch(specialty);
  };

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Specialties</h1>
          <p className="section__sub">Clinical departments patients can book into.</p>
        </div>
        <button className="btn btn-ghost" onClick={refetch}>Refresh</button>
      </div>

      <form className="card panel" onSubmit={submit}>
        <h2>Add specialty</h2>
        <div className="form-row">
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)}
                   minLength={2} maxLength={100} required placeholder="Cardiology" />
          </label>
          <label className="field">
            <span>Description <em className="opt">optional</em></span>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
                   maxLength={300} placeholder="Heart & vascular care" />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy || !name.trim()}>
            {busy ? 'Saving…' : 'Add specialty'}
          </button>
        </div>
        {mutError && <p className="form-error" role="alert">{mutError.message}</p>}
      </form>

      {loading && <p className="muted">Loading specialties…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {!loading && !error && (
        <table className="table">
          <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Status</th><th aria-label="Actions"></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan="5" className="muted">No specialties yet.</td></tr>}
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td className="muted">{s.description || '—'}</td>
                <td><span className={`pill ${s.active ? 'pill-success' : 'pill-muted'}`}>{s.active ? 'Active' : 'Inactive'}</span></td>
                <td className="row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => toggle(s)}>
                    {s.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
