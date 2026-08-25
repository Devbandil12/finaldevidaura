import React from 'react';

const AuditChanges = ({ log }) => {
  if (!log.changes && !log.before && !log.after) return null;

  return (
    <div>
      <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Data Changes</h3>
      
      {log.changes ? (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="bg-[var(--surface)] px-4 py-2 border-b border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text)]">Diff (Changes)</p>
          </div>
          <pre className="p-4 bg-[var(--surface)] text-xs text-[var(--text)] overflow-x-auto">
            {JSON.stringify(log.changes, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {log.before && (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="bg-[var(--surface)] px-4 py-2 border-b border-[var(--border)]">
                <p className="text-xs font-bold text-[var(--text)]">Before</p>
              </div>
              <pre className="p-4 bg-[var(--surface)] text-xs text-[var(--error)] overflow-x-auto opacity-80">
                {JSON.stringify(log.before, null, 2)}
              </pre>
            </div>
          )}
          {log.after && (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="bg-[var(--surface)] px-4 py-2 border-b border-[var(--border)]">
                <p className="text-xs font-bold text-[var(--text)]">After</p>
              </div>
              <pre className="p-4 bg-[var(--surface)] text-xs text-[var(--success)] overflow-x-auto opacity-80">
                {JSON.stringify(log.after, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditChanges;
