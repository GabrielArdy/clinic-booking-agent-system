import { useState } from 'react';
import { cms } from '../../../api/client';
import { useCrud } from '../../../hooks/useCrud';
import Modal from '../../../components/Modal';
import { IconPhone, IconPlus } from '../../../components/icons';
import {
  Button, Input, Badge,
  TableCard, Table, THead, TH, TBody, TR, TD,
  PageHeader, FormGrid, ModalFooter,
} from '../../../components/base';

// Non-doctor staff (receptionists, nurses…). DELETE is soft — toggle Active via PUT.
export default function CmsStaff({ token }) {
  const { items, loading, error, refetch, add, patch, busy, mutError } = useCrud({
    load: (signal) => cms.listStaff(token, { signal }).then((r) => r.staff),
    create: (body) => cms.createStaff(token, body).then((r) => r.staff),
    remove: (id) => cms.deleteStaff(token, id),
    deps: [token],
  });

  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const ok = await add({
      fullName: fullName.trim(),
      role: role.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
    });
    if (ok) { setFullName(''); setRole(''); setEmail(''); setPhone(''); setOpen(false); }
  };

  const toggle = async (s) => {
    const { staff } = await cms.updateStaff(token, s.id, { active: !s.active });
    patch(staff);
  };

  return (
    <section>
      <PageHeader title="Staff" subtitle="Receptionists, nurses and other non-doctor team members.">
        <Button variant="secondary" onClick={refetch}>Refresh</Button>
        <Button iconLeading={IconPlus} onClick={() => setOpen(true)}>Add staff</Button>
      </PageHeader>

      {loading && <p className="text-sm text-gray-500">Loading staff…</p>}
      {error && <p className="text-sm text-error-600" role="alert">{error.message}</p>}
      {!loading && !error && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>ID</TH><TH>Name</TH><TH>Role</TH><TH>Contact</TH><TH>Status</TH><TH aria-label="Actions" /></TR></THead>
            <TBody>
              {items.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="6" className="text-gray-500">No staff yet. Add your first team member.</TD></TR>}
              {items.map((s) => (
                <TR key={s.id}>
                  <TD className="text-gray-500">{s.id}</TD>
                  <TD className="font-medium text-gray-900">{s.fullName}</TD>
                  <TD className="text-gray-500">{s.role || '—'}</TD>
                  <TD className="text-gray-500">
                    <div className="flex flex-col gap-1">
                      <span>{s.email || '—'}</span>
                      {s.phone && <span className="inline-flex items-center gap-1.5"><IconPhone aria-hidden="true" className="size-4 text-gray-400" /> {s.phone}</span>}
                    </div>
                  </TD>
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add staff member">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FormGrid>
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                   minLength={2} maxLength={100} required autoFocus placeholder="Sara Idris" />
            <Input label="Role (optional)" value={role} onChange={(e) => setRole(e.target.value)}
                   maxLength={60} placeholder="Receptionist" />
            <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   maxLength={200} placeholder="sara@clinic.co" />
            <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)}
                   maxLength={30} placeholder="0812…" />
          </FormGrid>
          {mutError && <p className="text-sm text-error-600" role="alert">{mutError.message}</p>}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !fullName.trim()}>{busy ? 'Saving…' : 'Add staff'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </section>
  );
}
