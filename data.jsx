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

// Build dates relative to today so demo always looks current
const today = new Date();
const day = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const SEED_REQUESTS = [
  {
    id: 'REQ-104',
    title: 'Review the Q3 roadmap doc before Friday',
    desc: 'Sent the draft last week — looking for a quick gut check on the prioritization, not line edits.',
    direction: 'sent',
    from: 'me', to: 'alex',
    status: 'requested',
    priority: 'high',
    due: day(2),
    created: day(-4),
    activity: [
      { who: 'me',   when: '4 days ago', text: 'Created this request' },
      { who: 'alex', when: '2 days ago', text: 'Acknowledged — will get to it Thursday' },
    ],
  },
  {
    id: 'REQ-103',
    title: 'Sign off on the new vendor contract',
    desc: 'Legal redlined the draft. I need your initials on pages 4 and 9, plus the signature page.',
    direction: 'received',
    from: 'priya', to: 'me',
    status: 'requested',
    priority: 'med',
    due: day(1),
    created: day(-3),
    activity: [
      { who: 'priya', when: '3 days ago', text: 'Submitted this request' },
      { who: 'me',    when: 'yesterday',  text: 'Asked legal to clarify clause 7' },
    ],
  },
  {
    id: 'REQ-102',
    title: 'Share last quarter’s growth deck',
    desc: 'For the board pre-read. Final version, not the working draft.',
    direction: 'sent',
    from: 'me', to: 'jordan',
    status: 'done',
    priority: 'low',
    due: day(-2),
    created: day(-6),
    activity: [
      { who: 'me',     when: '6 days ago', text: 'Created this request' },
      { who: 'jordan', when: '2 days ago', text: 'Dropped the PDF in our shared drive' },
      { who: 'me',     when: '2 days ago', text: 'Marked as done' },
    ],
  },
  {
    id: 'REQ-101',
    title: 'Pull-request review on auth refactor',
    desc: 'Big one — ~600 LOC. The session-cookie change is the riskiest part.',
    direction: 'received',
    from: 'sam', to: 'me',
    status: 'requested',
    priority: 'high',
    due: day(0),
    created: day(-2),
    activity: [
      { who: 'sam', when: '2 days ago', text: 'Submitted this request' },
      { who: 'me',  when: 'today',      text: 'Started reviewing' },
    ],
  },
  {
    id: 'REQ-100',
    title: 'Approve PTO request — Sep 12–16',
    desc: 'Family trip. Already cleared with the team and lined up coverage.',
    direction: 'sent',
    from: 'me', to: 'hr',
    status: 'not_requested',
    priority: 'med',
    due: day(5),
    created: day(-1),
    activity: [
      { who: 'me', when: 'yesterday', text: 'Created this request' },
    ],
  },
  {
    id: 'REQ-099',
    title: 'Onboarding intro — 30 min this week?',
    desc: 'New hire on the team. Want to give them context on how our group works with yours.',
    direction: 'received',
    from: 'noor', to: 'me',
    status: 'requested',
    priority: 'low',
    due: day(7),
    created: day(-1),
    activity: [
      { who: 'noor', when: 'yesterday', text: 'Submitted this request' },
    ],
  },
  {
    id: 'REQ-098',
    title: 'Forward the latency dashboard link',
    desc: 'The one you showed me on the call — Grafana, p99 view.',
    direction: 'sent',
    from: 'me', to: 'kenji',
    status: 'not_requested',
    priority: 'low',
    due: day(4),
    created: day(-1),
    activity: [
      { who: 'me', when: 'yesterday', text: 'Created this request' },
    ],
  },
  {
    id: 'REQ-097',
    title: 'Confirm the off-site venue booking',
    desc: 'Need a yes/no by EOD Wednesday or we lose the deposit.',
    direction: 'received',
    from: 'elena', to: 'me',
    status: 'requested',
    priority: 'high',
    due: day(3),
    created: day(0),
    activity: [
      { who: 'elena', when: 'today', text: 'Submitted this request' },
    ],
  },
  {
    id: 'REQ-096',
    title: 'Intro me to your designer friend',
    desc: 'The one who did the rebrand for that fintech — looking for someone with similar sensibilities.',
    direction: 'sent',
    from: 'me', to: 'jordan',
    status: 'requested',
    priority: 'low',
    due: day(6),
    created: day(-2),
    activity: [
      { who: 'me',    when: '2 days ago', text: 'Created this request' },
      { who: 'jordan', when: 'today',    text: 'Drafting the intro email now' },
    ],
  },
  {
    id: 'REQ-095',
    title: 'Send invoice for August retainer',
    desc: '',
    direction: 'received',
    from: 'kenji', to: 'me',
    status: 'done',
    priority: 'med',
    due: day(-3),
    created: day(-8),
    activity: [
      { who: 'kenji', when: '8 days ago', text: 'Submitted this request' },
      { who: 'me',    when: '3 days ago', text: 'Paid via wire, sent receipt' },
    ],
  },
  {
    id: 'REQ-094',
    title: 'Headshots for the speaker page',
    desc: 'High-res, transparent bg if possible.',
    direction: 'sent',
    from: 'me', to: 'noor',
    status: 'not_requested',
    priority: 'low',
    due: day(4),
    created: day(-3),
    activity: [
      { who: 'me', when: '3 days ago', text: 'Created this request' },
    ],
  },
  {
    id: 'REQ-093',
    title: 'Walk me through the analytics setup',
    desc: 'I keep getting confused by how events and properties are namespaced.',
    direction: 'received',
    from: 'alex', to: 'me',
    status: 'done',
    priority: 'med',
    due: day(-1),
    created: day(-5),
    activity: [
      { who: 'alex', when: '5 days ago', text: 'Submitted this request' },
      { who: 'me',   when: '1 day ago',  text: 'Did a 30-min call — followed up with docs' },
    ],
  },
];

Object.assign(window, {
  ME, PEOPLE, personById,
  STATUSES, MANUAL_STATUSES, manualStatusesFor, defaultStatusFor,
  effectiveStatus, SEED_REQUESTS,
});
