import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import {
  Button, Input, Select, Badge,
  TableCard, Table, THead, TH, TBody, TR, TD, PageHeader,
} from '../../../components/base';

const today = () => new Date().toISOString().slice(0, 10);

export default function Appointments({ token }) {
  const doctorsQ = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = doctorsQ.data?.doctors ?? [];
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(today());

  const canQuery = !!doctorId && !!date;
  const bookingsQ = useAsync(
    (signal) => admin.listBookings(token, { doctorId, date }, { signal }),
    [token, doctorId, date],
    { immediate: false },
  );
  const bookings = bookingsQ.data?.bookings ?? [];

  const load = () => { if (canQuery) bookingsQ.refetch(); };

  return (
    <section>
      <PageHeader title="Appointments" subtitle="View bookings by doctor and date." />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Select label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">Select…</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
          </Select>
        </div>
        <div className="w-44">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button onClick={load} disabled={!canQuery}>View</Button>
      </div>

      {!canQuery && <p className="text-sm text-gray-500">Pick a doctor and date, then View.</p>}
      {bookingsQ.loading && <p className="text-sm text-gray-500">Loading appointments…</p>}
      {bookingsQ.error && <p className="text-sm text-error-600" role="alert">{bookingsQ.error.message}</p>}
      {bookingsQ.data && !bookingsQ.loading && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>Reference</TH><TH>Time</TH><TH>Patient</TH><TH>Status</TH></TR></THead>
            <TBody>
              {bookings.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="4" className="text-gray-500">No appointments.</TD></TR>}
              {bookings.map((b) => (
                <TR key={b.id}>
                  <TD><code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{b.reference}</code></TD>
                  <TD>{b.startTime} – {b.endTime}</TD>
                  <TD>{b.patientId}</TD>
                  <TD><Badge color={b.status === 'active' ? 'success' : 'gray'} dot>{b.status}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableCard>
      )}
    </section>
  );
}
