// Sidebar nav

function Avatar({ person, lg }) {
  if (!person) return null;
  if (person.isMe) {
    return (
      <div className={"avatar avatar-me" + (lg ? " lg" : "")}
           style={{ background: 'oklch(93% 0.008 70)', color: 'oklch(35% 0.015 60)', overflow: 'hidden' }}
           title={person.name}>
        <IconUser size={lg ? 22 : 16} />
      </div>
    );
  }
  return (
    <div className={"avatar" + (lg ? " lg" : "")}
         style={{ background: person.color }}
         title={person.name}>
      {person.initials}
    </div>
  );
}

function GroupAvatar({ group, allPeople, lg }) {
  const members = group.members.slice(0, 3).map(id => allPeople.find(p => p.id === id)).filter(Boolean);
  if (members.length === 0) {
    return (
      <div className={"avatar" + (lg ? " lg" : "")} style={{ background: group.color }}>
        <IconUsers size={10} style={{ color: '#fff' }} />
      </div>
    );
  }
  return (
    <div className="group-avatar-stack" style={{ width: lg ? 28 : 20, height: lg ? 28 : 20 }}>
      {members.slice(0, 3).map((p, i) => (
        <div key={p.id}
             className="avatar"
             style={{
               background: p.color,
               width: lg ? 16 : 12, height: lg ? 16 : 12,
               fontSize: 7,
               position: 'absolute',
               left: i * (lg ? 7 : 5),
               top: i * (lg ? 5 : 4),
               border: '1px solid var(--bg)',
               zIndex: 3 - i,
             }}>
          {p.initials}
        </div>
      ))}
    </div>
  );
}

function EntityRow({ entity, isActive, count, allPeople, onSelect, onDelete }) {
  const [confirming, setConfirming] = React.useState(false);
  const isGroup = entity._type === 'group';

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirming) {
      onDelete(entity.id);
    } else {
      setConfirming(true);
    }
  };

  return (
    <div className={"person-row" + (isGroup ? " group-row" : "") + (isActive ? " active" : "")}>
      <button style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}
              onClick={() => { setConfirming(false); onSelect(entity.id); }}>
        {isGroup
          ? <GroupAvatar group={entity} allPeople={allPeople} />
          : <Avatar person={entity} />}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entity.name}
        </span>
        {!confirming && <span className="count mono">{count}</span>}
      </button>
      {isActive && !confirming && (
        <button className="row-delete-btn" title="Delete" onClick={handleDelete}>
          <IconTrash size={11} />
        </button>
      )}
      {isActive && confirming && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="row-delete-btn" onClick={handleDelete}
                  style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 4, background: 'var(--warn)', color: '#fff' }}>
            Delete
          </button>
          <button className="row-delete-btn" onClick={e => { e.stopPropagation(); setConfirming(false); }}>
            <IconClose size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

