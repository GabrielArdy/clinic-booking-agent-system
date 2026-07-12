import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import {
  Button, Input, Select, Checkbox, Card,
  TableCard, Table, THead, TH, TBody, TR, TD, PageHeader,
} from '../../../components/base';

// No GET for exceptions in the contract, so we keep a session-local list of the
// ones added this session (optimistic) — honest about not being a full history.
export default function Exceptions({ token }) {
  const doctorsQ = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = doctorsQ.data?.doctors ?? [];

  const [form, setForm] = useState({ doctorId: '', date: '', wholeDay: true, startTime: '', endTime: '', reason: '' });
  const [added, setAdded] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError(null);
    try {
      const body = {
        doctorId: Number(form.doctorId),
        date: form.date,
        startTime: form.wholeDay ? null : form.startTime || null,
        endTime: form.wholeDay ? null : form.endTime || null,
        reason: form.reason || null,
      };
      const { id } = await admin.createException(token, body);
      const doc = doctors.find((d) => d.id === body.doctorId);
      setAdded((prev) => [{ id, ...body, doctorName: doc?.fullName }, ...prev]);
      setForm((f) => ({ ...f, date: '', startTime: '', endTime: '', reason: '' }));
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <section>
      <PageHeader title="Exceptions" subtitle="Block days or windows off for a doctor." />

      <Card className="mb-6 p-6" as="form" onSubmit={submit}>
        <h2 className="mb-4 text-base font-semibold text-gray-900">Block time off</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Select label="Doctor" value={form.doctorId} onChange={set('doctorId')} required>
              <option value="">Select…</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
            </Select>
          </div>
          <div className="w-44"><Input label="Date" type="date" value={form.date} onChange={set('date')} required /></div>
          <div className="pb-2.5"><Checkbox label="Whole day" checked={form.wholeDay} onChange={set('wholeDay')} /></div>
        </div>
        {!form.wholeDay && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="w-32"><Input label="From" type="time" value={form.startTime} onChange={set('startTime')} /></div>
            <div className="w-32"><Input label="To" type="time" value={form.endTime} onChange={set('endTime')} /></div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <Input label="Reason (optional)" value={form.reason} onChange={set('reason')} maxLength={200}
                   placeholder="e.g. Clinic training" />
          </div>
          <Button type="submit" disabled={saving || !form.doctorId || !form.date}>
            {saving ? 'Saving…' : 'Add exception'}
          </Button>
        </div>
        {formError && <p className="mt-3 text-sm text-error-600" role="alert">{formError}</p>}
      </Card>

      {added.length > 0 && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>Doctor</TH><TH>Date</TH><TH>Window</TH><TH>Reason</TH></TR></THead>
            <TBody>
              {added.map((x) => (
                <TR key={x.id}>
                  <TD className="font-medium text-gray-900">{x.doctorName ?? x.doctorId}</TD>
                  <TD>{x.date}</TD>
                  <TD>{x.startTime ? `${x.startTime} – ${x.endTime}` : 'Whole day'}</TD>
                  <TD className="text-gray-500">{x.reason ?? '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableCard>
      )}
      <p className="mt-3 text-sm text-gray-500">Showing exceptions added this session (no list endpoint in the API).</p>
    </section>
  );
}
