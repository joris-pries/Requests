// Inline SVG icon components — small set, consistent stroke

const _Icon = ({ size = 16, children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.6"
       strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconSearch  = (p) => <_Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></_Icon>;
const IconPlus    = (p) => <_Icon {...p}><path d="M12 5v14M5 12h14"/></_Icon>;
const IconArrowUR = (p) => <_Icon {...p}><path d="M7 17 17 7M9 7h8v8"/></_Icon>;
const IconArrowDL = (p) => <_Icon {...p}><path d="M17 7 7 17m0-8v8h8"/></_Icon>;
const IconArrowR  = (p) => <_Icon {...p}><path d="M5 12h14m-5-5 5 5-5 5"/></_Icon>;
const IconClose   = (p) => <_Icon {...p}><path d="M6 6l12 12M18 6 6 18"/></_Icon>;
const IconCheck   = (p) => <_Icon {...p}><path d="m5 12 5 5 9-11"/></_Icon>;
const IconCal     = (p) => <_Icon {...p}><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></_Icon>;
const IconFilter  = (p) => <_Icon {...p}><path d="M4 5h16M7 12h10M10 19h4"/></_Icon>;
const IconInbox   = (p) => <_Icon {...p}><path d="M3 12h5l1 3h6l1-3h5"/><path d="M3 12V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6m-18 0v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/></_Icon>;
const IconLayers  = (p) => <_Icon {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></_Icon>;
const IconUsers   = (p) => <_Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M17 20a6 6 0 0 0-3-5.2"/></_Icon>;
const IconArchive = (p) => <_Icon {...p}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/></_Icon>;
const IconBolt    = (p) => <_Icon {...p}><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"/></_Icon>;
const IconClock   = (p) => <_Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></_Icon>;
const IconMore    = (p) => <_Icon {...p}><circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/></_Icon>;
const IconTrash   = (p) => <_Icon {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6"/></_Icon>;
const IconBoard   = (p) => <_Icon {...p}><rect x="3" y="4" width="6" height="16" rx="1.5"/><rect x="11" y="4" width="6" height="10" rx="1.5"/><rect x="19" y="4" width="2" height="14" rx="1"/></_Icon>;
const IconAttach  = (p) => <_Icon {...p}><path d="M9 14V8a3 3 0 1 1 6 0v8a5 5 0 1 1-10 0V8"/></_Icon>;
const IconSparkle = (p) => <_Icon {...p}><path d="M12 4v5M12 15v5M4 12h5M15 12h5M7 7l3 3M14 14l3 3M17 7l-3 3M10 14l-3 3"/></_Icon>;
const IconEdit    = (p) => <_Icon {...p}><path d="M4 20h4l11-11a2.83 2.83 0 0 0-4-4L4 16v4Z"/><path d="m14 6 4 4"/></_Icon>;
const IconUser = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3.8" fill="currentColor"/>
    <ellipse cx="10" cy="19" rx="7.5" ry="5.5" fill="currentColor"/>
  </svg>
);

Object.assign(window, {
  IconSearch, IconPlus, IconArrowUR, IconArrowDL, IconArrowR,
  IconClose, IconCheck, IconCal, IconFilter, IconInbox, IconLayers,
  IconUsers, IconArchive, IconBolt, IconClock, IconMore, IconTrash,
  IconBoard, IconAttach, IconSparkle, IconEdit, IconUser,
});
