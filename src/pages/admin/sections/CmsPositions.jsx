import { useState } from 'react';
import { cms } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import { IconTrash } from '../../../components/icons';

const EMPTY = { positionCode: '', positionName: '', groupCode: '' };

// Positions (MasterPosition) = { id, positionCode, positionName, groupCode }.
// No status flag; DELETE is a hard delete → drop the row on success.
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
        positionCode: form.positionCode.trim(),
        positionName: form.positionName.trim(),
        groupCode: form.groupCode,
      });
      setForm(EMPTY); posQ.refetch();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const remove = async (code) => {
    try { await cms.deletePosition(token, code); posQ.refetch(); }
    catch (err) { setError(err.message); }
  };

  const groupName = (code) => groups.find((g) => g.groupCode === code)?.groupName ?? code;
  const canSubmit = form.positionCode.trim() && form.positionName.trim() && form.groupCode && !busy;

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
            <input value={form.positionCode} onChange={set('positionCode')} maxLength={50} required placeholder="D012" />
          </label>
          <label className="field">
            <span>Name</span>
            <input value={form.positionName} onChange={set('positionName')} maxLength={100} required placeholder="Specialist Doctor" />
          </label>
          <label className="field">
            <span>Group</span>
            <select value={form.groupCode} onChange={set('groupCode')} required
                    disabled={groupsQ.loading || !!groupsQ.error}>
              <option value="">
                {groupsQ.loading ? 'Loading…' : groupsQ.error ? 'Failed to load' : 'Select a group…'}
              </option>
              {groups.map((g) => <option key={g.groupCode} value={g.groupCode}>{g.groupName} ({g.groupCode})</option>)}
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
            <thead><tr><th>Code</th><th>Name</th><th>Group</th><th></th></tr></thead>
            <tbody>
              {positions.length === 0 && <tr><td colSpan="4" className="muted">No positions yet.</td></tr>}
              {positions.map((p) => (
                <tr key={p.positionCode}>
                  <td><code>{p.positionCode}</code></td>
                  <td>{p.positionName}</td>
                  <td>{groupName(p.groupCode)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn icon-btn--danger" aria-label={`Delete ${p.positionName}`}
                              onClick={() => remove(p.positionCode)}><IconTrash /></button>
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
