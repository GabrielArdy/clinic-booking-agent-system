import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import { navigate } from '../../../lib/router';
import {
  IconDoctors, IconSchedules, IconExceptions, IconAppointments, IconArrowRight,
} from '../../../components/icons';
import {
  Button, Badge, Card,
  TableCard, Table, THead, TH, TBody, TR, TD, PageHeader,
} from '../../../components/base';

const CARDS = [
  { key: 'doctors', title: 'Doctors', desc: 'Add and review clinic doctors', Icon: IconDoctors },
  { key: 'schedules', title: 'Schedules', desc: 'Set weekly availability rules', Icon: IconSchedules },
  { key: 'exceptions', title: 'Exceptions', desc: 'Block days or windows off', Icon: IconExceptions },
  { key: 'appointments', title: 'Appointments', desc: 'View bookings by doctor & date', Icon: IconAppointments },
];

export default function Dashboard({ token }) {
  const { data, loading } = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = data?.doctors ?? [];
  const active = doctors.filter((d) => d.active).length;
  const specialties = new Set(doctors.map((d) => d.specialtyName ?? d.specialtyId)).size;

  const tiles = [
    { label: 'Doctors on file', value: loading ? '…' : doctors.length },
    { label: 'Active doctors', value: loading ? '…' : active },
    { label: 'Specialties', value: loading ? '…' : specialties },
    { label: 'Booking flow', value: 'Live' },
  ];

  return (
    <section>
      <PageHeader title="Dashboard" subtitle="Overview of your clinic at a glance." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <span className="text-sm text-gray-500">{t.label}</span>
            <span className="mt-1 block text-2xl font-semibold text-gray-900">{t.value}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Doctors</h2>
            <Button variant="secondary" size="sm" iconTrailing={IconArrowRight} onClick={() => navigate('/admin/doctors')}>
              Manage
            </Button>
          </div>
          <TableCard>
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>Name</TH><TH>Specialty</TH><TH>Status</TH></TR></THead>
              <TBody>
                {loading && <TR className="hover:bg-transparent"><TD colSpan="3" className="text-gray-500">Loading…</TD></TR>}
                {!loading && doctors.length === 0 && (
                  <TR className="hover:bg-transparent"><TD colSpan="3" className="text-gray-500">No doctors yet.</TD></TR>
                )}
                {doctors.slice(0, 6).map((d) => (
                  <TR key={d.id}>
                    <TD className="font-medium text-gray-900">{d.fullName}</TD>
                    <TD>{d.specialtyName ?? d.specialtyId}</TD>
                    <TD><Badge color={d.active ? 'success' : 'gray'} dot>{d.active ? 'Active' : 'Inactive'}</Badge></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableCard>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-gray-900">Quick actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {CARDS.map((c) => (
              <button key={c.key} onClick={() => navigate(`/admin/${c.key}`)}
                      className="flex flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-brand-300 hover:bg-brand-50/40 outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600" aria-hidden="true">
                  <c.Icon className="size-5" />
                </span>
                <span className="text-sm font-semibold text-gray-900">{c.title}</span>
                <span className="text-sm text-gray-500">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
