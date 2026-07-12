import { useState } from 'react';
import { cms } from '../../../api/client';
import { useAsync } from '../../../hooks/useAsync';
import {
  Button, Input, Checkbox, Card, PageHeader, FormGrid,
} from '../../../components/base';

// Two singletons: clinic profile + theme. Each panel loads once, seeds an
// editable form at render time (cheaper than an effect — no intermediate commit),
// and PUTs a partial body on save.
export default function CmsSettings({ token }) {
  return (
    <section>
      <PageHeader title="Settings" subtitle="Clinic profile and public theme." />
      <div className="flex flex-col gap-6">
        <ClinicPanel token={token} />
        <ThemePanel token={token} />
      </div>
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

function PanelShell({ title, children }) {
  return (
    <Card className="p-6">
      <h2 className="mb-5 border-b border-gray-200 pb-4 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </Card>
  );
}

function SaveRow({ saving, saved, err, label }) {
  return (
    <div className="mt-6 flex items-center gap-3 border-t border-gray-200 pt-4">
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : label}</Button>
      {saved && <span className="text-sm font-medium text-success-600" role="status">Saved</span>}
      {err && <span className="text-sm text-error-600" role="alert">{err.message}</span>}
    </div>
  );
}

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

  if (loading) return <PanelShell title="Clinic information"><p className="text-sm text-gray-500">Loading…</p></PanelShell>;
  if (error) return <PanelShell title="Clinic information"><p className="text-sm text-error-600" role="alert">{error.message}</p></PanelShell>;
  if (!form) return null;

  return (
    <form onSubmit={save}>
      <PanelShell title="Clinic information">
        <FormGrid>
          {CLINIC_FIELDS.map(([k, label, type, ph]) => {
            const required = k === 'name' || k === 'address';
            return (
              <Input key={k} type={type} value={form[k]} onChange={set(k)} placeholder={ph}
                     required={required} label={required ? label : `${label} (optional)`} />
            );
          })}
        </FormGrid>
        <SaveRow saving={saving} saved={saved} err={err} label="Save clinic" />
      </PanelShell>
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

  if (loading) return <PanelShell title="Theme"><p className="text-sm text-gray-500">Loading…</p></PanelShell>;
  if (error) return <PanelShell title="Theme"><p className="text-sm text-error-600" role="alert">{error.message}</p></PanelShell>;
  if (!form) return null;

  return (
    <form onSubmit={save}>
      <PanelShell title="Theme">
        <FormGrid>
          {COLORS.map(([k, label]) => (
            <div key={k} className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <div className="flex items-center gap-3 rounded-lg border border-gray-300 px-3 py-2 shadow-xs">
                <input type="color" value={form[k]} onChange={(e) => set(k, e.target.value)}
                       aria-label={`${label} colour`}
                       className="size-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />
                <code className="text-sm text-gray-600">{form[k]}</code>
              </div>
            </div>
          ))}
          <Input label="Font family" value={form.fontFamily} onChange={(e) => set('fontFamily', e.target.value)} placeholder="Inter" />
          <Input label="Logo URL (optional)" type="url" value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://…/logo.svg" />
          <div className="flex items-center sm:col-span-2">
            <Checkbox label="Dark mode" checked={form.darkMode} onChange={(e) => set('darkMode', e.target.checked)} />
          </div>
        </FormGrid>
        <SaveRow saving={saving} saved={saved} err={err} label="Save theme" />
      </PanelShell>
    </form>
  );
}
