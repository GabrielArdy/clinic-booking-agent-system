import { useState } from 'react';
import { admin, cms } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import Modal from '../../../components/Modal';
import { IconEmail, IconPhone, IconPlus } from '../../../components/icons';

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
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Doctors</h1>
          <p className="section__sub">Practitioners and their contact details.</p>
        </div>
        <div className="section__actions">
          <button className="btn btn-ghost" onClick={refetch}>Refresh</button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus aria-hidden="true" /> Add doctor</button>
        </div>
      </div>

      {loading && <p className="muted">Loading doctors…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {!loading && !error && (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Specialty</th><th>Contact</th><th>Status</th></tr>
            </thead>
            <tbody>
              {doctors.length === 0 && (
                <tr><td colSpan="5" className="muted">No doctors yet. Add your first practitioner.</td></tr>
              )}
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.fullName}</td>
                  <td>{d.specialtyName ?? d.specialtyId}</td>
                  <td>
                    {d.email && <span className="cell-contact"><IconEmail aria-hidden="true" />{d.email}</span>}
                    {d.phone && <span className="cell-contact"><IconPhone aria-hidden="true" />{d.phone}</span>}
                    {!d.email && !d.phone && <span className="muted">—</span>}
                  </td>
                  <td>
                    <span className={`pill ${d.active ? 'pill-success' : 'pill-muted'}`}>
                      {d.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title="Add doctor">
        <form onSubmit={add}>
          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input value={form.fullName} onChange={set('fullName')}
                     minLength={2} maxLength={100} required autoFocus placeholder="Dr. Aisha Karim" />
            </label>
            <label className="field">
              <span>Specialty</span>
              <select value={form.specialtyId} onChange={set('specialtyId')} required
                      disabled={specQ.loading || !!specQ.error}>
                <option value="">
                  {specQ.loading ? 'Loading specialties…'
                    : specQ.error ? 'Failed to load specialties'
                    : 'Select a specialty…'}
                </option>
                {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Email <em className="opt">optional</em></span>
              <input type="email" value={form.email} onChange={set('email')}
                     maxLength={200} placeholder="aisha@citycare.clinic" />
            </label>
            <label className="field">
              <span>Phone <em className="opt">optional</em></span>
              <input type="tel" value={form.phone} onChange={set('phone')}
                     maxLength={30} placeholder="6281234567890" />
            </label>
            <label className="field">
              <span>Photo URL <em className="opt">optional</em></span>
              <input type="url" value={form.photoUrl} onChange={set('photoUrl')}
                     maxLength={500} placeholder="https://…/photo.jpg" />
            </label>
            <label className="field field--full">
              <span>Bio <em className="opt">optional</em></span>
              <textarea value={form.bio} onChange={set('bio')} rows={3} maxLength={1000}
                        placeholder="Short professional summary shown to patients." />
            </label>
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="modal__foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
              {saving ? 'Adding…' : 'Add doctor'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
