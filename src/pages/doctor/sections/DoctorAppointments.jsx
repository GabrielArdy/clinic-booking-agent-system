import { useState } from 'react';
import { doctor } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import { todayISO } from '../../../lib/calendar';
import {
  Badge, Card,
  TableCard, Table, THead, TH, TBody, TR, TD, PageHeader,
} from '../../../components/base';

const plusDays = (iso, n) => {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function DetailRow({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{children}</dd>
    </div>
  );
}

// Own appointment list (DOC_APPOINTMENT) + on-demand detail by reference.
export default function DoctorAppointments({ token }) {
  const from = todayISO();
  const to = plusDays(from, 30);
  const listQ = useAsync((signal) => doctor.listAppointments(token, { from, to }, { signal }), [token]);
  const appointments = listQ.data?.appointments ?? [];

  const [ref, setRef] = useState('');
  const detailQ = useAsync(
    (signal) => (ref ? doctor.getAppointment(token, ref, { signal }) : Promise.resolve(null)),
    [token, ref],
  );
  const detail = detailQ.data;

  return (
    <section>
      <PageHeader title="My appointments" subtitle="Next 30 days. Select a row for detail." />

      {detail && (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">{detail.appointment.reference}</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <DetailRow label="Patient">{detail.patient.fullName}</DetailRow>
            <DetailRow label="Phone">{detail.patient.phone}</DetailRow>
            <DetailRow label="Date">{detail.appointment.date}</DetailRow>
            <DetailRow label="Time">{detail.appointment.startTime}–{detail.appointment.endTime}</DetailRow>
            <DetailRow label="Status">
              <Badge color={detail.appointment.status === 'active' ? 'success' : 'gray'} dot>{detail.appointment.status}</Badge>
            </DetailRow>
          </dl>
        </Card>
      )}
      {detailQ.error && <p className="mb-4 text-sm text-error-600" role="alert">{detailQ.error.message}</p>}

      {listQ.loading && <p className="text-sm text-gray-500">Loading…</p>}
      {listQ.error && <p className="text-sm text-error-600" role="alert">{listQ.error.message}</p>}
      {!listQ.loading && !listQ.error && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>Date</TH><TH>Time</TH><TH>Patient</TH><TH>Status</TH><TH>Ref</TH></TR></THead>
            <TBody>
              {appointments.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="5" className="text-gray-500">No appointments in the next 30 days.</TD></TR>}
              {appointments.map((a) => (
                <TR key={a.id} onClick={() => setRef(a.reference)}
                    className={`cursor-pointer ${ref === a.reference ? 'bg-brand-50/60 hover:bg-brand-50/60' : ''}`}>
                  <TD className="font-medium text-gray-900">{a.date}</TD>
                  <TD>{a.startTime}–{a.endTime}</TD>
                  <TD>{a.patient.fullName}</TD>
                  <TD><Badge color={a.status === 'active' ? 'success' : 'gray'} dot>{a.status}</Badge></TD>
                  <TD><code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{a.reference}</code></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableCard>
      )}
    </section>
  );
}
