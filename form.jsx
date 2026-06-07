// New request modal + bulk action bar

function PersonPicker({ value, onChange, exclude, label }) {
  // value: array of IDs (person IDs or [groupId])
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef(null);
  const searchRef = React.useRef(null);

  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  React.useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
    else setSearch('');
  }, [open]);

  const allPeople = window.ALL_PEOPLE || PEOPLE;
  const allGroups = window.ALL_GROUPS || [];
  const q = search.toLowerCase();

  const isGroupSel = value.length === 1 && value[0]?.startsWith?.('grp-');
  const selectedGroup = isGroupSel ? allGroups.find(g => g.id === value[0]) : null;

  const options = allPeople.filter(p => p.id !== exclude && (!q || p.name.toLowerCase().includes(q)));
  const groupOptions = allGroups.filter(g => !q || g.name.toLowerCase().includes(q));

  const togglePerson = (personId) => {
    if (isGroupSel) {
      onChange([personId]);
    } else {
      const next = value.includes(personId) ? value.filter(id => id !== personId) : [...value, personId];
      onChange(next);
    }
  };

  const selectGroup = (groupId) => {
    onChange([groupId]);
    setOpen(false);
    setSearch('');
  };

  // Trigger display
  let trigger;
  if (value.length === 0) {
    trigger = (
      <React.Fragment>
        <span style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px dashed var(--line-2)', flexShrink: 0 }} />
        <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      </React.Fragment>
    );
  } else if (isGroupSel && selectedGroup) {
    trigger = (
      <React.Fragment>
        <div className="avatar" style={{ background: selectedGroup.color, display: 'grid', placeItems: 'center' }}>
          <IconUsers size={10} style={{ color: '#fff' }} />
        </div>
        <span>{selectedGroup.name}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{selectedGroup.members.length} people</span>
      </React.Fragment>
    );
  } else if (value.length === 1) {
    const person = personById(value[0]);
    trigger = (
      <React.Fragment>
        <Avatar person={person} />
        <span>{person.name}</span>
      </React.Fragment>
    );
  } else {
    const selectedPeople = value.map(id => personById(id));
    trigger = (
      <React.Fragment>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {selectedPeople.slice(0, 4).map((p, i) => (
            <div key={p.id} className="avatar"
                 style={{ background: p.color, width: 18, height: 18, fontSize: 7, marginLeft: i > 0 ? -5 : 0, border: '1.5px solid var(--bg-elev)', flexShrink: 0 }}>
              {p.initials}
            </div>
          ))}
        </div>
        <span>{value.length} people</span>
      </React.Fragment>
    );
  }

  return (
    <div className="picker" ref={ref}>
      <button type="button"
              className={"picker-trigger" + (value.length > 0 ? " filled" : "")}
              onClick={() => setOpen(o => !o)}>
        {trigger}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: 'var(--bg-elev)', border: '1px solid var(--line)',
          borderRadius: 10, boxShadow: 'var(--shadow-pop)',
          minWidth: 240, padding: 4, zIndex: 100,
        }}>
          <div style={{ padding: '4px 4px 2px' }}>
            <div className="search" style={{ width: '100%', boxSizing: 'border-box' }}>
              <IconSearch size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
              <input ref={searchRef} value={search}
                     onChange={e => setSearch(e.target.value)}
                     placeholder="Search…"
                     onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setSearch(''); } }} />
            </div>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {groupOptions.length > 0 && (
              <>
                <div style={{ padding: '4px 8px 2px', fontSize: 10.5, color: 'var(--ink-3)', fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Groups</div>
                {groupOptions.map(g => (
                  <button key={g.id} type="button"
                          onClick={() => selectGroup(g.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13,
                            background: isGroupSel && value[0] === g.id ? 'var(--hover)' : 'transparent',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = (isGroupSel && value[0] === g.id) ? 'var(--hover)' : 'transparent'; }}>
                    <div className="avatar" style={{ background: g.color, display: 'grid', placeItems: 'center' }}>
                      <IconUsers size={10} style={{ color: '#fff' }} />
                    </div>
                    <span style={{ flex: 1 }}>{g.name}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{g.members.length} people</span>
                    {isGroupSel && value[0] === g.id && <IconCheck size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                  </button>
                ))}
                <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
                <div style={{ padding: '4px 8px 2px', fontSize: 10.5, color: 'var(--ink-3)', fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>People</div>
              </>
            )}
            {options.map(p => {
              const checked = !isGroupSel && value.includes(p.id);
              return (
                <button key={p.id} type="button"
                        onClick={() => togglePerson(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13,
                          background: checked ? 'var(--hover)' : 'transparent',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = checked ? 'var(--hover)' : 'transparent'; }}>
                  <Avatar person={p} />
                  <span style={{ flex: 1 }}>{p.name}</span>
                  {p.isMe && <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', padding: '1px 5px', border: '1px solid var(--line)', borderRadius: 3 }}>me</span>}
                  {checked && <IconCheck size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
          {value.length > 1 && !isGroupSel && (
            <div style={{ borderTop: '1px solid var(--line)', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{value.length} selected</span>
              <button type="button" style={{ fontSize: 12, color: 'var(--ink-2)', padding: '2px 8px', borderRadius: 5, border: '1px solid var(--line)' }}
                      onClick={() => { onChange([]); }}>
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewRequestModal({ initial, existing, onClose, onSubmit }) {
  const isEdit = !!existing;
  const [direction, setDirection] = React.useState(existing?.direction || initial?.direction || 'sent');
  const [title, setTitle]   = React.useState(existing?.title || '');
  const [desc, setDesc]     = React.useState(existing?.desc || '');
  const [counter, setCounter] = React.useState(() => {
    if (existing) {
      const id = existing.direction === 'sent' ? existing.to : existing.from;
      return id ? [id] : [];
    }
    if (initial?._prefillPerson) return [initial._prefillPerson];
    return [];
  });
  const [due, setDue]       = React.useState(existing?.due || '');
  const [priority, setPri]  = React.useState(existing?.priority || 'med');
  const initDir = existing?.direction || initial?.direction || 'sent';
  const [status, setStatus] = React.useState(
    existing?.status || initial?.status || defaultStatusFor(initDir)
  );

  const titleRef = React.useRef(null);
  React.useEffect(() => { titleRef.current?.focus(); }, []);

  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const isGroupCounter  = counter.length === 1 && counter[0]?.startsWith?.('grp-');
  const counterGroup    = isGroupCounter ? (window.ALL_GROUPS || []).find(g => g.id === counter[0]) : null;
  const isMultiPerson   = !isGroupCounter && counter.length > 1;
  const canSubmit = title.trim() && counter.length > 0 &&
    (!isGroupCounter || (counterGroup && counterGroup.members.length > 0));

  const submit = () => {
    if (!canSubmit) return;

    if (isGroupCounter) {
      onSubmit({
        _groupId: counter[0],
        title: title.trim(), desc: desc.trim(),
        direction, status, priority, due: due || null,
        created: new Date().toISOString().slice(0, 10),
        activity: [{ who: 'me', when: 'just now', text: 'Created this request' }],
      });
      return;
    }

    if (!isEdit && isMultiPerson) {
      onSubmit({
        _memberIds: counter,
        title: title.trim(), desc: desc.trim(),
        direction, status, priority, due: due || null,
        created: new Date().toISOString().slice(0, 10),
        activity: [{ who: 'me', when: 'just now', text: 'Created this request' }],
      });
      return;
    }

    const personId = counter[0];
    const from = direction === 'sent' ? 'me' : personId;
    const to   = direction === 'sent' ? personId : 'me';

    if (isEdit) {
      onSubmit({
        ...existing,
        title: title.trim(), desc: desc.trim(),
        direction, from, to, status, priority, due: due || null,
        activity: [...existing.activity, { who: 'me', when: 'just now', text: 'Edited this request' }],
      });
    } else {
      onSubmit({
        id: 'REQ-' + (105 + Math.floor(Math.random() * 900)),
        title: title.trim(), desc: desc.trim(),
        direction, from, to, status, priority, due: due || null,
        created: new Date().toISOString().slice(0, 10),
        activity: [{ who: 'me', when: 'just now', text: 'Created this request' }],
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="title">
            {isEdit ? 'Edit request' : 'New request'}
            {!isEdit && (
              <div className="kind-toggle">
                <button type="button"
                        className={direction === 'sent' ? 'on sent' : ''}
                        onClick={() => {
                          setDirection('sent');
                          if (status === 'requested') setStatus('not_requested');
                        }}>&#x2197; Out</button>
                <button type="button"
                        className={direction === 'received' ? 'on received' : ''}
                        onClick={() => {
                          setDirection('received');
                          if (status === 'not_requested') setStatus('requested');
                        }}>&#x2199; In</button>
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={onClose}><IconClose size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Title</label>
            <input ref={titleRef} type="text"
                   value={title}
                   placeholder={direction === 'sent' ? 'What do you need from them?' : 'What are they asking for?'}
                   onChange={(e) => setTitle(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }} />
          </div>

          <div className="field">
            <label>Context</label>
            <textarea value={desc}
                      placeholder="Optional — links, background, anything that makes it easier."
                      onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div className="row2">
            <div className="field">
              <label>
                {direction === 'sent' ? 'Assignee' : 'Requester'}
                {isMultiPerson && <span style={{ marginLeft: 6, color: 'var(--accent)', fontWeight: 500 }}>{counter.length} people</span>}
              </label>
              <PersonPicker value={counter}
                            onChange={setCounter}
                            exclude="me"
                            label={direction === 'sent' ? 'Who you are asking' : 'Who asked you'} />
            </div>
            <div className="field">
              <label>Due date</label>
              <input type="date" value={due}
                     onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>

          <div className="row2">
            <div className="field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {manualStatusesFor(direction).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPri(e.target.value)}>
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <span className="hint">
            {isMultiPerson
              ? `Creates ${counter.length} linked requests`
              : isGroupCounter && counterGroup
                ? `Creates ${counterGroup.members.length} linked requests`
                : '⌘ + Return to ' + (isEdit ? 'save' : 'create')}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn" disabled={!canSubmit}
                    style={{ opacity: canSubmit ? 1 : 0.4 }}
                    onClick={submit}>
              {isEdit ? 'Save changes' : isMultiPerson || isGroupCounter ? 'Create requests' : 'Create request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkBar({ count, onClear, onMove, onDelete, onMarkDone, onAssign }) {
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);
  return (
    <div className="bulk-bar">
      <span className="count-pill">{count}</span>
      <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, marginRight: 6 }}>selected</span>

      <button className="bulk" onClick={onMarkDone}>
        <IconCheck size={13} /> Mark done
      </button>

      <div style={{ position: 'relative' }}>
        <button className="bulk" onClick={() => { setMoveOpen(o => !o); setAssignOpen(false); }}>
          <IconArrowR size={13} /> Move to
        </button>
        {moveOpen && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
            background: 'var(--bg-elev)', color: 'var(--ink)',
            border: '1px solid var(--line)', borderRadius: 10,
            boxShadow: 'var(--shadow-pop)', padding: 4, minWidth: 160,
          }}>
            {MANUAL_STATUSES.map(s => (
              <button key={s.id}
                      onClick={() => { onMove(s.id); setMoveOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '6px 8px',
                        borderRadius: 6, fontSize: 13,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button className="bulk" onClick={() => { setAssignOpen(o => !o); setMoveOpen(false); }}>
          <IconUsers size={13} /> Reassign
        </button>
        {assignOpen && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
            background: 'var(--bg-elev)', color: 'var(--ink)',
            border: '1px solid var(--line)', borderRadius: 10,
            boxShadow: 'var(--shadow-pop)', padding: 4, minWidth: 200,
            maxHeight: 220, overflowY: 'auto',
          }}>
            {PEOPLE.filter(p => !p.isMe).map(p => (
              <button key={p.id}
                      onClick={() => { onAssign(p.id); setAssignOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '6px 8px',
                        borderRadius: 6, fontSize: 13,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <Avatar person={p} />
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="bulk" onClick={onDelete}>
        <IconTrash size={13} /> Delete
      </button>

      <span className="div" />

      <button className="bulk close" onClick={onClear}>
        <IconClose size={13} />
      </button>
    </div>
  );
}

Object.assign(window, { NewRequestModal, BulkBar, PersonPicker });
