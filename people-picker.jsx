// P shortcut — searchable people/group jump

function PeoplePicker({ allPeople, groups, onSelect, onClose }) {
  const [query, setQuery] = React.useState('');
  const [idx, setIdx] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const nonMe = allPeople.filter(p => !p.isMe);
  const all = [
    ...groups.map(g => ({ ...g, _type: 'group' })),
    ...nonMe.map(p => ({ ...p, _type: 'person' })),
  ];

  const hits = query.trim()
    ? all.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
    : all;

  React.useEffect(() => { setIdx(0); }, [query]);

  const select = (entity) => {
    onSelect(entity.id, entity._type === 'group');
    onClose();
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (hits[idx]) select(hits[idx]); }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '14vh' }}
         onClick={onClose}>
      <div className="modal" style={{ maxWidth: 340, padding: 0, gap: 0 }}
           onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderBottom: '1px solid var(--line)' }}>
          <IconSearch size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Jump to person or group…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5 }}
          />
        </div>

        <div style={{ maxHeight: 260, overflowY: 'auto', padding: '4px 0' }}>
          {hits.length === 0 && (
            <div style={{ padding: '10px 14px', color: 'var(--ink-3)', fontSize: 13 }}>No match</div>
          )}
          {hits.map((entity, i) => (
            <button key={entity.id}
                    className={'person-row' + (i === idx ? ' active' : '')}
                    style={{ width: '100%', padding: '6px 12px', borderRadius: 0 }}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => select(entity)}>
              {entity._type === 'group'
                ? <GroupAvatar group={entity} allPeople={allPeople} />
                : <Avatar person={entity} />}
              <span style={{ flex: 1, textAlign: 'left', marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entity.name}
              </span>
              {entity._type === 'group' && (
                <span style={{ fontSize: 10.5, color: 'var(--ink-3)', fontFamily: 'Geist Mono, monospace' }}>group</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '6px 12px', borderTop: '1px solid var(--line)', display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PeoplePicker });
