import { useState } from 'react';
import { cms } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import { IconTrash } from '../../../components/icons';

const EMPTY = { code: '', name: '', groupCode: '' };

// Positions (master_position) keyed by string `code`. Belongs to a group. DELETE
// is a soft deactivate, so the row stays and just flips inactive → refetch.
export default function CmsPositions({ token }) {
  const posQ = useAsync((signal) => cms.listPositions(token, { signal }), [token]);
  const groupsQ = useAsync((signal) => cms.listGroups(token, { signal }), [token]);
  const positions = posQ.data?.positions ?? [];
  const groups = groupsQ.data?.groups ?? [];

  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await cms.createPosition(token, {
        code: form.code.trim(), name: form.name.trim(), groupCode: form.groupCode,
      });
      setForm(EMPTY); posQ.refetch();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const remove = async (code) => {
    try { await cms.deletePosition(token, code); posQ.refetch(); }
    catch (err) { setError(err.message); }
  };

  const groupName = (code) => groups.find((g) => g.code === code)?.name ?? code;
  const canSubmit = form.code.trim() && form.name.trim() && form.groupCode && !busy;

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Positions</h1>
          <p className="section__sub">Job positions users are assigned to.</p>
        </div>
        <button className="btn btn-ghost" onClick={posQ.refetch}>Refresh</button>
      </div>

      <form className="card panel" onSubmit={create}>
        <h2>Add position</h2>
        <div className="form-row">
          <label className="field field--sm">
            <span>Code</span>
            <input value={form.code} onChange={set('code')} maxLength={10} required placeholder="D012" />
          </label>
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={set('name')} maxLength={100} required placeholder="Specialist Doctor" />
          </label>
          <label className="field">
            <span>Group</span>
            <select value={form.groupCode} onChange={set('groupCode')} required
                    disabled={groupsQ.loading || !!groupsQ.error}>
              <option value="">
                {groupsQ.loading ? 'Loading…' : groupsQ.error ? 'Failed to load' : 'Select a group…'}
              </option>
              {groups.map((g) => <option key={g.code} value={g.code}>{g.name} ({g.code})</option>)}
            </select>
          </label>
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            {busy ? 'Adding…' : 'Add position'}
          </button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>

      {posQ.loading && <p className="muted">Loading…</p>}
      {posQ.error && <p className="form-error" role="alert">{posQ.error.message}</p>}
      {!posQ.loading && !posQ.error && (
        <div className="card table-card">
          <table className="table">
            <thead><tr><th>Code</th><th>Name</th><th>Group</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {positions.length === 0 && <tr><td colSpan="5" className="muted">No positions yet.</td></tr>}
              {positions.map((p) => (
                <tr key={p.code}>
                  <td><code>{p.code}</code></td>
                  <td>{p.name}</td>
                  <td>{groupName(p.groupCode)}</td>
                  <td>
                    <span className={`pill ${p.active === false ? 'pill-muted' : 'pill-success'}`}>
                      {p.active === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      {p.active !== false && (
                        <button className="icon-btn icon-btn--danger" aria-label={`Deactivate ${p.name}`}
                                onClick={() => remove(p.code)}><IconTrash /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
