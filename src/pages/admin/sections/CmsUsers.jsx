import { useState } from 'react';
import { admin, cms } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import Modal from '../../../components/Modal';
import { IconPlus } from '../../../components/icons';
import {
  Button, Input, Select, Checkbox, Badge,
  TableCard, Table, THead, TH, TBody, TR, TD,
  PageHeader, FormGrid, ModalFooter,
} from '../../../components/base';

const EMPTY = { fullName: '', email: '', password: '', positionCode: '', link: '', roles: [] };

// User accounts (CMS_POSITION). Create sets an initial password (scrypt server-side).
// `link` encodes the optional doctor/staff data-scope in one control ("type:id").
// Roles left empty → backend applies the position's group default bundle.
export default function CmsUsers({ token }) {
  const usersQ = useAsync((signal) => cms.listUsers(token, { signal }), [token]);
  const posQ = useAsync((signal) => cms.listPositions(token, { signal }), [token]);
  const rolesQ = useAsync((signal) => cms.listRoles(token, { signal }), [token]);
  const doctorsQ = useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const staffQ = useAsync((signal) => cms.listStaff(token, { signal }), [token]);

  const users = usersQ.data?.users ?? [];
  const positions = posQ.data?.positions ?? [];
  const roles = rolesQ.data?.roles ?? [];
  const doctors = doctorsQ.data?.doctors ?? [];
  const staff = staffQ.data?.staff ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleRole = (code) => setForm((f) => ({
    ...f,
    roles: f.roles.includes(code) ? f.roles.filter((r) => r !== code) : [...f.roles, code],
  }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const [linkType, linkId] = form.link ? form.link.split(':') : [];
      const body = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        positionCode: form.positionCode,
        doctorId: linkType === 'doctor' ? Number(linkId) : null,
        staffId: linkType === 'staff' ? Number(linkId) : null,
      };
      if (form.roles.length) body.roles = form.roles;      // else server uses the group default
      await cms.createUser(token, body);
      setForm(EMPTY); setOpen(false); usersQ.refetch();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const setStatus = async (u, status) => {
    try {
      const { user } = await cms.updateUser(token, u.id, { status });
      usersQ.setData((prev) => ({ users: (prev?.users ?? []).map((x) => (x.id === u.id ? user : x)) }));
    } catch (err) { setError(err.message); }
  };

  const posName = (code) => positions.find((p) => p.positionCode === code)?.positionName ?? code;
  const canSubmit = form.fullName.trim() && form.email.trim() && form.password && form.positionCode && !busy;

  return (
    <section>
      <PageHeader title="User accounts" subtitle="Login accounts, positions, and data links.">
        <Button variant="secondary" onClick={usersQ.refetch}>Refresh</Button>
        <Button iconLeading={IconPlus} onClick={() => setOpen(true)}>Add user</Button>
      </PageHeader>

      {error && !open && <p className="mb-4 text-sm text-error-600" role="alert">{error}</p>}
      {usersQ.loading && <p className="text-sm text-gray-500">Loading users…</p>}
      {usersQ.error && <p className="text-sm text-error-600" role="alert">{usersQ.error.message}</p>}
      {!usersQ.loading && !usersQ.error && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>Name</TH><TH>Email</TH><TH>Position</TH><TH>Roles</TH><TH>Status</TH><TH /></TR></THead>
            <TBody>
              {users.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="6" className="text-gray-500">No users yet.</TD></TR>}
              {users.map((u) => {
                const inactive = u.status === 'INACTIVE';
                return (
                  <TR key={u.id}>
                    <TD className="font-medium text-gray-900">{u.fullName}</TD>
                    <TD>{u.email}</TD>
                    <TD>{u.positionName ?? posName(u.positionCode)}</TD>
                    <TD className="text-gray-500">{(u.roles ?? []).length} role(s)</TD>
                    <TD>
                      <Badge color={inactive ? 'gray' : 'success'} dot>{inactive ? 'Inactive' : 'Active'}</Badge>
                    </TD>
                    <TD className="text-right">
                      <Button variant="secondary" size="sm"
                              onClick={() => setStatus(u, inactive ? 'ACTIVE' : 'INACTIVE')}>
                        {inactive ? 'Activate' : 'Deactivate'}
                      </Button>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </TableCard>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title="Add user"
             subtitle="Create a login and assign a position.">
        <form onSubmit={create} className="flex flex-col gap-5">
          <FormGrid>
            <Input label="Full name" value={form.fullName} onChange={set('fullName')} maxLength={100} required autoFocus placeholder="Dr. Amanda Putri" />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} maxLength={200} required placeholder="amanda@clinic.test" />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} minLength={8} required
                   autoComplete="new-password" placeholder="Initial password" />
            <Select label="Position" value={form.positionCode} onChange={set('positionCode')} required
                    disabled={posQ.loading || !!posQ.error}>
              <option value="">{posQ.loading ? 'Loading…' : 'Select a position…'}</option>
              {positions.map((p) => <option key={p.positionCode} value={p.positionCode}>{p.positionName} ({p.positionCode})</option>)}
            </Select>
            <div className="sm:col-span-2">
              <Select label="Link to (optional)" value={form.link} onChange={set('link')}>
                <option value="">No data link</option>
                <optgroup label="Doctor">
                  {doctors.map((d) => <option key={`d${d.id}`} value={`doctor:${d.id}`}>{d.fullName}</option>)}
                </optgroup>
                <optgroup label="Staff">
                  {staff.map((s) => <option key={`s${s.id}`} value={`staff:${s.id}`}>{s.fullName}</option>)}
                </optgroup>
              </Select>
            </div>
          </FormGrid>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Roles <span className="font-normal text-gray-400">— blank uses the position&rsquo;s defaults</span></span>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-3">
              {rolesQ.loading && <span className="text-sm text-gray-500">Loading roles…</span>}
              {roles.map((r) => (
                <Checkbox key={r.roleCode} label={r.roleName ?? r.roleCode}
                          checked={form.roles.includes(r.roleCode)} onChange={() => toggleRole(r.roleCode)} />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-error-600" role="alert">{error}</p>}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>{busy ? 'Creating…' : 'Create user'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </section>
  );
}