function Sidebar({ requests, allPeople, groups, view, setView, peopleFilter, setPeopleFilter, tagFilter, setTagFilter, onOpenAdd, onDeletePerson, onDeleteGroup, fileName }) {
  const nonMe = allPeople.filter(p => !p.isMe);

  const counts = React.useMemo(() => {
    const active = requests.filter(r => !r.deleted && r.status !== 'done');
    const all      = active.length;
    const sent     = active.filter(r => r.direction === 'sent').length;
    const received = active.filter(r => r.direction === 'received').length;
    const overdue  = active.filter(r => effectiveStatus(r) === 'overdue').length;
    const done     = requests.filter(r => !r.deleted && r.status === 'done').length;
    const deleted  = requests.filter(r => r.deleted).length;
    const broadcastIds = [...new Set(requests.filter(r => !r.deleted && r.groupRequestId).map(r => r.groupRequestId))];
    const broadcasts = broadcastIds.filter(gid =>
      requests.some(r => !r.deleted && r.groupRequestId === gid && r.status !== 'done')
    ).length;
    return { all, sent, received, overdue, done, deleted, broadcasts };
  }, [requests]);

  const perPerson = React.useMemo(() => {
    const map = {};
    requests.forEach(r => {
      if (r.deleted || r.status === 'done') return;
      const other = r.direction === 'sent' ? r.to : r.from;
      if (other === 'me') return;
      map[other] = (map[other] || 0) + 1;
    });
    return map;
  }, [requests]);

  const perGroup = React.useMemo(() => {
    const map = {};
    groups.forEach(g => {
      map[g.id] = requests.filter(r =>
        !r.deleted && r.status !== 'done' &&
        g.members.includes(r.direction === 'sent' ? r.to : r.from)
      ).length;
    });
    return map;
  }, [requests, groups]);

  const tagCounts = React.useMemo(() => {
    const map = {};
    requests.forEach(r => {
      if (r.deleted || r.status === 'done') return;
      (r.tags || []).forEach(t => { map[t] = (map[t] || 0) + 1; });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [requests]);

  const goHome = () => { setView('all'); setPeopleFilter(null); setTagFilter(null); };

  const navItem = (id, icon, label, count) => (
    <button key={id}
            className={"nav-item" + (view === id ? " active" : "")}
            onClick={() => { setView(id); setPeopleFilter(null); }}>
      <span style={{ display: 'inline-flex', color: 'var(--ink-3)' }}>{icon}</span>
      <span>{label}</span>
      <span className="count mono">{count}</span>
    </button>
  );

  const entities = [
    ...groups.map(g => ({ ...g, _type: 'group' })),
    ...nonMe.map(p => ({ ...p, _type: 'person' })),
  ].sort((a, b) => {
    const ca = a._type === 'group' ? (perGroup[a.id] || 0) : (perPerson[a.id] || 0);
    const cb = b._type === 'group' ? (perGroup[b.id] || 0) : (perPerson[b.id] || 0);
    return cb - ca;
  });

  return (
    <aside className="sidebar">
      <button className="brand" onClick={goHome} style={{ textAlign: 'left', borderRadius: 6 }}>
        <div className="brand-mark">L</div>
        <div className="brand-name">Loop<em>.</em></div>
      </button>

      <button className="new-btn" onClick={() => window.__openNew && window.__openNew()}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconPlus size={14} /> New request
        </span>
        <span className="kbd">N</span>
      </button>

      <button className={"quick-btn" + (view === 'quick' ? ' active' : '')}
              onClick={() => setView('quick')}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconSparkle size={14} /> Quick add
        </span>
        <span className="kbd">Q</span>
      </button>

      <div className="nav-group">
        <div className="nav-label">Views</div>
        {navItem('all',        <IconLayers size={15} />,  'All requests', counts.all)}
        {navItem('sent',       <IconArrowUR size={15} />, 'Out',          counts.sent)}
        {navItem('received',   <IconArrowDL size={15} />, 'In',           counts.received)}
        {navItem('overdue',    <IconBolt size={15} />,    'Past due',     counts.overdue)}
        {navItem('done',       <IconArchive size={15} />, 'Done',         counts.done)}
        {navItem('broadcasts', <IconUsers size={15} />,   'Broadcasts',   counts.broadcasts)}
        {navItem('deleted',    <IconTrash size={15} />,   'Deleted',      counts.deleted)}
      </div>

      <div className="nav-group">
        <div className="nav-label" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ flex: 1 }}>People</span>
          <button className="icon-btn" style={{ width: 18, height: 18, borderRadius: 4 }}
                  title="Add person or group" onClick={onOpenAdd}>
            <IconPlus size={12} />
          </button>
        </div>

        {entities.map(entity => {
          const isGroup = entity._type === 'group';
          const isActive = peopleFilter === entity.id;
          const count = isGroup ? (perGroup[entity.id] || 0) : (perPerson[entity.id] || 0);
          return (
            <EntityRow
              key={entity.id}
              entity={entity}
              isActive={isActive}
              count={count}
              allPeople={allPeople}
              onSelect={(id) => {
                if (isActive) {
                  setPeopleFilter(null);
                } else {
                  setPeopleFilter(id);
                  if (isGroup) {
                    setView('broadcasts');
                  } else if (view === 'broadcasts' || view === 'quick' || view === 'deleted') {
                    setView('all');
                  }
                }
              }}
              onDelete={(id) => { isGroup ? onDeleteGroup(id) : onDeletePerson(id); }}
            />
          );
        })}
      </div>

      {tagCounts.length > 0 && (
        <div className="nav-group">
          <div className="nav-label">Tags</div>
          {tagCounts.map(([tag, count]) => (
            <button key={tag}
                    className={'tag-nav-item' + (tagFilter === tag ? ' active' : '')}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}>
              <span className="tag-hash">#</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{tag}</span>
              <span className="count mono">{count}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 11, color: 'var(--ink-3)', padding: '4px 6px 2px', fontFamily: 'Geist Mono, monospace' }}>
        v0.1 · {requests.filter(r => !r.deleted).length} open loops
      </div>
      {fileName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 6px 8px', fontSize: 11, color: 'var(--received)' }}>
          <IconCheck size={11} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
        </div>
      )}
    </aside>
  );
}

Object.assign(window, { Sidebar, Avatar, GroupAvatar });
