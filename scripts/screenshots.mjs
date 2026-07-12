// Screenshot generator (Puppeteer). Captures the live-chat feature on both the
// staff console and the patient widget WITHOUT a backend: fetch + WebSocket are
// stubbed in-page (evaluateOnNewDocument) with a seeded conversation, so the
// output is deterministic. Run: `npm run screenshots` (needs `npm run dev` up).
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.SCREENSHOT_BASE || 'http://localhost:5173';
const OUT = 'docs/screenshots';

const at = '2026-07-12T09:12:00.000Z';
const CONVO = [
  { id: 's0', sender: 'system', body: 'You are now connected with Staff Sari Wulandari.', createdAt: at },
  { id: 'p1', sender: 'patient', body: 'Hi! I need to reschedule my appointment on Monday.', createdAt: at },
  { id: 't1', sender: 'staff', body: 'Of course — happy to help. Could you share your booking reference?', createdAt: at },
  { id: 'p2', sender: 'patient', body: 'Sure, it’s CLB-7Q2K9.', createdAt: at },
  { id: 't2', sender: 'staff', body: 'Thanks! I can see it. What day works best for you?', createdAt: at },
];
const SESSIONS = {
  active: [{ id: 1, status: 'active', patientName: 'Jane Doe', patientPhone: '6281234567890', createdAt: at }],
  waiting: [{ id: 2, status: 'waiting', patientName: 'Budi Santoso', patientPhone: '628990001122', createdAt: at }],
};

const staffAuth = {
  token: 'demo-token',
  user: {
    fullName: 'Sari Wulandari', email: 'staff@clinic.test',
    roles: ['STF_DASHBOARD', 'STF_CHAT'], groupCode: 'STF100', staffId: 1,
  },
};

// Runs inside the page before any app script. Seeds storage + stubs the network.
function install(cfg) {
  const { auth, liveChat, sessions, messages } = cfg;
  if (auth) localStorage.setItem('clinicAuth', JSON.stringify(auth));
  if (liveChat) localStorage.setItem('clinicLiveChat', JSON.stringify(liveChat));

  const json = (obj) => new Response(JSON.stringify(obj), {
    status: 200, headers: { 'content-type': 'application/json' },
  });
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/api/livechat/sessions?status=active')) return Promise.resolve(json({ sessions: sessions.active }));
    if (url.includes('/api/livechat/sessions?status=waiting')) return Promise.resolve(json({ sessions: sessions.waiting }));
    if (url.includes('/api/livechat/sessions?status=closed')) return Promise.resolve(json({ sessions: [] }));
    if (/\/api\/livechat\/sessions\/\d+$/.test(url.split('?')[0])) return Promise.resolve(json({ session: sessions.active[0], messages }));
    if (url.includes('/api/chat')) return Promise.resolve(json({ sessionId: 'demo', stage: 'connect_waiting', message: '', quickReplies: [], collectedEntities: {}, errors: [] }));
    if (url.includes('/api/')) return Promise.resolve(json({}));
    return realFetch(input, init);
  };

  // Minimal WebSocket stand-in: opens, replays history, then keeps emitting a
  // `typing` frame so the peer-typing animation is visible in the capture.
  class MockWS {
    constructor() {
      this.readyState = 1;
      setTimeout(() => {
        this.onopen && this.onopen();
        this.onmessage && this.onmessage({ data: JSON.stringify({ type: 'history', session: sessions.active[0], messages }) });
      }, 120);
      this._t = setInterval(() => {
        this.onmessage && this.onmessage({ data: JSON.stringify({ type: 'typing', from: 'patient' }) });
      }, 1200);
    }
    send() {}
    close() { clearInterval(this._t); this.onclose && this.onclose({ code: 1000 }); }
  }
  MockWS.CONNECTING = 0; MockWS.OPEN = 1; MockWS.CLOSING = 2; MockWS.CLOSED = 3;
  window.WebSocket = MockWS;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const shot = async (name, { init, path, prep }) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 832, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument(install, init);
    await page.goto(BASE + path, { waitUntil: 'load' });
    if (prep) await prep(page);
    await wait(1600); // let history render + typing tick land
    await page.screenshot({ path: `${OUT}/${name}` });
    await page.close();
    console.log('✓', name);
  };

  // Staff console — Active tab, open the conversation.
  await shot('07-staff-livechat.png', {
    init: { auth: staffAuth, sessions: SESSIONS, messages: CONVO },
    path: '/#/staff/chat',
    prep: async (page) => {
      await wait(500);
      await page.evaluate(() => {
        const tab = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Active');
        tab && tab.click();
      });
      await wait(500);
      await page.evaluate(() => {
        const row = document.querySelector('ul li button');
        row && row.click();
      });
      await wait(700);
    },
  });

  // Patient widget — a resumed live-chat session (stored handoff payload).
  await shot('08-patient-livechat.png', {
    init: { liveChat: { sessionId: 1, patientKey: 'demo', wsPath: '/ws' }, sessions: SESSIONS, messages: CONVO },
    path: '/',
    prep: async (page) => {
      await page.waitForSelector('.chatdock__launcher');
      await page.click('.chatdock__launcher');
      await wait(700);
    },
  });

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
