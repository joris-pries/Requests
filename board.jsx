// Kanban board + cards

function formatDue(due) {
  if (!due) return { label: '—', tone: '' };
  const today = new Date(new Date().toDateString());
  const d = new Date(due);
  const diff = Math.round((d - today) / 86400000);
  let label = '';
  if (diff < 0) label = `${-diff}d overdue`;
  else if (diff === 0) label = 'Today';
  else if (diff === 1) label = 'Tomorrow';
  else if (diff < 7) label = `in ${diff}d`;
  else {
    const m = d.toLocaleString('en', { month: 'short' });
    label = `${m} ${d.getDate()}`;
  }
  const tone = diff < 0 ? 'overdue' : diff <= 2 ? 'soon' : '';
  return { label, tone };
}

function Card({ req, selected, onOpen, onToggleSelect, isChecked, onHover }) {
  const from = personById(req.from);
  const to   = personById(req.to);
  const due  = formatDue(req.due);
  const sent = req.direction === 'sent';
  const createdLabel = req.created
    ? new Date(req.created).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div className={"card" + (selected ? " selected" : "") + (isChecked ? " checked" : "")}
         data-req-id={req.id}
         onMouseEnter={() => onHover && onHover(req.id)}
         onMouseLeave={() => onHover && onHover(null)}
         onClick={(e) => {
           if (e.target.closest('.card-checkbox')) return;
           onOpen(req.id);
         }}>
      <div className="card-top">
        <span className={"dir " + (sent ? 'sent' : 'received')}>
          {sent ? <IconArrowUR size={10} /> : <IconArrowDL size={10} />}
          {sent ? 'out' : 'in'}
        </span>
        <span className="id-tag">{req.id}</span>
        {createdLabel && (
          <span className="created-tag mono">{createdLabel}</span>
        )}
      </div>

      <h4 className="title">{req.title}</h4>

      {req.desc && <p className="desc">{req.desc}</p>}

      <div className="card-foot">
        <div className="duo">
          <Avatar person={from} />
          <span className="arrow">
            <IconArrowR size={10} />
          </span>
          <Avatar person={to} />
        </div>
        <span className={"due mono " + due.tone}>
          {due.tone === 'overdue' && <span className="pri high" />}
          {due.tone === 'soon' && <span className="pri med" />}
          {due.label}
        </span>
      </div>
    </div>
  );
}

function Column({ status, requests, openId, onOpen, selected, onToggleSelect, onHover }) {
  return (
    <div className="column">
      <div className="col-head">
        <span className="col-dot" style={{ background: status.color }} />
        <span className="col-title">{status.label}</span>
        <span className="col-count">{requests.length}</span>
        {!status.auto && (
          <button className="col-add" title="Add to this column"
                  onClick={() => window.__openNew && window.__openNew({ status: status.id })}>
            <IconPlus size={12} />
          </button>
        )}
      </div>
      <div className="col-body">
        {requests.length === 0 && (
          <div style={{
            border: '1px dashed var(--line)',
            borderRadius: 'var(--radius)',
            padding: '14px 12px',
            fontSize: 12,
            color: 'var(--ink-3)',
            textAlign: 'center',
          }}>
            Nothing here
          </div>
        )}
        {requests.map(r => (
          <Card key={r.id} req={r}
                selected={openId === r.id}
                isChecked={selected.has(r.id)}
                onOpen={onOpen}
                onToggleSelect={onToggleSelect}
                onHover={onHover} />
        ))}
      </div>
    </div>
  );
}

function Board({ requests, layout, openId, onOpen, selected, onToggleSelect, onHover, view }) {
  const colOf = (r) => effectiveStatus(r);
  const byCol = (dir) => (s) => requests
    .filter(r => colOf(r) === s.id && (dir == null || r.direction === dir));

  const visibleStatuses = view === 'done'
    ? STATUSES.filter(s => s.id === 'done')
    : view === 'overdue'
      ? STATUSES.filter(s => s.id === 'overdue')
      : STATUSES.filter(s => s.id !== 'done');
  const gridStyle = { gridTemplateColumns: `repeat(${visibleStatuses.length}, minmax(260px, 1fr))` };

  if (layout === 'split') {
    return (
      <div className="board split" style={gridStyle}>
        <div className="lane-label" style={{ gridColumn: '1 / -1' }}>
          <IconArrowUR size={12} style={{ color: 'var(--sent)' }} />
          <span className="lane-title">Out</span>
          <span className="lane-rule" />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {requests.filter(r => r.direction === 'sent').length} requests
          </span>
        </div>
        {visibleStatuses.map(s => (
          <Column key={'s-'+s.id} status={s} requests={byCol('sent')(s)}
                  openId={openId} onOpen={onOpen} selected={selected}
                  onToggleSelect={onToggleSelect} onHover={onHover} />
        ))}
        <div className="lane-label" style={{ gridColumn: '1 / -1' }}>
          <IconArrowDL size={12} style={{ color: 'var(--received)' }} />
          <span className="lane-title">In</span>
          <span className="lane-rule" />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {requests.filter(r => r.direction === 'received').length} requests
          </span>
        </div>
        {visibleStatuses.map(s => (
          <Column key={'r-'+s.id} status={s} requests={byCol('received')(s)}
                  openId={openId} onOpen={onOpen} selected={selected}
                  onToggleSelect={onToggleSelect} onHover={onHover} />
        ))}
      </div>
    );
  }

  return (
    <div className="board" style={gridStyle}>
      {visibleStatuses.map(s => (
        <Column key={s.id} status={s} requests={byCol(null)(s)}
                openId={openId} onOpen={onOpen} selected={selected}
                onToggleSelect={onToggleSelect} onHover={onHover} />
      ))}
    </div>
  );
}

Object.assign(window, { Board, Card, Column, formatDue });
