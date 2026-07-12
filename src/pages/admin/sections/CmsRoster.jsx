import { useState } from 'react';
import { cms, admin } from '../../../api/client';
import { useCrud } from '../../../hooks/useCrud';
import { useAsync } from '../../../hooks/useAsync';
import Modal from '../../../components/Modal';
import { IconTrash, IconPlus } from '../../../components/icons';
import {
  Button, Input, Select, Badge,
  TableCard, Table, THead, TH, TBody, TR, TD,
  PageHeader, FormGrid, ModalFooter,
} from '../../../components/base';

const today = () => new Date().toISOString().slice(0, 10);

// On-duty roster: assign a shift to exactly one doctor OR staff member for a date.
// The person picker encodes the choice as "doctor:<id>" / "staff:<id>" so the
// XOR constraint is impossible to violate from the UI.
export default function CmsRoster({ token }) {
  const [date, setDate] = useState(today);

  const { items, loading, error, refetch, add, del, busy, mutError } = useCrud({
    load: (signal) => cms.listAssignments(token, date, { signal }).then((r) => r.assignments),
    create: (body) => cms.createAssignment(token, body).then((r) => r.assignment),
    remove: (id) => cms.deleteAssignment(token, id),
    deps: [token, date],
  });

  // Pickers — read-only reference lists (no refetch on date change).
  const shifts = useAsync((s) => cms.listShifts(token, { signal: s }).then((r) => r.shifts), [token]);
  const doctors = useAsync((s) => admin.listDoctors(token, { signal: s }).then((r) => r.doctors), [token]);
  const staff = useAsync((s) => cms.listStaff(token, { signal: s }).then((r) => r.staff), [token]);

  const shiftList = shifts.data ?? [];
  const doctorList = doctors.data ?? [];
  const staffList = staff.data ?? [];

  const [open, setOpen] = useState(false);
  const [shiftId, setShiftId] = useState('');
  const [person, setPerson] = useState(''); // "doctor:3" | "staff:5"

  const nameOf = (a) => {
    if (a.doctorId != null) return doctorList.find((d) => d.id === a.doctorId)?.fullName ?? `Doctor #${a.doctorId}`;
    if (a.staffId != null) return staffList.find((s) => s.id === a.staffId)?.fullName ?? `Staff #${a.staffId}`;
    return '—';
  };
  const shiftName = (id) => shiftList.find((s) => s.id === id)?.name ?? `#${id}`;

  const submit = async (e) => {
    e.preventDefault();
    const [kind, id] = person.split(':');
    const who = kind === 'doctor' ? { doctorId: Number(id) } : { staffId: Number(id) };
    const ok = await add({ shiftId: Number(shiftId), date, ...who });
    if (ok) { setShiftId(''); setPerson(''); setOpen(false); }
  };

  return (
    <section>
      <PageHeader title="Roster" subtitle="Who is on duty, by shift and day.">
        <Button variant="secondary" onClick={refetch}>Refresh</Button>
        <Button iconLeading={IconPlus} onClick={() => setOpen(true)}>Assign</Button>
      </PageHeader>

      <div className="mb-4 w-48">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {loading && <p className="text-sm text-gray-500">Loading roster…</p>}
      {error && <p className="text-sm text-error-600" role="alert">{error.message}</p>}
      {!loading && !error && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>Shift</TH><TH>Person</TH><TH>Type</TH><TH aria-label="Actions" /></TR></THead>
            <TBody>
              {items.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="4" className="text-gray-500">Nobody assigned on {date}.</TD></TR>}
              {items.map((a) => (
                <TR key={a.id}>
                  <TD className="font-medium text-gray-900">{shiftName(a.shiftId)}</TD>
                  <TD>{nameOf(a)}</TD>
                  <TD><Badge color={a.doctorId != null ? 'brand' : 'gray'}>{a.doctorId != null ? 'Doctor' : 'Staff'}</Badge></TD>
                  <TD className="text-right">
                    <Button variant="destructive-secondary" size="sm" className="size-9 px-0"
                            onClick={() => del(a.id)} aria-label="Remove assignment" iconLeading={IconTrash} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableCard>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Assign to shift — ${date}`}>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FormGrid>
            <Select label="Shift" value={shiftId} onChange={(e) => setShiftId(e.target.value)} required>
              <option value="" disabled>Choose…</option>
              {shiftList.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
              ))}
            </Select>
            <Select label="Person" value={person} onChange={(e) => setPerson(e.target.value)} required>
              <option value="" disabled>Choose…</option>
              {doctorList.length > 0 && (
                <optgroup label="Doctors">
                  {doctorList.map((d) => <option key={`d${d.id}`} value={`doctor:${d.id}`}>{d.fullName}</option>)}
                </optgroup>
              )}
              {staffList.length > 0 && (
                <optgroup label="Staff">
                  {staffList.map((s) => <option key={`s${s.id}`} value={`staff:${s.id}`}>{s.fullName}</option>)}
                </optgroup>
              )}
            </Select>
          </FormGrid>
          {mutError && <p className="text-sm text-error-600" role="alert">{mutError.message}</p>}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !shiftId || !person}>{busy ? 'Assigning…' : 'Assign'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </section>
  );
}
