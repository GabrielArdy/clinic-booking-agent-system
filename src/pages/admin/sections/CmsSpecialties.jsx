import { useState } from 'react';
import { cms } from '../../../api/client';
import { useCrud } from '../../../hooks/useCrud';
import Modal from '../../../components/Modal';
import { IconPlus } from '../../../components/icons';
import {
  Button, Input, Badge,
  TableCard, Table, THead, TH, TBody, TR, TD,
  PageHeader, FormGrid, ModalFooter,
} from '../../../components/base';

// Specialties CMS. DELETE is a soft deactivate in the contract, so the row never
// leaves the list — the Active/Inactive toggle (PUT) is the real control.
export default function CmsSpecialties({ token }) {
  const { items, loading, error, refetch, add, patch, busy, mutError } = useCrud({
    load: (signal) => cms.listSpecialties(token, { signal }).then((r) => r.specialties),
    create: (body) => cms.createSpecialty(token, body).then((r) => r.specialty),
    remove: (id) => cms.deleteSpecialty(token, id),
    deps: [token],
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await add({ name: name.trim(), description: description.trim() || null });
    if (ok) { setName(''); setDescription(''); setOpen(false); }
  };

  const toggle = async (s) => {
    const { specialty } = await cms.updateSpecialty(token, s.id, { active: !s.active });
    patch(specialty);
  };

  return (
    <section>
      <PageHeader title="Specialties" subtitle="Clinical departments patients can book into.">
        <Button variant="secondary" onClick={refetch}>Refresh</Button>
        <Button iconLeading={IconPlus} onClick={() => setOpen(true)}>Add specialty</Button>
      </PageHeader>

      {loading && <p className="text-sm text-gray-500">Loading specialties…</p>}
      {error && <p className="text-sm text-error-600" role="alert">{error.message}</p>}
      {!loading && !error && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>ID</TH><TH>Name</TH><TH>Description</TH><TH>Status</TH><TH aria-label="Actions" /></TR></THead>
            <TBody>
              {items.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="5" className="text-gray-500">No specialties yet. Add your first one.</TD></TR>}
              {items.map((s) => (
                <TR key={s.id}>
                  <TD className="text-gray-500">{s.id}</TD>
                  <TD className="font-medium text-gray-900">{s.name}</TD>
                  <TD className="text-gray-500">{s.description || '—'}</TD>
                  <TD><Badge color={s.active ? 'success' : 'gray'} dot>{s.active ? 'Active' : 'Inactive'}</Badge></TD>
                  <TD className="text-right">
                    <Button variant="secondary" size="sm" onClick={() => toggle(s)}>
                      {s.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableCard>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add specialty">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FormGrid>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)}
                   minLength={2} maxLength={100} required autoFocus placeholder="Cardiology" />
            <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
                   maxLength={300} placeholder="Heart & vascular care" />
          </FormGrid>
          {mutError && <p className="text-sm text-error-600" role="alert">{mutError.message}</p>}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !name.trim()}>{busy ? 'Saving…' : 'Add specialty'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </section>
  );
}
