import { useState } from 'react';
import { cms } from '../../../api/client';
import { useCrud } from '../../../hooks/useCrud';
import Modal from '../../../components/Modal';
import { IconTrash, IconPlus } from '../../../components/icons';
import {
  Button, Input,
  Table, THead, TH, TBody, TR, TD,
  PageHeader, FormGrid, ModalFooter, Panel,
} from '../../../components/base';

// Slot presets (reusable consultation lengths) + shift templates. Both are hard
// deletes per the contract, so the trash button removes the row outright.
export default function CmsScheduling({ token }) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Scheduling" subtitle="Reusable slot lengths and named shift templates." />
      <SlotPresets token={token} />
      <Shifts token={token} />
    </section>
  );
}

function SlotPresets({ token }) {
  const { items, loading, error, add, del, busy, mutError } = useCrud({
    load: (signal) => cms.listSlotPresets(token, { signal }).then((r) => r.slotPresets),
    create: (body) => cms.createSlotPreset(token, body).then((r) => r.slotPreset),
    remove: (id) => cms.deleteSlotPreset(token, id),
    deps: [token],
  });

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await add({ label: label.trim(), minutes: Number(minutes) });
    if (ok) { setLabel(''); setMinutes(''); setOpen(false); }
  };

  return (
    <Panel title="Slot presets"
           action={<Button size="sm" iconLeading={IconPlus} onClick={() => setOpen(true)}>Add preset</Button>}>
      {loading && <p className="px-5 py-4 text-sm text-gray-500">Loading presets…</p>}
      {error && <p className="px-5 py-4 text-sm text-error-600" role="alert">{error.message}</p>}
      {!loading && !error && (
        <Table>
          <THead><TR className="hover:bg-transparent"><TH>ID</TH><TH>Label</TH><TH>Minutes</TH><TH aria-label="Actions" /></TR></THead>
          <TBody>
            {items.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="4" className="text-gray-500">No presets yet.</TD></TR>}
            {items.map((p) => (
              <TR key={p.id}>
                <TD className="text-gray-500">{p.id}</TD>
                <TD className="font-medium text-gray-900">{p.label}</TD>
                <TD>{p.minutes} min</TD>
                <TD className="text-right">
                  <Button variant="destructive-secondary" size="sm" className="size-9 px-0"
                          onClick={() => del(p.id)} aria-label={`Delete ${p.label}`} iconLeading={IconTrash} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add slot preset">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FormGrid>
            <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)}
                   maxLength={60} required autoFocus placeholder="Standard consult" />
            <Input label="Minutes" type="number" min="5" max="240" value={minutes}
                   onChange={(e) => setMinutes(e.target.value)} required placeholder="30" />
          </FormGrid>
          {mutError && <p className="text-sm text-error-600" role="alert">{mutError.message}</p>}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !label.trim() || !minutes}>{busy ? 'Saving…' : 'Add preset'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Panel>
  );
}

function Shifts({ token }) {
  const { items, loading, error, add, del, busy, mutError } = useCrud({
    load: (signal) => cms.listShifts(token, { signal }).then((r) => r.shifts),
    create: (body) => cms.createShift(token, body).then((r) => r.shift),
    remove: (id) => cms.deleteShift(token, id),
    deps: [token],
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await add({ name: name.trim(), startTime, endTime });
    if (ok) { setName(''); setStartTime(''); setEndTime(''); setOpen(false); }
  };

  return (
    <Panel title="Shift templates"
           action={<Button size="sm" iconLeading={IconPlus} onClick={() => setOpen(true)}>Add shift</Button>}>
      {loading && <p className="px-5 py-4 text-sm text-gray-500">Loading shifts…</p>}
      {error && <p className="px-5 py-4 text-sm text-error-600" role="alert">{error.message}</p>}
      {!loading && !error && (
        <Table>
          <THead><TR className="hover:bg-transparent"><TH>ID</TH><TH>Name</TH><TH>Window</TH><TH aria-label="Actions" /></TR></THead>
          <TBody>
            {items.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="4" className="text-gray-500">No shifts yet.</TD></TR>}
            {items.map((s) => (
              <TR key={s.id}>
                <TD className="text-gray-500">{s.id}</TD>
                <TD className="font-medium text-gray-900">{s.name}</TD>
                <TD>{s.startTime}–{s.endTime}</TD>
                <TD className="text-right">
                  <Button variant="destructive-secondary" size="sm" className="size-9 px-0"
                          onClick={() => del(s.id)} aria-label={`Delete ${s.name}`} iconLeading={IconTrash} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add shift template">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FormGrid>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)}
                   maxLength={60} required autoFocus placeholder="Morning" />
            <Input label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            <Input label="End" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </FormGrid>
          {mutError && <p className="text-sm text-error-600" role="alert">{mutError.message}</p>}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !name.trim() || !startTime || !endTime}>{busy ? 'Saving…' : 'Add shift'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Panel>
  );
}
