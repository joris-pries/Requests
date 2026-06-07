// Request detail drawer

function Drawer({ req, onClose, onEdit, onUpdate }) {
  const [comment, setComment] = React.useState('');
  if (!req) return null;
  const from = personById(req.from);
  const to   = personById(req.to);
  const sent = req.direction === 'sent';
  const due = formatDue(req.due);

  React.useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'e' || e.key === 'E') { e.preventDefault(); onEdit(req.id); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, onEdit, req.id]);

  const submitComment = () => {
    if (!comment.trim()) return;
    onUpdate(req.id, (r) => ({
      ...r,
      activity: [...r.activity, { who: 'me', when: 'just now', text: comment.trim() }],
    }));
    setComment('');
  };

  return (
    <React.Fragment>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <span className={"dir " + (sent ? 'sent' : 'received')}>
            {sent ? <IconArrowUR size={10} /> : <IconArrowDL size={10} />}
            {sent ? 'out' : 'in'}
          </span>
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{req.id}</span>
          <div style={{ flex: 1 }} />
          <button className="icon-btn" title="Edit (E)" onClick={() => onEdit(req.id)}>
            <IconEdit size={16} />
          </button>
          <button className="icon-btn" onClick={onClose} title="Close (Esc)"><IconClose size={16} /></button>
        </div>

        <div className="drawer-body">
          <h2>{req.title}</h2>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }} className="mono">
            opened {new Date(req.created).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </div>

          <div className="meta-grid">
            <div className="k">Status</div>
            <div className="v">
              <select value={req.status}
                      onChange={(e) => onUpdate(req.id, (r) => ({ ...r, status: e.target.value }))}
                      style={{
                        border: '1px solid var(--line)',
                        background: 'var(--bg-elev)',
                        padding: '4px 8px',
                        borderRadius: 7,
                        fontSize: 12.5,
                        fontFamily: 'inherit',
                      }}>
                {manualStatusesFor(req.direction).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div className="k">{sent ? 'To' : 'From'}</div>
            <div className="v">
              <Avatar person={sent ? to : from} />
              <span style={{ fontSize: 13 }}>{(sent ? to : from).name}</span>
            </div>

            <div className="k">{sent ? 'From' : 'To'}</div>
            <div className="v">
              <Avatar person={sent ? from : to} />
              <span style={{ fontSize: 13 }}>{(sent ? from : to).name}</span>
            </div>

            <div className="k">Due</div>
            <div className="v">
              <span className="mono"
                    style={{ fontSize: 12.5, color: due.tone === 'overdue' ? 'var(--warn)' : 'var(--ink)' }}>
                {req.due ? new Date(req.due).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
              </span>
              {due.tone && (
                <span className="mono" style={{ fontSize: 11, color: due.tone === 'overdue' ? 'var(--warn)' : 'var(--accent-ink)' }}>
                  · {due.label}
                </span>
              )}
            </div>

            <div className="k">Priority</div>
            <div className="v">
              <span className="status-pill">
                <span className="dot" style={{
                  background: req.priority === 'high' ? 'var(--warn)' : req.priority === 'med' ? 'var(--accent)' : 'var(--ink-3)',
                }} />
                {req.priority === 'high' ? 'High' : req.priority === 'med' ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>

          {req.desc && (
            <React.Fragment>
              <div className="nav-label" style={{ padding: 0, marginBottom: 8 }}>Description</div>
              <div className="desc-block">{req.desc}</div>
            </React.Fragment>
          )}

          <div className="activity">
            <h3>Activity</h3>
            <div className="activity-list">
              {req.activity.map((a, i) => {
                const p = personById(a.who);
                return (
                  <div key={i} className="activity-row">
                    <Avatar person={p} />
                    <div>
                      <span className="who">{p.isMe ? 'You' : p.name}</span> {a.text}
                      <span className="when">{a.when}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="comment-box">
              <textarea placeholder="Add a comment…"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment();
                        }} />
              <div className="row">
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>⌘ + Return to send</span>
                <button className="btn" disabled={!comment.trim()}
                        style={{ opacity: comment.trim() ? 1 : 0.4 }}
                        onClick={submitComment}>Comment</button>
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-foot">
          {req.status !== 'done' ? (
            <button className="btn"
                    onClick={() => onUpdate(req.id, (r) => ({
                      ...r, status: 'done',
                      activity: [...r.activity, { who: 'me', when: 'just now', text: 'Marked as done' }],
                    }))}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <IconCheck size={13} /> Mark done
              </span>
            </button>
          ) : (
            <button className="btn secondary"
                    onClick={() => onUpdate(req.id, (r) => ({ ...r, status: defaultStatusFor(r.direction) }))}>
              Reopen
            </button>
          )}
          <div style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
            {req.activity.length} updates
          </span>
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { Drawer });
