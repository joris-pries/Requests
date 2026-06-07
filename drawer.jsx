// Request detail drawer

function Drawer({ req, onClose, onEdit, onUpdate, onStatusChange }) {
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
          <input className="drawer-title-input"
                 value={req.title}
                 onChange={(e) => onUpdate(req.id, (r) => ({ ...r, title: e.target.value }))} />
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }} className="mono">
            opened {new Date(req.created).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </div>

          <div className="meta-grid">
            <div className="k">Status</div>
            <div className="v">
              <select value={req.status}
                      onChange={(e) => onStatusChange
                        ? onStatusChange(req.id, e.target.value)
                        : onUpdate(req.id, (r) => ({ ...r, status: e.target.value }))}
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
              <input type="date" value={req.due || ''}
                     onChange={(e) => onUpdate(req.id, (r) => ({ ...r, due: e.target.value || null }))}
                     style={{
                       border: '1px solid var(--line)',
                       background: 'var(--bg-elev)',
                       padding: '4px 8px',
                       borderRadius: 7,
                       fontSize: 12.5,
                       fontFamily: 'inherit',
                       color: due.tone === 'overdue' ? 'var(--warn)' : 'var(--ink)',
                     }} />
              {due.tone && (
                <span className="mono" style={{ fontSize: 11, color: due.tone === 'overdue' ? 'var(--warn)' : 'var(--accent-ink)' }}>
                  {due.label}
                </span>
              )}
            </div>

            <div className="k">Priority</div>
            <div className="v">
              <select value={req.priority}
                      onChange={(e) => onUpdate(req.id, (r) => ({ ...r, priority: e.target.value }))}
                      style={{
                        border: '1px solid var(--line)',
                        background: 'var(--bg-elev)',
                        padding: '4px 8px',
                        borderRadius: 7,
                        fontSize: 12.5,
                        fontFamily: 'inherit',
                      }}>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="k">Repeats</div>
            <div className="v" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <select value={req.recurrence?.type ?? ''}
                      onChange={(e) => {
                        const type = e.target.value || null;
                        onUpdate(req.id, r => ({
                          ...r,
                          recurrence: type === null ? null
                            : type === 'custom' ? { type: 'custom', text: r.recurrence?.text ?? '' }
                            : { type },
                        }));
                      }}
                      style={{
                        border: '1px solid var(--line)',
                        background: 'var(--bg-elev)',
                        padding: '4px 8px',
                        borderRadius: 7,
                        fontSize: 12.5,
                        fontFamily: 'inherit',
                      }}>
                {RECURRENCE_OPTIONS.map(o => (
                  <option key={String(o.type)} value={o.type ?? ''}>{o.label}</option>
                ))}
              </select>
              {req.recurrence?.type === 'custom' && (
                <input type="text"
                       value={req.recurrence.text ?? ''}
                       placeholder="e.g. first Monday of month"
                       onChange={(e) => onUpdate(req.id, r => ({
                         ...r,
                         recurrence: { type: 'custom', text: e.target.value },
                       }))}
                       style={{
                         border: '1px solid var(--line)',
                         background: 'var(--bg-elev)',
                         padding: '4px 8px',
                         borderRadius: 7,
                         fontSize: 12.5,
                         fontFamily: 'inherit',
                         width: '100%',
                       }} />
              )}
            </div>
            <div className="k">Tags</div>
            <div className="v" style={{ display: 'block' }}>
              <TagInput value={req.tags || []}
                        onChange={(tags) => onUpdate(req.id, r => ({ ...r, tags }))} />
            </div>
          </div>

          <div className="nav-label" style={{ padding: 0, marginBottom: 8 }}>Description</div>
          <textarea className="drawer-desc-input"
                    placeholder="Add a description…"
                    value={req.desc || ''}
                    onChange={(e) => onUpdate(req.id, (r) => ({ ...r, desc: e.target.value }))} />

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
          <button className="btn secondary" onClick={onClose}>Close</button>
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
