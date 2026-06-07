// Quick-add view — person circles, related requests, filter bar

function QuickAdd({ requests, groups, onAdd, onOpen, onHover }) {
  const [active, setActive] = React.useState(null); // { entityId, direction } | null
  const [title, setTitle] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [pinned, setPinned] = React.useState(new Set());
  const inputRef = React.useRef(null);
  const searchRef = React.useRef(null);

  React.useEffect(() => {
    if (active) setTimeout(() => inputRef.current?.focus(), 0);
  }, [active?.entityId, active?.direction]);

  const allPeople = (window.ALL_PEOPLE || PEOPLE).filter(p => !p.isMe);
  const allGroups = groups || [];

  // Combine people and groups into one entity list
  const allEntities = [
    ...allGroups.map(g => ({ ...g, _type: 'group' })),
    ...allPeople.map(p => ({ ...p, _type: 'person' })),
  ];

  const visibleEntities = allEntities.filter(e => {
    const matchesSearch = !search.trim() || e.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesPinned = pinned.size === 0 || pinned.has(e.id);
    return matchesSearch && matchesPinned;
  });

  const togglePin = (id) => setPinned(s => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const activate = (entityId, direction) => {
    const same = active?.entityId === entityId && active?.direction === direction;
    if (same) { setActive(null); setTitle(''); return; }
    setActive({ entityId, direction });
    setTitle('');
  };

  const submit = () => {
    if (!title.trim() || !active) return;
    const { entityId, direction } = active;
    const group = allGroups.find(g => g.id === entityId);
    const base = {
      title: title.trim(), desc: '',
      direction, status: defaultStatusFor(direction),
      priority: 'med', due: null,
      created: new Date().toISOString().slice(0, 10),
      activity: [{ who: 'me', when: 'just now', text: 'Created this request' }],
    };
    if (group) {
      const groupRequestId = 'broadcast-' + Date.now();
      const reqs = group.members.map((memberId, i) => ({
        ...base,
        id: 'REQ-' + String(Date.now() + i).slice(-6),
        groupRequestId,
        groupName: group.name,
        from: direction === 'sent' ? 'me' : memberId,
        to:   direction === 'sent' ? memberId : 'me',
      }));
      onAdd(reqs);
    } else {
      onAdd({
        ...base,
        id: 'REQ-' + String(Date.now()).slice(-6),
        from: direction === 'sent' ? 'me' : entityId,
        to:   direction === 'sent' ? entityId : 'me',
      });
    }
    setActive(null);
    setTitle('');
  };

  const cancel = () => { setActive(null); setTitle(''); };

  return (
    <div className="qa-wrap">
      {/* Sticky filter bar */}
      <div className="qa-filter-bar">
        <div className="search" style={{ width: 220, flexShrink: 0 }}>
          <IconSearch size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <input ref={searchRef}
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 onKeyDown={e => { if (e.key === 'Escape') setSearch(''); }}
                 placeholder="Find someone…" />
          {search && (
            <button style={{ color: 'var(--ink-3)', lineHeight: 1, display: 'flex' }}
                    onClick={() => setSearch('')}>
              <IconClose size={12} />
            </button>
          )}
        </div>

        <div className="qa-chips">
          {allEntities.map(e => {
            const on = pinned.has(e.id);
            return (
              <button key={e.id}
                      className={'qa-person-chip' + (on ? ' qa-chip-on' : '')}
                      title={e.name}
                      onClick={() => togglePin(e.id)}>
                <span className="qa-chip-dot" style={{ background: e.color || 'var(--ink-3)' }} />
                {e.name.split(' ')[0]}
              </button>
            );
          })}
          {pinned.size > 0 && (
            <button className="qa-chip-clear" onClick={() => setPinned(new Set())}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Entity grid — people and groups */}
      <div className="qa-grid">
        {visibleEntities.map(entity => {
          const isGroup    = entity._type === 'group';
          const isActive   = active?.entityId === entity.id;
          const sentActive = isActive && active.direction === 'sent';
          const recActive  = isActive && active.direction === 'received';
          const firstName  = entity.name.split(' ')[0];

          const openReqs = requests.filter(r => {
            if (r.status === 'done' || r.deleted) return false;
            const other = r.direction === 'sent' ? r.to : r.from;
            if (isGroup) return entity.members.includes(other);
            return other === entity.id;
          });

          const memberPeople = isGroup
            ? entity.members.map(id => (window.ALL_PEOPLE || PEOPLE).find(p => p.id === id)).filter(Boolean)
            : null;

          return (
            <div key={entity.id} className="qa-col">
              <div className={'qa-card' + (isActive ? ' qa-open' : '')}>
                <div className="qa-avatar-wrap">
                  {isGroup ? (
                    <div className="qa-circle qa-group-circle" style={{ background: entity.color, position: 'relative' }}>
                      {memberPeople.slice(0, 3).map((p, i) => (
                        <div key={p.id} className="avatar"
                             style={{
                               background: p.color, width: 18, height: 18, fontSize: 7,
                               position: 'absolute',
                               left: i * 10 - (Math.min(memberPeople.length, 3) - 1) * 5,
                               top: '50%', transform: 'translateY(-50%)',
                               border: '1.5px solid var(--bg-elev)',
                               zIndex: 10 - i,
                             }}>
                          {p.initials}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="qa-circle" style={{ background: entity.color }}>
                      {entity.initials}
                    </div>
                  )}
                  {openReqs.length > 0 && (
                    <span className="qa-badge">{openReqs.length}</span>
                  )}
                </div>

                <div className="qa-name">{entity.name}</div>
                {isGroup && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                    {entity.members.length} people
                  </div>
                )}

                <div className="qa-actions">
                  <button
                    className={'qa-btn qa-sent' + (sentActive ? ' qa-on' : '')}
                    title={'Request something from ' + firstName}
                    onClick={() => activate(entity.id, 'sent')}>
                    <IconArrowUR size={11} /> Out
                  </button>
                  <button
                    className={'qa-btn qa-rec' + (recActive ? ' qa-on' : '')}
                    title={firstName + ' requested something from me'}
                    onClick={() => activate(entity.id, 'received')}>
                    <IconArrowDL size={11} /> In
                  </button>
                </div>

                {isActive && (
                  <div className="qa-entry">
                    <input
                      ref={inputRef}
                      type="text"
                      className="qa-title-input"
                      value={title}
                      placeholder={
                        active.direction === 'sent'
                          ? 'What do you need from ' + firstName + '?'
                          : 'What did ' + firstName + ' ask for?'
                      }
                      onChange={e => setTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submit();
                        if (e.key === 'Escape') cancel();
                      }}
                    />
                    <div className="qa-entry-foot">
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                        Return to add · Esc to cancel
                      </span>
                      <button
                        className="btn"
                        disabled={!title.trim()}
                        style={{ opacity: title.trim() ? 1 : 0.35, padding: '5px 12px', fontSize: 12.5 }}
                        onClick={submit}>
                        Add{isGroup ? ` (${entity.members.length})` : ''}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {openReqs.length > 0 && (
                <div className="qa-req-list">
                  {openReqs.map(r => (
                    <button key={r.id} className="qa-req-item"
                            data-req-id={r.id}
                            onMouseEnter={() => onHover && onHover(r.id)}
                            onMouseLeave={() => onHover && onHover(null)}
                            onClick={() => onOpen && onOpen(r.id)}
                            style={(() => {
                              const eff = effectiveStatus(r);
                              const sent = r.direction === 'sent';
                              const borderColor = eff === 'overdue' ? 'var(--warn)'
                                : sent ? 'var(--sent)' : 'var(--received)';
                              const bg = eff === 'overdue' ? 'var(--warn-soft)'
                                : eff === 'not_requested' ? 'var(--bg-elev)'
                                : sent ? 'var(--sent-soft)' : 'var(--received-soft)';
                              return { borderLeft: `2.5px solid ${borderColor}`, background: bg };
                            })()}>
                      <span className={'qa-dir-arrow ' + r.direction}>
                        {r.direction === 'sent'
                          ? <IconArrowUR size={10} />
                          : <IconArrowDL size={10} />}
                      </span>
                      <span className="qa-req-title">{r.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {visibleEntities.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center', padding: '48px 12px',
            color: 'var(--ink-3)', fontSize: 13,
          }}>
            No people match your filter.
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { QuickAdd });
