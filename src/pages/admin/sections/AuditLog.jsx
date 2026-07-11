import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';

const LIMIT = 50;
const fmt = (iso) => new Date(iso).toLocaleString();

export default function AuditLog({ token }) {
  const [offset, setOffset] = useState(0);
  const [eventType, setEventType] = useState('');

  // Refetch on page/filter change. eventType is applied on submit, not per keystroke.
  const [applied, setApplied] = useState('');
  const q = useAsync(
    (signal) => admin.listAuditLogs(token, { limit: LIMIT, offset, eventType: applied || undefined }, { signal }),
    [token, offset, applied],
  );
  const logs = q.data?.auditLogs ?? [];
  const atEnd = logs.length < LIMIT;

  const applyFilter = (e) => { e.preventDefault(); setOffset(0); setApplied(eventType.trim()); };

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Audit Log</h1>
          <p className="section__sub">Newest activity first.</p>
        </div>
        <button className="btn btn-ghost" onClick={q.refetch}>Refresh</button>
      </div>

      <form className="filters" onSubmit={applyFilter}>
        <label className="field">
          <span>Event type</span>
          <input value={eventType} onChange={(e) => setEventType(e.target.value)}
                 placeholder="e.g. user.login (blank = all)" />
        </label>
        <button className="btn btn-primary btn-sm" type="submit">Filter</button>
      </form>

      {q.loading && <p className="muted">Loading…</p>}
      {q.error && <p className="form-error" role="alert">{q.error.message}</p>}
      {!q.loading && !q.error && (
        <>
          <div className="card table-card">
            <table className="table">
              <thead><tr><th>ID</th><th>Event</th><th>Details</th><th>When</th></tr></thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan="4" className="muted">No entries.</td></tr>}
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td><code>{l.eventType}</code></td>
                    <td><pre className="audit-payload">{JSON.stringify(l.payload)}</pre></td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmt(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button className="btn btn-ghost btn-sm" disabled={offset === 0}
                    onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}>Previous</button>
            <span className="muted">Rows {offset + 1}–{offset + logs.length}</span>
            <button className="btn btn-ghost btn-sm" disabled={atEnd}
                    onClick={() => setOffset((o) => o + LIMIT)}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}
