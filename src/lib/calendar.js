// Pure date helpers for the month planner. No React — importable by fetchers and UI.
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export const pad2 = (n) => String(n).padStart(2, '0');
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthKeyOf = (iso) => iso.slice(0, 7);

// Full month span for range feeds (from/to inclusive).
export function monthRange(key) {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${key}-01`, to: `${key}-${pad2(last)}` };
}

// Sunday-start cell grid for a month. `date: null` = padding cell.
export function monthCells(key) {
  const [y, m] = key.split('-').map(Number);
  const lead = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push({ date: null });
  for (let d = 1; d <= days; d++) cells.push({ date: `${key}-${pad2(d)}`, day: d });
  return cells;
}

export const fmtLong = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;
};

// Shift a YYYY-MM key by N months → new key.
export function shiftMonthKey(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}
