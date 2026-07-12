import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import {
  Button, Input,
  TableCard, Table, THead, TH, TBody, TR, TD, PageHeader,
} from '../../../components/base';

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
    <section>
      <PageHeader title="Audit Log" subtitle="Newest activity first.">
        <Button variant="secondary" onClick={q.refetch}>Refresh</Button>
      </PageHeader>

      <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={applyFilter}>
        <div className="w-72">
          <Input label="Event type" value={eventType} onChange={(e) => setEventType(e.target.value)}
                 placeholder="e.g. user.login (blank = all)" />
        </div>
        <Button type="submit">Filter</Button>
      </form>

      {q.loading && <p className="text-sm text-gray-500">Loading…</p>}
      {q.error && <p className="text-sm text-error-600" role="alert">{q.error.message}</p>}
      {!q.loading && !q.error && (
        <>
          <TableCard>
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>ID</TH><TH>Event</TH><TH>Details</TH><TH>When</TH></TR></THead>
              <TBody>
                {logs.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="4" className="text-gray-500">No entries.</TD></TR>}
                {logs.map((l) => (
                  <TR key={l.id}>
                    <TD className="text-gray-500">{l.id}</TD>
                    <TD><code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{l.eventType}</code></TD>
                    <TD><pre className="max-w-md overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">{JSON.stringify(l.payload)}</pre></TD>
                    <TD className="whitespace-nowrap text-gray-500">{fmt(l.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableCard>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="secondary" size="sm" disabled={offset === 0}
                    onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}>Previous</Button>
            <span className="text-sm text-gray-500">Rows {offset + 1}–{offset + logs.length}</span>
            <Button variant="secondary" size="sm" disabled={atEnd}
                    onClick={() => setOffset((o) => o + LIMIT)}>Next</Button>
          </div>
        </>
      )}
    </section>
  );
}
