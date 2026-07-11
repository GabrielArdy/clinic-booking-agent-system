import { useState } from 'react';
import { cms } from '../../../api/client';
import { useCrud } from '../../../hooks/useCrud';
import Modal from '../../../components/Modal';
import { IconPlus } from '../../../components/icons';

// Specialties CMS. DELETE is a soft deactivate in the contract, so the row never
// leaves the list — the Active/Inactive toggle (PUT) is the real control.
export default function CmsSpecialties({ token }) {
  const { items, loading, error, refetch, add, patch, busy, mutError } = useCrud({
    load: (signal) => cms.listSpecialties(token, { signal }).then((r) => r.specialties),
    create: (body) => cms.createSpecialty(token, body).then((r) => r.specialty),
    remove: (id) => cms.deleteSpecialty(token, id),
    deps: [token],
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await add({ name: name.trim(), description: description.trim() || null });
    if (ok) { setName(''); setDescription(''); setOpen(false); }
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
        <div className="section__actions">
          <button className="btn btn-ghost" onClick={refetch}>Refresh</button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus aria-hidden="true" /> Add specialty</button>
        </div>
      </div>

      {loading && <p className="muted">Loading specialties…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {!loading && !error && (
        <div className="card table-card">
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Status</th><th aria-label="Actions"></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan="5" className="muted">No specialties yet. Add your first one.</td></tr>}
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
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add specialty">
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)}
                     minLength={2} maxLength={100} required autoFocus placeholder="Cardiology" />
            </label>
            <label className="field">
              <span>Description <em className="opt">optional</em></span>
              <input value={description} onChange={(e) => setDescription(e.target.value)}
                     maxLength={300} placeholder="Heart & vascular care" />
            </label>
          </div>
          {mutError && <p className="form-error" role="alert">{mutError.message}</p>}
          <div className="modal__foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
              {busy ? 'Saving…' : 'Add specialty'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
