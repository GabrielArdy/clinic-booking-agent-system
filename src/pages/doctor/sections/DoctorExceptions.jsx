import { useState } from 'react';
import { doctor } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import { todayISO } from '../../../lib/calendar';
import {
  Button, Input, Checkbox, Card,
  TableCard, Table, THead, TH, TBody, TR, TD, PageHeader,
} from '../../../components/base';

const plusDays = (iso, n) => {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Own blocking time (DOC_EXCEPTION). Whole-day = null start/end.
export default function DoctorExceptions({ token }) {
  const from = todayISO();
  const to = plusDays(from, 90);
  const q = useAsync((signal) => doctor.listExceptions(token, { from, to }, { signal }), [token]);
  const exceptions = q.data?.exceptions ?? [];

  const [form, setForm] = useState({ date: from, allDay: false, startTime: '09:00', endTime: '10:00', reason: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await doctor.createException(token, {
        date: form.date,
        startTime: form.allDay ? null : form.startTime,
        endTime: form.allDay ? null : form.endTime,
        reason: form.reason.trim() || null,
      });
      setForm((f) => ({ ...f, reason: '' }));
      q.refetch();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <section>
      <PageHeader title="Blocking time" subtitle="Block a whole day or a window when you’re unavailable." />

      <Card className="mb-6 p-6" as="form" onSubmit={create}>
        <h2 className="mb-4 text-base font-semibold text-gray-900">Add blocking time</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44"><Input label="Date" type="date" value={form.date} min={from} onChange={set('date')} required /></div>
          <div className="pb-2.5">
            <Checkbox label="Whole day" checked={form.allDay}
                      onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))} />
          </div>
          {!form.allDay && (
            <>
              <div className="w-32"><Input label="Start" type="time" value={form.startTime} onChange={set('startTime')} required /></div>
              <div className="w-32"><Input label="End" type="time" value={form.endTime} onChange={set('endTime')} required /></div>
            </>
          )}
          <div className="min-w-56 flex-1"><Input label="Reason (optional)" value={form.reason} onChange={set('reason')} maxLength={200} placeholder="e.g. conference" /></div>
          <Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Block time'}</Button>
        </div>
        {error && <p className="mt-3 text-sm text-error-600" role="alert">{error}</p>}
      </Card>

      {q.loading && <p className="text-sm text-gray-500">Loading…</p>}
      {q.error && <p className="text-sm text-error-600" role="alert">{q.error.message}</p>}
      {!q.loading && !q.error && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>Date</TH><TH>Time</TH><TH>Reason</TH></TR></THead>
            <TBody>
              {exceptions.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="3" className="text-gray-500">No blocking time in the next 90 days.</TD></TR>}
              {exceptions.map((ex) => (
                <TR key={ex.id}>
                  <TD className="font-medium text-gray-900">{ex.date}</TD>
                  <TD>{ex.startTime ? `${ex.startTime} – ${ex.endTime}` : 'All day'}</TD>
                  <TD className="text-gray-500">{ex.reason ?? '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableCard>
      )}
    </section>
  );
}
