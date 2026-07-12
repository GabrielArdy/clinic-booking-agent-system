// Screenshot generator (Puppeteer). Captures every surface WITHOUT a backend:
// `fetch` + `WebSocket` are stubbed in-page (evaluateOnNewDocument) with seeded
// data, so output is deterministic. Run: `npm run screenshots` (needs the dev
// server up). Pass name fragments to shoot a subset, e.g.
//   node scripts/screenshots.mjs 01 02 03 04 06   # all but live chat
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.SCREENSHOT_BASE || 'http://localhost:5173';
const OUT = 'docs/screenshots';
const at = '2026-07-12T09:12:00.000Z';

/* ---------------- Seed data (shared by all shots) ---------------- */
const SEEDS = {
  doctors: [
    { id: 1, fullName: 'Dr. Amanda Putri', specialtyId: 1, specialtyName: 'General Medicine', email: 'amanda@citycare.clinic', phone: '6281234500001', bio: null, active: true },
    { id: 2, fullName: 'Dr. Rizky Pratama', specialtyId: 2, specialtyName: 'Cardiology', email: 'rizky@citycare.clinic', phone: '6281234500002', bio: null, active: true },
    { id: 3, fullName: 'Dr. Siti Rahayu', specialtyId: 3, specialtyName: 'Dermatology', email: null, phone: '6281234500003', bio: null, active: true },
    { id: 4, fullName: 'Dr. Budi Santoso', specialtyId: 1, specialtyName: 'General Medicine', email: 'budi@citycare.clinic', phone: null, bio: null, active: false },
  ],
  specialties: [
    { id: 1, name: 'General Medicine', description: null, active: true },
    { id: 2, name: 'Cardiology', description: null, active: true },
    { id: 3, name: 'Dermatology', description: null, active: true },
  ],
  rules: [
    { id: 1, doctorId: 1, weekday: 1, startTime: '09:00', endTime: '17:00', slotMinutes: 30 },
    { id: 2, doctorId: 1, weekday: 3, startTime: '09:00', endTime: '12:00', slotMinutes: 30 },
    { id: 3, doctorId: 1, weekday: 5, startTime: '13:00', endTime: '17:00', slotMinutes: 20 },
  ],
  planner: {
    doctor: { id: 1, fullName: 'Dr. Amanda Putri', specialtyName: 'General Medicine' },
    appointments: [
      { id: 7, reference: 'BK-A1B2C3', date: '2026-07-12', startTime: '09:00', endTime: '09:30', status: 'active', patient: { id: 3, fullName: 'Jane Doe', phone: '6281234567890' } },
      { id: 8, reference: 'BK-D4E5F6', date: '2026-07-12', startTime: '10:00', endTime: '10:30', status: 'active', patient: { id: 4, fullName: 'Budi Santoso', phone: '628990001122' } },
      { id: 9, reference: 'BK-G7H8I9', date: '2026-07-13', startTime: '11:00', endTime: '11:30', status: 'active', patient: { id: 5, fullName: 'Sari Melati', phone: '6281200003333' } },
    ],
    exceptions: [{ id: 2, doctorId: 1, date: '2026-07-14', startTime: null, endTime: null, reason: 'Leave' }],
    days: [
      { date: '2026-07-12', total: 2, active: 2, cancelled: 0, exceptions: 0, blocked: false },
      { date: '2026-07-13', total: 1, active: 1, cancelled: 0, exceptions: 0, blocked: false },
      { date: '2026-07-14', total: 0, active: 0, cancelled: 0, exceptions: 1, blocked: true },
    ],
  },
  sessions: {
    active: [{ id: 1, status: 'active', patientName: 'Jane Doe', patientPhone: '6281234567890', createdAt: at }],
    waiting: [{ id: 2, status: 'waiting', patientName: 'Budi Santoso', patientPhone: '628990001122', createdAt: at }],
  },
  messages: [
    { id: 's0', sender: 'system', body: 'You are now connected with Staff Sari Wulandari.', createdAt: at },
    { id: 'p1', sender: 'patient', body: 'Hi! I need to reschedule my appointment on Monday.', createdAt: at },
    { id: 't1', sender: 'staff', body: 'Of course — happy to help. Could you share your booking reference?', createdAt: at },
    { id: 'p2', sender: 'patient', body: 'Sure, it’s CLB-7Q2K9.', createdAt: at },
    { id: 't2', sender: 'staff', body: 'Thanks! I can see it. What day works best for you?', createdAt: at },
  ],
  chatGreeting: {
    sessionId: 'demo', stage: 'select_purpose',
    message: 'Hi! I’m the City Care Clinic assistant. How can I help you today?',
    quickReplies: [
      { label: 'Book an appointment', value: 'book' },
      { label: 'Check or cancel an appointment', value: 'check' },
      { label: 'Connect with staff', value: 'connect' },
    ],
    collectedEntities: {}, errors: [],
  },
};

const adminAuth = {
  token: 'demo-token',
  user: {
    fullName: 'Ayu Lestari', email: 'admin@clinic.test', groupCode: 'AD100',
    roles: ['ADM_DASHBOARD', 'AUDIT_LOG', 'CMS_CLINIC', 'CMS_THEME', 'CMS_STAFF_DOCTOR', 'CMS_SLOT', 'CMS_ROSTER', 'CMS_POSITION'],
  },
};
const staffAuth = {
  token: 'demo-token',
  user: { fullName: 'Sari Wulandari', email: 'staff@clinic.test', roles: ['STF_DASHBOARD', 'STF_CHAT'], groupCode: 'STF100', staffId: 1 },
};

