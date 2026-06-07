// Broadcasts view — grouped requests showing per-person status

function BroadcastsView({ requests, groups: allGroups, peopleFilter, onOpen, onHover }) {
  // Filter to selected group if applicable
  const visible = React.useMemo(() => {
    if (!peopleFilter?.startsWith?.('grp-')) return requests;
    const grp = (allGroups || []).find(g => g.id === peopleFilter);
    if (!grp) return requests;
    return requests.filter(r => {
      const other = r.direction === 'sent' ? r.to : r.from;
      return grp.members.includes(other);
    });
  }, [requests, allGroups, peopleFilter]);

  // Group by groupRequestId, hide groups where every request is done
  const groups = React.useMemo(() => {
    const map = new Map();
    visible.forEach(r => {
      if (!map.has(r.groupRequestId)) map.set(r.groupRequestId, []);
      map.get(r.groupRequestId).push(r);
    });
    return [...map.values()]
      .filter(reqs => reqs.some(r => r.status !== 'done'))
      .sort((a, b) => new Date(b[0].created) - new Date(a[0].created));
  }, [visible]);

  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <span className="serif">No broadcasts yet.</span>
        Send a request to a group or multiple people to see it here.
      </div>
    );
  }

  return (
    <div className="broadcasts-wrap">
      {groups.map(reqs => {
        const first = reqs[0];

        return (
          <div key={first.groupRequestId} className="broadcast-card" data-priority={first.priority}>
            <div className="broadcast-head">
              <span className={'qa-dir-arrow ' + first.direction} style={{ marginTop: 2 }}>
                {first.direction === 'sent' ? <IconArrowUR size={12} /> : <IconArrowDL size={12} />}
              </span>
              <div style={{ flex: 1 }}>
                <div className="broadcast-title">{first.title}</div>
                <div className="broadcast-meta mono">
                  {first.groupName && <span>{first.groupName} · </span>}
                  {new Date(first.created).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="broadcast-rows">
              {reqs.map(r => {
                const person = personById(r.direction === 'sent' ? r.to : r.from);
                const eff = effectiveStatus(r);
                const status = STATUSES.find(s => s.id === eff) || STATUSES.find(s => s.id === r.status);

                return (
                  <button key={r.id} className="broadcast-row" data-req-id={r.id}
                          onMouseEnter={() => onHover && onHover(r.id)}
                          onMouseLeave={() => onHover && onHover(null)}
                          onClick={() => onOpen && onOpen(r.id)}>
                    <Avatar person={person} />
                    <span className="broadcast-person">{person.name}</span>
                    <span className="broadcast-status">
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: status?.color, display: 'inline-block', marginRight: 5, flexShrink: 0 }} />
                      {status?.label}
                    </span>
                    {r.due && (
                      <span className="broadcast-due mono">{
                        new Date(r.due).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                      }</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { BroadcastsView });
