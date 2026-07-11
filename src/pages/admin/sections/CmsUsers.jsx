import { useState } from 'react';
import { admin, cms } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import Modal from '../../../components/Modal';
import { IconPlus } from '../../../components/icons';

const EMPTY = { fullName: '', email: '', password: '', positionCode: '', link: '', roles: [] };

// User accounts (CMS_POSITION). Create sets an initial password (scrypt server-side).
// `link` encodes the optional doctor/staff data-scope in one control ("type:id").
// Roles left empty → backend applies the position's group default bundle.
export default function CmsUsers({ token }) {
  const usersQ = useAsync((signal) => cms.listUsers(token, { signal }), [token]);
  const posQ = useAsync((signal) => cms.listPositions(token, { signal }), [token]);
  const rolesQ = useAsync((signal) => cms.listRoles(token, { signal }), [token]);
  const doctorsQ = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const staffQ = useAsync((signal) => cms.listStaff(token, { signal }), [token]);

  const users = usersQ.data?.users ?? [];
  const positions = posQ.data?.positions ?? [];
  const roles = rolesQ.data?.roles ?? [];
  const doctors = doctorsQ.data?.doctors ?? [];
  const staff = staffQ.data?.staff ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleRole = (code) => setForm((f) => ({
    ...f,
    roles: f.roles.includes(code) ? f.roles.filter((r) => r !== code) : [...f.roles, code],
  }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const [linkType, linkId] = form.link ? form.link.split(':') : [];
      const body = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        positionCode: form.positionCode,
        doctorId: linkType === 'doctor' ? Number(linkId) : null,
        staffId: linkType === 'staff' ? Number(linkId) : null,
      };
      if (form.roles.length) body.roles = form.roles;      // else server uses the group default
      await cms.createUser(token, body);
      setForm(EMPTY); setOpen(false); usersQ.refetch();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const setStatus = async (u, status) => {
    try {
      const { user } = await cms.updateUser(token, u.id, { status });
      usersQ.setData((prev) => ({ users: (prev?.users ?? []).map((x) => (x.id === u.id ? user : x)) }));
    } catch (err) { setError(err.message); }
  };

  const posName = (code) => positions.find((p) => p.positionCode === code)?.positionName ?? code;
  const canSubmit = form.fullName.trim() && form.email.trim() && form.password && form.positionCode && !busy;

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>User accounts</h1>
          <p className="section__sub">Login accounts, positions, and data links.</p>
        </div>
        <div className="section__actions">
          <button className="btn btn-ghost" onClick={usersQ.refetch}>Refresh</button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus aria-hidden="true" /> Add user</button>
        </div>
      </div>

      {error && !open && <p className="form-error" role="alert">{error}</p>}
      {usersQ.loading && <p className="muted">Loading users…</p>}
      {usersQ.error && <p className="form-error" role="alert">{usersQ.error.message}</p>}
      {!usersQ.loading && !usersQ.error && (
        <div className="card table-card">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Position</th><th>Roles</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan="6" className="muted">No users yet.</td></tr>}
              {users.map((u) => {
                const inactive = u.status === 'INACTIVE';
                return (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.positionName ?? posName(u.positionCode)}</td>
                    <td className="muted">{(u.roles ?? []).length} role(s)</td>
                    <td>
                      <span className={`pill ${inactive ? 'pill-muted' : 'pill-success'}`}>
                        {inactive ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button className="btn btn-ghost btn-sm"
                              onClick={() => setStatus(u, inactive ? 'ACTIVE' : 'INACTIVE')}>
                        {inactive ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title="Add user">
        <form onSubmit={create}>
          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input value={form.fullName} onChange={set('fullName')} maxLength={100} required autoFocus placeholder="Dr. Amanda Putri" />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} maxLength={200} required placeholder="amanda@clinic.test" />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={form.password} onChange={set('password')} minLength={8} required
                     autoComplete="new-password" placeholder="Initial password" />
            </label>
            <label className="field">
              <span>Position</span>
              <select value={form.positionCode} onChange={set('positionCode')} required
                      disabled={posQ.loading || !!posQ.error}>
                <option value="">{posQ.loading ? 'Loading…' : 'Select a position…'}</option>
                {positions.map((p) => <option key={p.positionCode} value={p.positionCode}>{p.positionName} ({p.positionCode})</option>)}
              </select>
            </label>
            <label className="field field--full">
              <span>Link to <em className="opt">optional</em></span>
              <select value={form.link} onChange={set('link')}>
                <option value="">No data link</option>
                <optgroup label="Doctor">
                  {doctors.map((d) => <option key={`d${d.id}`} value={`doctor:${d.id}`}>{d.fullName}</option>)}
                </optgroup>
                <optgroup label="Staff">
                  {staff.map((s) => <option key={`s${s.id}`} value={`staff:${s.id}`}>{s.fullName}</option>)}
                </optgroup>
              </select>
            </label>
          </div>

          <div className="field field--full">
            <span>Roles <em className="opt">optional — blank uses the position’s defaults</em></span>
            <div className="role-grid">
              {rolesQ.loading && <span className="muted">Loading roles…</span>}
              {roles.map((r) => (
                <label key={r.roleCode} className="role-chip">
                  <input type="checkbox" checked={form.roles.includes(r.roleCode)} onChange={() => toggleRole(r.roleCode)} />
                  <span>{r.roleName ?? r.roleCode}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal__foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {busy ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
