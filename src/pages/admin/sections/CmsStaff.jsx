import { useState } from 'react';
import { cms } from '../../../api/client';
import { useCrud } from '../../../hooks/useCrud';
import Modal from '../../../components/Modal';
import { IconPhone, IconPlus } from '../../../components/icons';

// Non-doctor staff (receptionists, nurses…). DELETE is soft — toggle Active via PUT.
export default function CmsStaff({ token }) {
  const { items, loading, error, refetch, add, patch, busy, mutError } = useCrud({
    load: (signal) => cms.listStaff(token, { signal }).then((r) => r.staff),
    create: (body) => cms.createStaff(token, body).then((r) => r.staff),
    remove: (id) => cms.deleteStaff(token, id),
    deps: [token],
  });

  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await add({
      fullName: fullName.trim(),
      role: role.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
    });
    if (ok) { setFullName(''); setRole(''); setEmail(''); setPhone(''); setOpen(false); }
  };

  const toggle = async (s) => {
    const { staff } = await cms.updateStaff(token, s.id, { active: !s.active });
    patch(staff);
  };

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Staff</h1>
          <p className="section__sub">Receptionists, nurses and other non-doctor team members.</p>
        </div>
        <div className="section__actions">
          <button className="btn btn-ghost" onClick={refetch}>Refresh</button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus aria-hidden="true" /> Add staff</button>
        </div>
      </div>

      {loading && <p className="muted">Loading staff…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {!loading && !error && (
        <div className="card table-card">
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Contact</th><th>Status</th><th aria-label="Actions"></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan="6" className="muted">No staff yet. Add your first team member.</td></tr>}
              {items.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.fullName}</td>
                  <td className="muted">{s.role || '—'}</td>
                  <td className="muted">
                    {s.email || '—'}
                    {s.phone && <span className="cell-phone"><IconPhone aria-hidden="true" /> {s.phone}</span>}
                  </td>
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add staff member">
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                     minLength={2} maxLength={100} required autoFocus placeholder="Sara Idris" />
            </label>
            <label className="field">
              <span>Role <em className="opt">optional</em></span>
              <input value={role} onChange={(e) => setRole(e.target.value)}
                     maxLength={60} placeholder="Receptionist" />
            </label>
            <label className="field">
              <span>Email <em className="opt">optional</em></span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     maxLength={200} placeholder="sara@clinic.co" />
            </label>
            <label className="field">
              <span>Phone <em className="opt">optional</em></span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                     maxLength={30} placeholder="0812…" />
            </label>
          </div>
          {mutError && <p className="form-error" role="alert">{mutError.message}</p>}
          <div className="modal__foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !fullName.trim()}>
              {busy ? 'Saving…' : 'Add staff'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