// Runs in the page before any app script. Seeds storage + stubs the network so
// every screen renders from `seeds` with no backend.
function install(cfg) {
  const { auth, liveChat, seeds } = cfg;
  localStorage.removeItem('clinicSession');
  localStorage.removeItem('clinicLiveChat');
  if (auth) localStorage.setItem('clinicAuth', JSON.stringify(auth));
  else localStorage.removeItem('clinicAuth');
  if (liveChat) localStorage.setItem('clinicLiveChat', JSON.stringify(liveChat));

  const json = (obj) => new Response(JSON.stringify(obj), { status: 200, headers: { 'content-type': 'application/json' } });
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const path = url.split('?')[0];
    if (path.endsWith('/api/admin/doctors') || path.endsWith('/api/cms/doctors')) return Promise.resolve(json({ doctors: seeds.doctors }));
    if (path.endsWith('/api/admin/specialties') || path.endsWith('/api/cms/specialties')) return Promise.resolve(json({ specialties: seeds.specialties }));
    if (path.endsWith('/api/admin/schedules')) return Promise.resolve(json({ rules: seeds.rules }));
    if (path.endsWith('/api/admin/appointments')) return Promise.resolve(json(seeds.planner));
    if (url.includes('/api/livechat/sessions?status=active')) return Promise.resolve(json({ sessions: seeds.sessions.active }));
    if (url.includes('/api/livechat/sessions?status=waiting')) return Promise.resolve(json({ sessions: seeds.sessions.waiting }));
    if (url.includes('/api/livechat/sessions?status=closed')) return Promise.resolve(json({ sessions: [] }));
    if (/\/api\/livechat\/sessions\/\d+$/.test(path)) return Promise.resolve(json({ session: seeds.sessions.active[0], messages: seeds.messages }));
    if (path.endsWith('/api/chat')) return Promise.resolve(json(seeds.chatGreeting));
    if (url.includes('/api/')) return Promise.resolve(json({}));
    return realFetch(input, init);
  };

  class MockWS {
    constructor() {
      this.readyState = 1;
      setTimeout(() => {
        this.onopen && this.onopen();
        this.onmessage && this.onmessage({ data: JSON.stringify({ type: 'history', session: seeds.sessions.active[0], messages: seeds.messages }) });
      }, 120);
      this._t = setInterval(() => this.onmessage && this.onmessage({ data: JSON.stringify({ type: 'typing', from: 'patient' }) }), 1200);
    }
    send() {}
    close() { clearInterval(this._t); this.onclose && this.onclose({ code: 1000 }); }
  }
  MockWS.CONNECTING = 0; MockWS.OPEN = 1; MockWS.CLOSING = 2; MockWS.CLOSED = 3;
  window.WebSocket = MockWS;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = (page, text) => page.evaluate((t) => {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t);
  el && el.click();
}, text);

/* ---------------- Shot definitions ---------------- */
const SHOTS = [
  { name: '01-landing.png', path: '/', full: true, init: { seeds: SEEDS } },
  {
    name: '06-landing-chat-open.png', path: '/', full: true, init: { seeds: SEEDS },
    prep: async (page) => { await page.waitForSelector('.chatdock__launcher'); await page.click('.chatdock__launcher'); await wait(900); },
  },
  { name: '02-admin-dashboard.png', path: '/#/admin/dashboard', init: { auth: adminAuth, seeds: SEEDS } },
  { name: '03-admin-doctors.png', path: '/#/admin/doctors', init: { auth: adminAuth, seeds: SEEDS } },
  {
    name: '04-admin-schedules.png', path: '/#/admin/schedules', full: true, init: { auth: adminAuth, seeds: SEEDS },
    prep: async (page) => {
      await page.waitForSelector('select[aria-label="Doctor"]');
      await page.select('select[aria-label="Doctor"]', '1');
      await wait(900);
    },
  },
  // Live chat (kept for completeness; excluded by default arg filter this run).
  {
    name: '07-staff-livechat.png', path: '/#/staff/chat', init: { auth: staffAuth, seeds: SEEDS },
    prep: async (page) => {
      await wait(500); await clickText(page, 'Active'); await wait(500);
      await page.evaluate(() => { const r = document.querySelector('ul li button'); r && r.click(); });
      await wait(700);
    },
  },
  {
    name: '08-patient-livechat.png', path: '/', init: { liveChat: { sessionId: 1, patientKey: 'demo', wsPath: '/ws' }, seeds: SEEDS },
    prep: async (page) => { await page.waitForSelector('.chatdock__launcher'); await page.click('.chatdock__launcher'); await wait(700); },
  },
];

async function main() {
  const only = process.argv.slice(2);
  const shots = only.length ? SHOTS.filter((s) => only.some((a) => s.name.includes(a))) : SHOTS;

  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  for (const s of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 832, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument(install, s.init);
    await page.goto(BASE + s.path, { waitUntil: 'load' });
    if (s.prep) await s.prep(page);
    await wait(1400);
    await page.screenshot({ path: `${OUT}/${s.name}`, fullPage: !!s.full });
    await page.close();
    console.log('✓', s.name);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
