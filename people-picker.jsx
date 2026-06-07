// P shortcut — searchable people/group jump

function PeoplePicker({ allPeople, groups, onSelect, onClose }) {
  const [query, setQuery] = React.useState('');
  const [idx, setIdx] = React.useState(0);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);
  React.useEffect(() => {
    const el = listRef.current?.querySelector('.active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [idx]);

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

        <div ref={listRef} style={{ maxHeight: 260, overflowY: 'auto', padding: '4px 0' }}>
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

function TagPicker({ requests, onSelect, onClose }) {
  const [query, setQuery] = React.useState('');
  const [idx, setIdx] = React.useState(0);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);
  React.useEffect(() => {
    const el = listRef.current?.querySelector('.active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  const tags = React.useMemo(() => {
    const map = {};
    requests.forEach(r => {
      if (r.deleted || r.status === 'done') return;
      (r.tags || []).forEach(t => { map[t] = (map[t] || 0) + 1; });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
  }, [requests]);

  const hits = query.trim()
    ? tags.filter(({ tag }) => tag.includes(query.toLowerCase()))
    : tags;

  React.useEffect(() => { setIdx(0); }, [query]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (hits[idx]) { onSelect(hits[idx].tag); onClose(); } }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '14vh' }}
         onClick={onClose}>
      <div className="modal" style={{ maxWidth: 340, padding: 0, gap: 0 }}
           onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13, color: 'var(--ink-3)', flexShrink: 0 }}>#</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Jump to tag…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13.5 }}
          />
        </div>

        <div ref={listRef} style={{ maxHeight: 260, overflowY: 'auto', padding: '4px 0' }}>
          {tags.length === 0 && (
            <div style={{ padding: '10px 14px', color: 'var(--ink-3)', fontSize: 13 }}>No tags yet</div>
          )}
          {tags.length > 0 && hits.length === 0 && (
            <div style={{ padding: '10px 14px', color: 'var(--ink-3)', fontSize: 13 }}>No match</div>
          )}
          {hits.map(({ tag, count }, i) => (
            <button key={tag}
                    className={'person-row' + (i === idx ? ' active' : '')}
                    style={{ width: '100%', padding: '6px 12px', borderRadius: 0 }}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => { onSelect(tag); onClose(); }}>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--ink-3)', width: 16, flexShrink: 0 }}>#</span>
              <span style={{ flex: 1, textAlign: 'left', marginLeft: 4 }}>{tag}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'Geist Mono, monospace' }}>{count}</span>
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

Object.assign(window, { PeoplePicker, TagPicker });
