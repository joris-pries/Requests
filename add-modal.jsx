// Modal to add a person or a group

const PALETTE = [
  '#c2410c','#15803d','#6d28d9','#0e7490','#be185d',
  '#a16207','#4f46e5','#0891b2','#dc2626','#0369a1',
];

function pickColor(usedColors) {
  return PALETTE.find(c => !usedColors.includes(c)) || PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

function AddModal({ allPeople, onAddPerson, onAddGroup, onClose }) {
  const [tab, setTab] = React.useState('person');
  const [name, setName] = React.useState('');
  const [members, setMembers] = React.useState(new Set());
  const [memberSearch, setMemberSearch] = React.useState('');

  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const nonMe = allPeople.filter(p => !p.isMe).sort((a, b) => a.name.localeCompare(b.name));
  const usedColors = nonMe.map(p => p.color);
  const color = pickColor(usedColors);
  const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const canSubmit = name.trim() && (tab === 'person' || members.size > 0);

  const submit = () => {
    if (!canSubmit) return;
    if (tab === 'person') {
      onAddPerson({ name: name.trim(), initials, color });
    } else {
      onAddGroup({ name: name.trim(), color, members: [...members] });
    }
    onClose();
  };

  const toggleMember = (id) => setMembers(s => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <div className="title">
            <div className="kind-toggle">
              <button type="button" className={tab === 'person' ? 'on' : ''} onClick={() => setTab('person')}>
                Person
              </button>
              <button type="button" className={tab === 'group' ? 'on' : ''} onClick={() => setTab('group')}>
                Group
              </button>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><IconClose size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>{tab === 'person' ? 'Name' : 'Group name'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{
                background: tab === 'group' ? color : color,
                width: 28, height: 28, fontSize: 11, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tab === 'group'
                  ? <IconUsers size={13} style={{ color: '#fff' }} />
                  : <span style={{ color: '#fff' }}>{initials}</span>}
              </div>
              <input autoFocus type="text" value={name}
                     placeholder={tab === 'person' ? 'Full name' : 'e.g. Design team'}
                     onChange={e => setName(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') submit(); }} />
            </div>
          </div>

          {tab === 'group' && (
            <div className="field">
              <label>Members</label>
              <div className="search" style={{ marginBottom: 4 }}>
                <IconSearch size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                <input type="text" value={memberSearch}
                       onChange={e => setMemberSearch(e.target.value)}
                       placeholder="Search people…" />
              </div>
              <div className="member-list">
                {nonMe
                  .filter(p => !memberSearch.trim() || p.name.toLowerCase().includes(memberSearch.toLowerCase()))
                  .map(p => (
                    <label key={p.id} className="member-row">
                      <input type="checkbox" checked={members.has(p.id)} onChange={() => toggleMember(p.id)} />
                      <Avatar person={p} />
                      <span>{p.name}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <span className="hint" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn" disabled={!canSubmit}
                    style={{ opacity: canSubmit ? 1 : 0.4 }}
                    onClick={submit}>
              {tab === 'person' ? 'Add person' : 'Create group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AddModal });
