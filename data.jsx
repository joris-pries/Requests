// Sample data for the request tracker

const ME = { id: 'me', name: 'You', initials: 'YO', color: '#1f1d18', isMe: true };

const PEOPLE = [
  ME,
  { id: 'alex',    name: 'Alex Chen',       initials: 'AC', color: '#c2410c' },
  { id: 'jordan',  name: 'Jordan Park',     initials: 'JP', color: '#15803d' },
  { id: 'priya',   name: 'Priya Shah',      initials: 'PS', color: '#6d28d9' },
  { id: 'sam',     name: 'Sam Okafor',      initials: 'SO', color: '#0e7490' },
  { id: 'noor',    name: 'Noor Hadid',      initials: 'NH', color: '#be185d' },
  { id: 'kenji',   name: 'Kenji Tanaka',    initials: 'KT', color: '#a16207' },
  { id: 'elena',   name: 'Elena Vasquez',   initials: 'EV', color: '#0369a1' },
  { id: 'hr',      name: 'HR (Mira)',       initials: 'HR', color: '#475569' },
];

const personById = (id) => {
  const list = window.ALL_PEOPLE || PEOPLE;
  return list.find(p => p.id === id) || list[0];
};

// `auto: true` statuses are computed at display time and cannot be manually set.
// `sentOnly: true` statuses are not available for received requests.
const STATUSES = [
  { id: 'not_requested', label: 'Not requested yet', color: 'oklch(70% 0.01 60)',  sentOnly: true },
  { id: 'requested',     label: 'Requested',          color: 'oklch(60% 0.09 250)' },
  { id: 'overdue',       label: 'Past due date',      color: 'oklch(62% 0.14 55)', auto: true },
  { id: 'done',          label: 'Done',               color: 'oklch(55% 0.10 145)' },
];

// All non-auto statuses (used in bulk bar where direction is mixed)
const MANUAL_STATUSES = STATUSES.filter(s => !s.auto);

// Direction-aware picker options:
// received requests skip "Not requested yet" — the request has already been made
const manualStatusesFor = (direction) =>
  direction === 'received'
    ? MANUAL_STATUSES.filter(s => !s.sentOnly)
    : MANUAL_STATUSES;

// Default status when creating a new request
const defaultStatusFor = (direction) =>
  direction === 'received' ? 'requested' : 'not_requested';

// Effective column = past-due if date has slipped (and not done), else the manual status
function effectiveStatus(r) {
  if (r.status === 'done') return 'done';
  if (r.due && new Date(r.due) < new Date(new Date().toDateString())) return 'overdue';
  return r.status;
}

const RECURRENCE_OPTIONS = [
  { type: null,                label: 'None' },
  { type: 'daily',             label: 'Daily' },
  { type: 'weekday',           label: 'Every weekday' },
  { type: 'weekly',            label: 'Weekly' },
  { type: 'biweekly',          label: 'Every 2 weeks' },
  { type: 'triweekly',         label: 'Every 3 weeks' },
  { type: 'monthly',           label: 'Monthly (same date)' },
  { type: 'bimonthly',         label: 'Every 2 months' },
  { type: 'quarterly',         label: 'Quarterly' },
  { type: 'semiannual',        label: 'Every 6 months' },
  { type: 'yearly',            label: 'Yearly' },
  { type: 'last_day_of_month', label: 'Last day of month' },
  { type: 'custom',            label: 'Custom…' },
];

// Returns the next YYYY-MM-DD due date given the current due date and recurrence type.
// Parses dates by splitting on '-' to avoid UTC-shift bugs.
function computeNextDue(fromDate, type) {
  if (!fromDate || !type || type === 'custom') return null;
  const [y, m, d] = fromDate.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  let next;

  if (type === 'daily') {
    next = new Date(base); next.setDate(next.getDate() + 1);
  } else if (type === 'weekday') {
    next = new Date(base); next.setDate(next.getDate() + 1);
    while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  } else if (type === 'weekly') {
    next = new Date(base); next.setDate(next.getDate() + 7);
  } else if (type === 'biweekly') {
    next = new Date(base); next.setDate(next.getDate() + 14);
  } else if (type === 'triweekly') {
    next = new Date(base); next.setDate(next.getDate() + 21);
  } else if (type === 'monthly') {
    next = new Date(base); next.setMonth(next.getMonth() + 1);
    if (next.getDate() !== base.getDate()) next.setDate(0);
  } else if (type === 'bimonthly') {
    next = new Date(base); next.setMonth(next.getMonth() + 2);
    if (next.getDate() !== base.getDate()) next.setDate(0);
  } else if (type === 'quarterly') {
    next = new Date(base); next.setMonth(next.getMonth() + 3);
    if (next.getDate() !== base.getDate()) next.setDate(0);
  } else if (type === 'semiannual') {
    next = new Date(base); next.setMonth(next.getMonth() + 6);
    if (next.getDate() !== base.getDate()) next.setDate(0);
  } else if (type === 'yearly') {
    next = new Date(base); next.setFullYear(next.getFullYear() + 1);
    if (next.getDate() !== base.getDate()) next.setDate(0);
  } else if (type === 'last_day_of_month') {
    next = new Date(base.getFullYear(), base.getMonth() + 2, 0);
  } else {
    return null;
  }

  const ny = next.getFullYear();
  const nm = String(next.getMonth() + 1).padStart(2, '0');
  const nd = String(next.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

const SEED_REQUESTS = [];

Object.assign(window, {
  ME, PEOPLE, personById,
  STATUSES, MANUAL_STATUSES, manualStatusesFor, defaultStatusFor,
  effectiveStatus, RECURRENCE_OPTIONS, computeNextDue, SEED_REQUESTS,
});
