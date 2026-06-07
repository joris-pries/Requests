// H shortcut — keyboard shortcut reference

const SHORTCUTS = [
  { keys: ['N'],     desc: 'New request' },
  { keys: ['M'],     desc: 'New request for current person / group' },
  { keys: ['P'],     desc: 'Jump to person or group' },
  { keys: ['T'],     desc: 'Jump to tag' },
  { keys: ['Q'],     desc: 'Quick add' },
  { keys: ['/'],     desc: 'Focus search' },
  { keys: ['Space'], desc: 'Toggle status of hovered request' },
  { keys: ['E'],     desc: 'Edit hovered or open request' },
  { keys: ['D'],     desc: 'Delete hovered or open request' },
  { keys: ['Esc'],   desc: 'Clear selection' },
  { keys: ['H'],     desc: 'Show this help' },
];

function HelpModal({ onClose }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360, gap: 0, padding: 0 }}
           onClick={e => e.stopPropagation()}>

        <div className="modal-head">
          <div className="title">Keyboard shortcuts</div>
          <button className="icon-btn" onClick={onClose}><IconClose size={16} /></button>
        </div>

        <div className="modal-body" style={{ padding: '8px 0' }}>
          {SHORTCUTS.map(({ keys, desc }) => (
            <div key={desc} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 20px', gap: 12,
            }}>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{desc}</span>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {keys.map(k => (
                  <kbd key={k} style={{
                    fontFamily: 'Geist Mono, monospace', fontSize: 11.5,
                    padding: '2px 7px', borderRadius: 5,
                    background: 'var(--hover)', border: '1px solid var(--line)',
                    color: 'var(--ink)', lineHeight: 1.6,
                  }}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HelpModal });
