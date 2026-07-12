import { useState } from 'react';
import { cms } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import Modal from '../../../components/Modal';
import { IconTrash, IconPlus } from '../../../components/icons';
import {
  Button, Input, Select,
  TableCard, Table, THead, TH, TBody, TR, TD,
  PageHeader, FormGrid, ModalFooter,
} from '../../../components/base';

const EMPTY = { positionCode: '', positionName: '', groupCode: '' };

// Positions (MasterPosition) = { id, positionCode, positionName, groupCode }.
// No status flag; DELETE is a hard delete → drop the row on success.
export default function CmsPositions({ token }) {
  const posQ = useAsync((signal) => cms.listPositions(token, { signal }), [token]);
  const groupsQ = useAsync((signal) => cms.listGroups(token, { signal }), [token]);
  const positions = posQ.data?.positions ?? [];
  const groups = groupsQ.data?.groups ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await cms.createPosition(token, {
        positionCode: form.positionCode.trim(),
        positionName: form.positionName.trim(),
        groupCode: form.groupCode,
      });
      setForm(EMPTY); setOpen(false); posQ.refetch();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const remove = async (code) => {
    try { await cms.deletePosition(token, code); posQ.refetch(); }
    catch (err) { setError(err.message); }
  };

  const groupName = (code) => groups.find((g) => g.groupCode === code)?.groupName ?? code;
  const canSubmit = form.positionCode.trim() && form.positionName.trim() && form.groupCode && !busy;

  return (
    <section>
      <PageHeader title="Positions" subtitle="Job positions users are assigned to.">
        <Button variant="secondary" onClick={posQ.refetch}>Refresh</Button>
        <Button iconLeading={IconPlus} onClick={() => setOpen(true)}>Add position</Button>
      </PageHeader>

      {error && !open && <p className="mb-4 text-sm text-error-600" role="alert">{error}</p>}
      {posQ.loading && <p className="text-sm text-gray-500">Loading…</p>}
      {posQ.error && <p className="text-sm text-error-600" role="alert">{posQ.error.message}</p>}
      {!posQ.loading && !posQ.error && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>Code</TH><TH>Name</TH><TH>Group</TH><TH aria-label="Actions" /></TR></THead>
            <TBody>
              {positions.length === 0 && <TR className="hover:bg-transparent"><TD colSpan="4" className="text-gray-500">No positions yet.</TD></TR>}
              {positions.map((p) => (
                <TR key={p.positionCode}>
                  <TD><code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{p.positionCode}</code></TD>
                  <TD className="font-medium text-gray-900">{p.positionName}</TD>
                  <TD>{groupName(p.groupCode)}</TD>
                  <TD className="text-right">
                    <Button variant="destructive-secondary" size="sm" aria-label={`Delete ${p.positionName}`}
                            className="size-9 px-0" onClick={() => remove(p.positionCode)} iconLeading={IconTrash} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableCard>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add position">
        <form onSubmit={create} className="flex flex-col gap-5">
          <FormGrid>
            <Input label="Code" value={form.positionCode} onChange={set('positionCode')} maxLength={50} required autoFocus placeholder="D012" />
            <Input label="Name" value={form.positionName} onChange={set('positionName')} maxLength={100} required placeholder="Specialist Doctor" />
            <div className="sm:col-span-2">
              <Select label="Group" value={form.groupCode} onChange={set('groupCode')} required
                      disabled={groupsQ.loading || !!groupsQ.error}>
                <option value="">
                  {groupsQ.loading ? 'Loading…' : groupsQ.error ? 'Failed to load' : 'Select a group…'}
                </option>
                {groups.map((g) => <option key={g.groupCode} value={g.groupCode}>{g.groupName} ({g.groupCode})</option>)}
              </Select>
            </div>
          </FormGrid>
          {error && <p className="text-sm text-error-600" role="alert">{error}</p>}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>{busy ? 'Adding…' : 'Add position'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </section>
  );
}
