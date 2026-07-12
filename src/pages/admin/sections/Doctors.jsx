import { useState } from 'react';
import { admin, cms } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import Modal from '../../../components/Modal';
import { IconEmail, IconPhone, IconPlus } from '../../../components/icons';
import {
  Button, Input, Select, TextArea, Badge,
  TableCard, Table, THead, TH, TBody, TR, TD,
  PageHeader, FormGrid, ModalFooter,
} from '../../../components/base';

const EMPTY = { fullName: '', specialtyId: '', email: '', phone: '', photoUrl: '', bio: '' };

export default function Doctors({ token }) {
  const { data, loading, error, setData, refetch } =
    useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = data?.doctors ?? [];

  // Specialty dropdown feed (V3): removes the "guess the numeric ID" friction.
  const specQ = useAsync((signal) => admin.listSpecialties(token, { signal }), [token]);
  const specialties = specQ.data?.specialties ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const add = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError(null);
    try {
      const { doctor } = await cms.createDoctor(token, {
        fullName: form.fullName.trim(),
        specialtyId: Number(form.specialtyId),
        photoUrl: form.photoUrl.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        bio: form.bio.trim() || null,
      });
      setData((prev) => ({ doctors: [...(prev?.doctors ?? []), doctor] }));
      setForm(EMPTY); setOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally { setSaving(false); }
  };

  const canSubmit = form.fullName.trim().length >= 2 && form.specialtyId && !saving;

  return (
    <section>
      <PageHeader title="Doctors" subtitle="Practitioners and their contact details.">
        <Button variant="secondary" onClick={refetch}>Refresh</Button>
        <Button iconLeading={IconPlus} onClick={() => setOpen(true)}>Add doctor</Button>
      </PageHeader>

      {loading && <p className="text-sm text-gray-500">Loading doctors…</p>}
      {error && <p className="text-sm text-error-600" role="alert">{error.message}</p>}
      {!loading && !error && (
        <TableCard>
          <Table>
            <THead><TR className="hover:bg-transparent"><TH>ID</TH><TH>Name</TH><TH>Specialty</TH><TH>Contact</TH><TH>Status</TH></TR></THead>
            <TBody>
              {doctors.length === 0 && (
                <TR className="hover:bg-transparent"><TD colSpan="5" className="text-gray-500">No doctors yet. Add your first practitioner.</TD></TR>
              )}
              {doctors.map((d) => (
                <TR key={d.id}>
                  <TD className="text-gray-500">{d.id}</TD>
                  <TD className="font-medium text-gray-900">{d.fullName}</TD>
                  <TD>{d.specialtyName ?? d.specialtyId}</TD>
                  <TD>
                    <div className="flex flex-col gap-1">
                      {d.email && <span className="inline-flex items-center gap-1.5"><IconEmail aria-hidden="true" className="size-4 text-gray-400" />{d.email}</span>}
                      {d.phone && <span className="inline-flex items-center gap-1.5"><IconPhone aria-hidden="true" className="size-4 text-gray-400" />{d.phone}</span>}
                      {!d.email && !d.phone && <span className="text-gray-400">—</span>}
                    </div>
                  </TD>
                  <TD><Badge color={d.active ? 'success' : 'gray'} dot>{d.active ? 'Active' : 'Inactive'}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableCard>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title="Add doctor"
             subtitle="Create a practitioner profile shown to patients.">
        <form onSubmit={add} className="flex flex-col gap-5">
          <FormGrid>
            <Input label="Full name" value={form.fullName} onChange={set('fullName')}
                   minLength={2} maxLength={100} required autoFocus placeholder="Dr. Aisha Karim" />
            <Select label="Specialty" value={form.specialtyId} onChange={set('specialtyId')} required
                    disabled={specQ.loading || !!specQ.error}>
              <option value="">
                {specQ.loading ? 'Loading specialties…'
                  : specQ.error ? 'Failed to load specialties'
                  : 'Select a specialty…'}
              </option>
              {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label="Email (optional)" type="email" value={form.email} onChange={set('email')}
                   maxLength={200} placeholder="aisha@citycare.clinic" />
            <Input label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')}
                   maxLength={30} placeholder="6281234567890" />
            <Input label="Photo URL (optional)" type="url" value={form.photoUrl} onChange={set('photoUrl')}
                   maxLength={500} placeholder="https://…/photo.jpg" />
            <div className="sm:col-span-2">
              <TextArea label="Bio (optional)" value={form.bio} onChange={set('bio')} rows={3} maxLength={1000}
                        placeholder="Short professional summary shown to patients." />
            </div>
          </FormGrid>
          {formError && <p className="text-sm text-error-600" role="alert">{formError}</p>}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>{saving ? 'Adding…' : 'Add doctor'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </section>
  );
}
