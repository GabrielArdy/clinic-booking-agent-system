import { useState } from 'react';
import { admin } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';

export default function Doctors({ token }) {
  const { data, loading, error, setData, refetch } =
    useAsync((signal) => admin.listDoctors(token, { signal }), [token]);
  const doctors = data?.doctors ?? [];

  const [fullName, setFullName] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const add = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError(null);
    try {
      const { doctor } = await admin.createDoctor(token, {
        fullName: fullName.trim(), specialtyId: Number(specialtyId),
        photoUrl: photoUrl.trim() || null,
      });
      // Optimistic-ish: append the server's canonical record, no full refetch.
      setData((prev) => ({ doctors: [...(prev?.doctors ?? []), doctor] }));
      setFullName(''); setSpecialtyId(''); setPhotoUrl('');
    } catch (err) {
      setFormError(err.message);
    } finally { setSaving(false); }
  };

  return (
    <section className="section">
      <div className="section__head">
        <h1>Doctors</h1>
        <button className="btn btn-ghost" onClick={refetch}>Refresh</button>
      </div>

      <form className="card panel" onSubmit={add}>
        <h2>Add doctor</h2>
        <div className="form-row">
          <label className="field">
            <span>Full name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                   minLength={2} maxLength={100} required placeholder="Dr. Aisha Karim" />
          </label>
          <label className="field field--sm">
            <span>Specialty ID</span>
            <input type="number" min="1" value={specialtyId}
                   onChange={(e) => setSpecialtyId(e.target.value)} required placeholder="1" />
          </label>
          <label className="field">
            <span>Photo URL <em className="opt">optional</em></span>
            <input type="url" value={photoUrl} maxLength={500}
                   onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…/photo.jpg" />
          </label>
          <button className="btn btn-primary" type="submit"
                  disabled={saving || !fullName.trim() || !specialtyId}>
            {saving ? 'Adding…' : 'Add doctor'}
          </button>
        </div>
        {formError && <p className="form-error" role="alert">{formError}</p>}
      </form>

      {loading && <p className="muted">Loading doctors…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {!loading && !error && (
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Specialty</th><th>Status</th></tr>
          </thead>
          <tbody>
            {doctors.length === 0 && (
              <tr><td colSpan="4" className="muted">No doctors yet.</td></tr>
            )}
            {doctors.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.fullName}</td>
                <td>{d.specialtyName ?? d.specialtyId}</td>
                <td>
                  <span className={`pill ${d.active ? 'pill-success' : 'pill-muted'}`}>
                    {d.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
