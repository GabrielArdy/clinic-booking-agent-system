import { useState } from 'react';
import { cms } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';

// Two singletons: clinic profile + theme. Each panel loads once, seeds an
// editable form at render time (cheaper than an effect — no intermediate commit),
// and PUTs a partial body on save.
export default function CmsSettings({ token }) {
  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h1>Settings</h1>
          <p className="section__sub">Clinic profile and public theme.</p>
        </div>
      </div>
      <ClinicPanel token={token} />
      <ThemePanel token={token} />
    </section>
  );
}

const CLINIC_FIELDS = [
  ['name', 'Clinic name', 'text', 'City Care Clinic'],
  ['address', 'Address', 'text', '12 Riverside Ave'],
  ['phone', 'Phone', 'text', '+62…'],
  ['email', 'Email', 'email', 'hello@clinic.co'],
  ['permissionLetterUrl', 'Operating permit URL', 'url', 'https://…/izin.pdf'],
  ['emblemUrl', 'Emblem URL', 'url', 'https://…/emblem.png'],
];

function ClinicPanel({ token }) {
  const { data, loading, error, setData } = useAsync((s) => cms.getClinic(token, { signal: s }), [token]);
  const clinic = data?.clinic;

  const [form, setForm] = useState(null);
  const [seeded, setSeeded] = useState(false);
  // Seed once, when the record first arrives (adjusting-state-during-render).
  if (clinic && !seeded) {
    setSeeded(true);
    setForm(Object.fromEntries(CLINIC_FIELDS.map(([k]) => [k, clinic[k] ?? ''])));
  }

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      // Required fields keep their value; empty optionals → null (clear, not "").
      const body = Object.fromEntries(CLINIC_FIELDS.map(([k]) => {
        const v = form[k].trim();
        const required = k === 'name' || k === 'address';
        return [k, v || required ? v : null];
      }));
      const { clinic: updated } = await cms.updateClinic(token, body);
      setData({ clinic: updated }); setSaved(true);
    } catch (e2) { setErr(e2); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="card panel"><h2>Clinic information</h2><p className="muted">Loading…</p></div>;
  if (error) return <div className="card panel"><h2>Clinic information</h2><p className="form-error" role="alert">{error.message}</p></div>;
  if (!form) return null;

  return (
    <form className="card panel" onSubmit={save}>
      <h2>Clinic information</h2>
      <div className="settings-grid">
        {CLINIC_FIELDS.map(([k, label, type, ph]) => (
          <label className="field" key={k}>
            <span>{label}{k !== 'name' && k !== 'address' && <em className="opt">optional</em>}</span>
            <input type={type} value={form[k]} onChange={set(k)} placeholder={ph}
                   required={k === 'name' || k === 'address'} />
          </label>
        ))}
      </div>
      <div className="save-row">
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save clinic'}</button>
        {saved && <span className="saved-note" role="status">Saved</span>}
        {err && <span className="form-error" role="alert">{err.message}</span>}
      </div>
    </form>
  );
}

const COLORS = [['primaryColor', 'Primary'], ['secondaryColor', 'Secondary'], ['accentColor', 'Accent']];

function ThemePanel({ token }) {
  const { data, loading, error, setData } = useAsync((s) => cms.getTheme(token, { signal: s }), [token]);
  const theme = data?.theme;

  const [form, setForm] = useState(null);
  const [seeded, setSeeded] = useState(false);
  if (theme && !seeded) {
    setSeeded(true);
    setForm({
      primaryColor: theme.primaryColor ?? '#0f766e',
      secondaryColor: theme.secondaryColor ?? '#0284c7',
      accentColor: theme.accentColor ?? '#f59e0b',
      fontFamily: theme.fontFamily ?? 'Inter',
      logoUrl: theme.logoUrl ?? '',
      darkMode: !!theme.darkMode,
    });
  }

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, val) => { setForm((f) => ({ ...f, [k]: val })); setSaved(false); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      const { theme: updated } = await cms.updateTheme(token, {
        primaryColor: form.primaryColor, secondaryColor: form.secondaryColor,
        accentColor: form.accentColor, fontFamily: form.fontFamily,
        logoUrl: form.logoUrl.trim() || null, darkMode: form.darkMode,
      });
      setData({ theme: updated }); setSaved(true);
    } catch (e2) { setErr(e2); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="card panel"><h2>Theme</h2><p className="muted">Loading…</p></div>;
  if (error) return <div className="card panel"><h2>Theme</h2><p className="form-error" role="alert">{error.message}</p></div>;
  if (!form) return null;

  return (
    <form className="card panel" onSubmit={save}>
      <h2>Theme</h2>
      <div className="settings-grid">
        {COLORS.map(([k, label]) => (
          <label className="field swatch-field" key={k}>
            <span>{label}</span>
            <span className="swatch">
              <input type="color" value={form[k]} onChange={(e) => set(k, e.target.value)} aria-label={`${label} colour`} />
              <code>{form[k]}</code>
            </span>
          </label>
        ))}
        <label className="field">
          <span>Font family</span>
          <input value={form.fontFamily} onChange={(e) => set('fontFamily', e.target.value)} placeholder="Inter" />
        </label>
        <label className="field">
          <span>Logo URL <em className="opt">optional</em></span>
          <input type="url" value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://…/logo.svg" />
        </label>
        <label className="field field--check swatch-field">
          <input type="checkbox" checked={form.darkMode} onChange={(e) => set('darkMode', e.target.checked)} />
          <span>Dark mode</span>
        </label>
      </div>
      <div className="save-row">
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save theme'}</button>
        {saved && <span className="saved-note" role="status">Saved</span>}
        {err && <span className="form-error" role="alert">{err.message}</span>}
      </div>
    </form>
  );
}
