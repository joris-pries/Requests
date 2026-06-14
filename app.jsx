// Root app

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#c2410c",
  "density": "regular",
  "dark": false,
  "layout": "unified"
}/*EDITMODE-END*/;

function applyTheme(t) {
  const root = document.documentElement;
  root.dataset.theme = t.dark ? 'dark' : 'light';
  root.dataset.density = t.density;
  root.style.setProperty('--accent', t.accent);
  const tmp = document.createElement('div');
  tmp.style.color = t.accent;
  document.body.appendChild(tmp);
  const rgb = getComputedStyle(tmp).color;
  document.body.removeChild(tmp);
  const m = rgb.match(/\d+/g);
  if (m) {
    const [r, g, b] = m.map(Number);
    const softA = t.dark ? 0.18 : 0.12;
    root.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, ${softA})`);
    root.style.setProperty('--accent-ink', t.accent);
  }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [requests, setRequests] = React.useState(() => {
    try {
      const s = localStorage.getItem('loop-requests');
      const loaded = s ? JSON.parse(s) : SEED_REQUESTS;
      return loaded.map(r => r.status === 'progress' ? { ...r, status: 'requested' } : r);
    } catch { return SEED_REQUESTS; }
  });

  React.useEffect(() => {
    localStorage.setItem('loop-requests', JSON.stringify(requests));
  }, [requests]);
  const [people, setPeople] = React.useState(() => {
    try {
      const s = localStorage.getItem('loop-people');
      return s ? JSON.parse(s) : PEOPLE;
    } catch { return PEOPLE; }
  });

  const [groups, setGroups] = React.useState(() => {
    try {
      const s = localStorage.getItem('loop-groups');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  React.useEffect(() => {
    window.ALL_PEOPLE = people;
    localStorage.setItem('loop-people', JSON.stringify(people));
  }, [people]);

  React.useEffect(() => {
    window.ALL_GROUPS = groups;
    localStorage.setItem('loop-groups', JSON.stringify(groups));
  }, [groups]);

  const [view, setView] = React.useState('all');
  const [peopleFilter, setPeopleFilter] = React.useState(null);
  const [tagFilter, setTagFilter] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [openId, setOpenId] = React.useState(null);
  const [editId, setEditId] = React.useState(null);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [hoveredId, setHoveredId] = React.useState(null);
  const mousePos    = React.useRef({ x: 0, y: 0 });
  const saveTimer   = React.useRef(null);
  const lastWritten = React.useRef(null);
  const handleHover = React.useCallback((id) => {
    setHoveredId(id);
    if (id) document.activeElement?.blur();
  }, []);
  const [selected, setSelected] = React.useState(new Set());
  const [newModal, setNewModal] = React.useState(null); // null | {} | {status}
  const [sort, setSort] = React.useState('priority');
  const [fileHandle, setFileHandle] = React.useState(null);
  const [showFileModal, setShowFileModal] = React.useState(false);
  const [pendingHandle, setPendingHandle] = React.useState(null);
  const [showPeoplePicker, setShowPeoplePicker] = React.useState(false);
  const [showTagPicker, setShowTagPicker] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => { applyTheme(t); }, [t.accent, t.dark, t.density]);

  // On mount: try to restore stored handle.
  // If permission is already granted or can be auto-requested, load silently.
  // Only show the modal if a user gesture is truly required (first time, or request failed).
  React.useEffect(() => {
    const S = window.LoopStorage;
    if (!S?.supported) return;
    S.getStoredHandle().then(async (handle) => {
      if (handle) {
        // Try to request permission immediately — modern Chrome allows this without gesture
        // if the file was used recently.
        try {
          const perm = await handle.requestPermission({ mode: 'readwrite' });
          if (perm === 'granted') {
            await applyFileData(handle);
            return;
          }
        } catch (e) {
          // requestPermission may throw if user gesture is required; fall through to modal
        }
        setPendingHandle(handle);
      }
      setShowFileModal(true);
    });
  }, []);

  const applyFileData = async (handle) => {
    const S = window.LoopStorage;
    const data = await S.readLoopFile(handle);
    const migrate = r => r.status === 'progress' ? { ...r, status: 'requested' } : r;
    const r2 = data.requests ? data.requests.map(migrate) : undefined;
    const p2 = data.people;
    const g2 = data.groups || [];
    if (r2) setRequests(r2);
    if (p2) setPeople(p2);
    setGroups(g2);
    lastWritten.current = JSON.stringify({ requests: r2 || [], people: p2 || [], groups: g2 });
    setFileHandle(handle);
  };

  const allowStorage = async () => {
    const S = window.LoopStorage;
    if (!S?.supported) return;
    try {
      if (pendingHandle) {
        // Re-grant permission to existing file
        const ok = await S.verifyPermission(pendingHandle);
        if (ok) {
          await applyFileData(pendingHandle);
          setPendingHandle(null);
          setShowFileModal(false);
        }
      } else {
        // First time — open existing loop-data.json with read+write access
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Loop Data', accept: { 'application/json': ['.json'] } }],
          mode: 'readwrite',
        });
        await applyFileData(handle);
        await S.storeHandle(handle);
        setShowFileModal(false);
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.warn('Loop storage error:', e);
      setShowFileModal(false);
    }
  };

  // Auto-save to file whenever data changes (debounced, skips identical writes)
  React.useEffect(() => {
    if (!fileHandle) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const data = { requests, people, groups };
      const json = JSON.stringify(data);
      if (json === lastWritten.current) return;
      try {
        await window.LoopStorage.writeLoopFile(fileHandle, data);
        lastWritten.current = json;
      } catch (e) {
        if (e.name === 'NotAllowedError') { setFileHandle(null); setShowFileModal(true); }
      }
    }, 1200);
    return () => clearTimeout(saveTimer.current);
  }, [requests, people, groups, fileHandle]);

  React.useEffect(() => {
    window.__openNew = (init) => setNewModal(init || {});
    return () => { delete window.__openNew; };
  }, []);

  React.useEffect(() => {
    const h = (e) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); setShowHelp(h => !h); }
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setNewModal({}); }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        if (selected.size > 0 && peopleFilter && people.some(p => p.id === peopleFilter)) {
          bulkAssign(peopleFilter);
          setSelected(new Set());
        } else {
          setNewModal(peopleFilter ? { _prefillPerson: peopleFilter } : {});
        }
      }
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); setShowPeoplePicker(true); }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); setShowTagPicker(true); }
      if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); setView('quick'); }
      if (e.key === '/') { e.preventDefault(); document.querySelector('.search input')?.focus(); }
      if (e.key === 'Escape') { setSelected(new Set()); }
      if (e.key === 'e' || e.key === 'E') {
        const target = openId || hoveredId;
        if (target) { e.preventDefault(); setEditId(target); }
      }
      if (e.key === 'd' || e.key === 'D') {
        const target = openId || hoveredId;
        if (target) {
          e.preventDefault();
          setRequests(rs => rs.map(r => r.id === target ? { ...r, deleted: true } : r));
          if (openId === target) setOpenId(null);
          setTimeout(() => {
            const el = document.elementFromPoint(mousePos.current.x, mousePos.current.y);
            const card = el?.closest('[data-req-id]');
            setHoveredId(card ? card.dataset.reqId : null);
          }, 0);
        }
      }
      if (e.key === ' ' && hoveredId && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        const targetId = hoveredId;
        setRequests(rs => {
          const req = rs.find(r => r.id === targetId);
          if (!req) return rs;
          if (req.deleted) {
            return rs.map(r => r.id === targetId ? { ...r, deleted: false } : r);
          }
          const eff = effectiveStatus(req);
          const newStatus =
            req.status === 'not_requested' ? 'requested' :
            req.status === 'requested' || eff === 'overdue' ? 'done' :
            req.status === 'done' ? 'requested' :
            null;
          if (!newStatus) return rs;
          if (newStatus !== 'done' || !req.recurrence?.type || req.recurrence.type === 'custom') {
            const actText = newStatus === 'done' ? 'Marked as done' : 'Marked as requested';
            return rs.map(r => r.id === targetId
              ? { ...r, status: newStatus, doneAt: newStatus === 'done' ? new Date().toISOString().slice(0, 10) : r.doneAt, activity: [...r.activity, { who: 'me', when: 'just now', text: actText }] }
              : r);
          }
          // Done + recurring: mark done and create next instance
          const today = new Date().toISOString().slice(0, 10);
          const updated = rs.map(r => r.id === targetId
            ? { ...r, status: 'done', doneAt: today, activity: [...r.activity, { who: 'me', when: 'just now', text: 'Marked as done' }] }
            : r);
          const seriesId = req.recurringSeriesId || ('series-' + Date.now());
          const withSeries = req.recurringSeriesId ? updated
            : updated.map(r => r.id === targetId ? { ...r, recurringSeriesId: seriesId } : r);
          const nextReq = {
            id: 'REQ-' + String(Date.now()).slice(-6),
            title: req.title, desc: req.desc,
            direction: req.direction, from: req.from, to: req.to,
            priority: req.priority, recurrence: req.recurrence,
            recurringSeriesId: seriesId,
            due: computeNextDue(req.due, req.recurrence.type),
            status: defaultStatusFor(req.direction),
            doneAt: null, created: today,
            activity: [{ who: 'me', when: 'just now', text: 'Auto-created from recurring request' }],
          };
          return [nextReq, ...withSeries];
        });
        setTimeout(() => {
          const el = document.elementFromPoint(mousePos.current.x, mousePos.current.y);
          const card = el?.closest('[data-req-id]');
          setHoveredId(card ? card.dataset.reqId : null);
        }, 0);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [openId, hoveredId, selected, peopleFilter, people]);

  const deletedRequests = React.useMemo(() => requests.filter(r => r.deleted), [requests]);

  const filtered = React.useMemo(() => {
    const arr = requests.filter(r => {
      if (r.deleted) return false;
      if (view !== 'done' && r.status === 'done') return false;
      if (view === 'sent' && r.direction !== 'sent') return false;
      if (view === 'received' && r.direction !== 'received') return false;
      if (view === 'done' && r.status !== 'done') return false;
      if (view === 'overdue') {
        if (effectiveStatus(r) !== 'overdue') return false;
      }
      if (peopleFilter) {
        const other = r.direction === 'sent' ? r.to : r.from;
        if (peopleFilter.startsWith('grp-')) {
          const grp = groups.find(g => g.id === peopleFilter);
          if (!grp || !grp.members.includes(other)) return false;
        } else {
          if (other !== peopleFilter) return false;
        }
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = (r.title + ' ' + r.desc + ' ' + r.id + ' ' + personById(r.from).name + ' ' + personById(r.to).name).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (tagFilter && !(r.tags || []).includes(tagFilter)) return false;
      return true;
    });
    const PRI = { high: 0, med: 1, low: 2 };
    arr.sort((a, b) => {
      if (sort === 'priority') return (PRI[a.priority] ?? 1) - (PRI[b.priority] ?? 1);
      if (sort === 'due') {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due) - new Date(b.due);
      }
      if (sort === 'newest') return new Date(b.created) - new Date(a.created);
      return 0;
    });
    return arr;
  }, [requests, view, peopleFilter, tagFilter, query, sort, groups]);

  const openReq = requests.find(r => r.id === openId);
  const editReq = requests.find(r => r.id === editId);

  const updateReq = (id, fn) => setRequests(rs => rs.map(r => {
    if (r.id !== id) return r;
    const updated = fn(r);
    if (updated.status === 'done' && r.status !== 'done') updated.doneAt = new Date().toISOString().slice(0, 10);
    if (updated.status !== 'done' && r.status === 'done') updated.doneAt = null;
    return updated;
  }));

  const handleStatusChange = (id, newStatus) => {
    if (newStatus !== 'done') {
      updateReq(id, r => ({ ...r, status: newStatus }));
      return;
    }
    setRequests(rs => {
      const req = rs.find(r => r.id === id);
      if (!req) return rs;
      const today = new Date().toISOString().slice(0, 10);
      const updated = rs.map(r => r.id === id ? { ...r, status: 'done', doneAt: today } : r);
      if (!req.recurrence || !req.recurrence.type || req.recurrence.type === 'custom') return updated;
      const seriesId = req.recurringSeriesId || ('series-' + Date.now());
      const withSeries = req.recurringSeriesId ? updated
        : updated.map(r => r.id === id ? { ...r, recurringSeriesId: seriesId } : r);
      const nextReq = {
        id: 'REQ-' + String(Date.now()).slice(-6),
        title: req.title, desc: req.desc,
        direction: req.direction, from: req.from, to: req.to,
        priority: req.priority, recurrence: req.recurrence,
        recurringSeriesId: seriesId,
        due: computeNextDue(req.due, req.recurrence.type),
        status: defaultStatusFor(req.direction),
        doneAt: null,
        created: today,
        activity: [{ who: 'me', when: 'just now', text: 'Auto-created from recurring request' }],
      };
      return [nextReq, ...withSeries];
    });
  };

  const toggleSelect = (id) => setSelected(s => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const bulkMove = (statusId) => {
    setRequests(rs => rs.map(r => selected.has(r.id) ? { ...r, status: statusId } : r));
  };
  const bulkAssign = (personId) => {
    setRequests(rs => rs.map(r => {
      if (!selected.has(r.id)) return r;
      if (r.direction === 'sent') return { ...r, to: personId };
      return { ...r, from: personId };
    }));
  };
  const bulkDelete = () => {
    setRequests(rs => rs.filter(r => !selected.has(r.id)));
    setSelected(new Set());
  };
  const bulkDone = () => {
    setRequests(rs => rs.map(r => selected.has(r.id) ? {
      ...r, status: 'done',
      activity: [...r.activity, { who: 'me', when: 'just now', text: 'Marked as done (bulk)' }],
    } : r));
    setSelected(new Set());
  };

  const onCreate = (req) => {
    if (req._groupId) {
      const grp = groups.find(g => g.id === req._groupId);
      if (grp && grp.members.length > 0) {
        const groupRequestId = 'broadcast-' + Date.now();
        const newReqs = grp.members.map((memberId, i) => ({
          ...req,
          id: 'REQ-' + String(Date.now() + i).slice(-6),
          _groupId: undefined,
          groupRequestId,
          groupName: grp.name,
          from: req.direction === 'sent' ? 'me' : memberId,
          to: req.direction === 'sent' ? memberId : 'me',
        }));
        setRequests(rs => [...newReqs, ...rs]);
        setNewModal(null);
        return;
      }
    }
    if (req._memberIds && req._memberIds.length > 1) {
      const groupRequestId = 'broadcast-' + Date.now();
      const newReqs = req._memberIds.map((memberId, i) => ({
        ...req,
        id: 'REQ-' + String(Date.now() + i).slice(-6),
        _memberIds: undefined,
        groupRequestId,
        from: req.direction === 'sent' ? 'me' : memberId,
        to: req.direction === 'sent' ? memberId : 'me',
      }));
      setRequests(rs => [...newReqs, ...rs]);
      setNewModal(null);
      return;
    }
    setRequests(rs => [req, ...rs]);
    setNewModal(null);
  };

  const onQuickAdd = (req) => {
    setRequests(rs => Array.isArray(req) ? [...req, ...rs] : [req, ...rs]);
  };

  const onEditSubmit = (updated) => {
    setRequests(rs => rs.map(r => r.id === updated.id ? updated : r));
    setEditId(null);
  };

  const addPerson = ({ name, initials, color }) => {
    setPeople(ps => [...ps, { id: 'p-' + Date.now(), name, initials, color }]);
  };

  const addGroup = ({ name, color, members }) => {
    setGroups(gs => [...gs, { id: 'grp-' + Date.now(), name, color, members }]);
  };

  const deletePerson = (id) => {
    setPeople(ps => ps.filter(p => p.id !== id));
    setGroups(gs => gs.map(g => ({ ...g, members: g.members.filter(m => m !== id) })));
    if (peopleFilter === id) setPeopleFilter(null);
  };

  const deleteGroup = (id) => {
    setGroups(gs => gs.filter(g => g.id !== id));
    if (peopleFilter === id) setPeopleFilter(null);
  };

  const purgeDeleted = () => setRequests(rs => rs.filter(r => !r.deleted));



  const viewTitle = {
    all: 'All requests',
    sent: 'Out',
    received: 'In',
    overdue: 'Past due',
    done: 'Done',
    quick: 'Quick add',
    deleted: 'Deleted',
    broadcasts: 'Broadcasts',
  }[view];

  return (
    <div className={"app" + (selected.size > 0 ? " bulk-mode" : "")}>
      <Sidebar requests={requests}
               allPeople={people} groups={groups}
               view={view} setView={(v) => { setView(v); setSelected(new Set()); }}
               peopleFilter={peopleFilter} setPeopleFilter={setPeopleFilter}
               tagFilter={tagFilter} setTagFilter={setTagFilter}
               onOpenAdd={() => setAddModalOpen(true)}
               onDeletePerson={deletePerson}
               onDeleteGroup={deleteGroup}
               fileName={fileHandle?.name || null} />

      <main className="main">
        <div className="topbar">
          <div className="crumb">
            {viewTitle}
            {view !== 'quick' && view !== 'deleted' && view !== 'broadcasts' && (
              <span className="sub">{filtered.length} / {requests.filter(r => !r.deleted && r.status !== 'done').length}</span>
            )}
          </div>

          {view !== 'quick' && view !== 'deleted' && <div style={{ width: 14 }} />}

          {view !== 'quick' && view !== 'deleted' && view !== 'broadcasts' && (
            <div className="filter-chips">
              <button className={"chip" + (view === 'all' ? ' active' : '')}
                      onClick={() => setView('all')}>All</button>
              <button className={"chip" + (view === 'sent' ? ' active' : '')}
                      onClick={() => setView('sent')}>
                <span className="dot sent" /> Out
              </button>
              <button className={"chip" + (view === 'received' ? ' active' : '')}
                      onClick={() => setView('received')}>
                <span className="dot received" /> In
              </button>
            </div>
          )}

          {view !== 'quick' && view !== 'deleted' && view !== 'broadcasts' && (
            <div className="sort-ctrl">
              {[['priority', 'Priority'], ['due', 'Due date'], ['newest', 'Newest']].map(([val, lab]) => (
                <button key={val}
                        className={'sort-opt' + (sort === val ? ' active' : '')}
                        onClick={() => setSort(val)}>
                  {lab}
                </button>
              ))}
            </div>
          )}

          {peopleFilter && (
            <button className="btn ghost"
                    style={{ padding: '3px 10px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}
                    onClick={() => setNewModal({ _prefillPerson: peopleFilter })}>
              <IconPlus size={12} /> New request
              <span className="kbd" style={{ marginLeft: 2 }}>M</span>
            </button>
          )}

          {tagFilter && (
            <button className="btn ghost"
                    style={{ padding: '3px 10px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, fontFamily: 'Geist Mono, monospace' }}
                    onClick={() => setTagFilter(null)}>
              #{tagFilter} ×
            </button>
          )}

          <div className="spacer" />

          <div className="search">
            <IconSearch size={14} style={{ color: 'var(--ink-3)' }} />
            <input value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder="Search requests, people…" />
            <span className="kbd">/</span>
          </div>

          <button className={"icon-btn" + (t.layout === 'split' ? ' active' : '')}
                  title="Split by direction"
                  onClick={() => setTweak('layout', t.layout === 'split' ? 'unified' : 'split')}>
            <IconBoard size={16} />
          </button>
        </div>

        <div className="board-wrap">
          {view === 'quick' ? (
            <QuickAdd requests={requests} groups={groups} onAdd={onQuickAdd} onOpen={setOpenId} onHover={handleHover} />
          ) : view === 'broadcasts' ? (
            <BroadcastsView requests={requests.filter(r => !r.deleted && r.groupRequestId)} groups={groups} peopleFilter={peopleFilter} onOpen={setOpenId} onHover={handleHover} />
          ) : view === 'deleted' ? (
            <div className="deleted-view">
              {deletedRequests.length === 0 ? (
                <div className="empty-state">
                  <span className="serif">Nothing deleted.</span>
                </div>
              ) : (
                <>
                  <div className="deleted-head">
                    <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      Hover + Space to restore · D to delete
                    </span>
                    <button className="btn ghost" style={{ color: 'var(--warn)' }} onClick={purgeDeleted}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <IconTrash size={13} /> Permanently delete all
                      </span>
                    </button>
                  </div>
                  <div className="deleted-list">
                    {deletedRequests.map(r => {
                      const person = r.direction === 'sent' ? personById(r.to) : personById(r.from);
                      const status = STATUSES.find(s => s.id === r.status);
                      return (
                        <div key={r.id} className={'deleted-item' + (hoveredId === r.id ? ' hov' : '')}
                             data-req-id={r.id}
                             onMouseEnter={() => handleHover(r.id)}
                             onMouseLeave={() => handleHover(null)}>
                          <span className={'qa-dir-arrow ' + r.direction}>
                            {r.direction === 'sent' ? <IconArrowUR size={12} /> : <IconArrowDL size={12} />}
                          </span>
                          <Avatar person={person} />
                          <span className="deleted-title">{r.title}</span>
                          {status && (
                            <span className="deleted-status mono">
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color, display: 'inline-block', marginRight: 5 }} />
                              {status.label}
                            </span>
                          )}
                          {hoveredId === r.id && (
                            <button className="btn ghost" style={{ padding: '3px 10px', fontSize: 12 }}
                                    onClick={() => setRequests(rs => rs.map(rx => rx.id === r.id ? { ...rx, deleted: false } : rx))}>
                              Restore
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="serif">Nothing matches.</span>
              Try clearing filters, or press <span className="mono" style={{
                padding: '1px 5px', border: '1px solid var(--line)', borderRadius: 3,
                fontSize: 11,
              }}>N</span> to log a new one.
            </div>
          ) : (
            <Board requests={filtered}
                   layout={t.layout}
                   view={view}
                   openId={openId}
                   onOpen={setOpenId}
                   selected={selected}
                   onToggleSelect={toggleSelect}
                   onHover={handleHover} />
          )}
        </div>
      </main>

      {openReq && (
        <Drawer req={openReq}
                onClose={() => setOpenId(null)}
                onEdit={setEditId}
                onUpdate={updateReq}
                onStatusChange={handleStatusChange} />
      )}

      {newModal && (
        <NewRequestModal initial={newModal}
                         onClose={() => setNewModal(null)}
                         onSubmit={onCreate} />
      )}

      {editReq && (
        <NewRequestModal existing={editReq}
                         onClose={() => setEditId(null)}
                         onSubmit={onEditSubmit} />
      )}

      {selected.size > 0 && (
        <BulkBar count={selected.size}
                 onClear={() => setSelected(new Set())}
                 onMove={bulkMove}
                 onAssign={bulkAssign}
                 onDelete={bulkDelete}
                 onMarkDone={bulkDone} />
      )}

      {addModalOpen && (
        <AddModal allPeople={people}
                  onAddPerson={(p) => { addPerson(p); setAddModalOpen(false); }}
                  onAddGroup={(g) => { addGroup(g); setAddModalOpen(false); }}
                  onClose={() => setAddModalOpen(false)} />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showTagPicker && (
        <TagPicker
          requests={requests}
          onSelect={(tag) => setTagFilter(tag)}
          onClose={() => setShowTagPicker(false)}
        />
      )}

      {showPeoplePicker && (
        <PeoplePicker
          allPeople={people}
          groups={groups}
          onSelect={(id, isGroup) => {
            setPeopleFilter(id);
            if (isGroup) {
              setView('broadcasts');
            } else if (view === 'broadcasts' || view === 'quick' || view === 'deleted') {
              setView('all');
            }
          }}
          onClose={() => setShowPeoplePicker(false)}
        />
      )}

      {showFileModal && window.LoopStorage?.supported && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-head">
              <div className="title">Save data locally</div>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                {pendingHandle
                  ? <>Allow Loop to access <strong>loop-data.json</strong> to load and save your data.</>
                  : <>Select <strong>loop-data.json</strong> from your Requests folder to load and save your data.</>}}
              </p>
            </div>
            <div className="modal-foot" style={{ justifyContent: 'flex-end' }}>
              <button className="btn" onClick={allowStorage}>Allow</button>
            </div>
          </div>
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakColor label="Accent" value={t.accent}
                    options={['#c2410c', '#15803d', '#1d4ed8', '#7c2d92']}
                    onChange={(v) => setTweak('accent', v)} />
        <TweakToggle label="Dark mode" value={t.dark}
                     onChange={(v) => setTweak('dark', v)} />
        <TweakRadio label="Density" value={t.density}
                    options={['compact', 'regular', 'comfy']}
                    onChange={(v) => setTweak('density', v)} />

        <TweakSection label="Board" />
        <TweakRadio label="Layout" value={t.layout}
                    options={['unified', 'split']}
                    onChange={(v) => setTweak('layout', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
