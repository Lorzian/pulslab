import React from 'react';

export function ConnectionToolbar({
  active,
  isPaused,
  togglePause,
  disconnectSource,
  isConnecting,
  connect,
  startDemo,
  canExport,
  exportSessionCsv,
  serialSupported,
}) {
  return (
    <section className="toolbar" aria-label="Conexiune și sesiune">
      <div>
        <span className="section-index">01</span>
        <strong>Sursa de date</strong>
      </div>
      <div className="toolbar-buttons">
        {active ? (
          <>
            <button onClick={togglePause}>{isPaused ? '▷ Continuă' : 'Ⅱ Pauză'}</button>
            <button onClick={disconnectSource}>Deconectează</button>
          </>
        ) : (
          <>
            <button
              className="primary"
              disabled={isConnecting || !serialSupported}
              onClick={connect}
            >
              {isConnecting ? 'Se conectează…' : '↗ Conectează Arduino'}
            </button>
            <button onClick={startDemo}>▷ Pornește demo</button>
          </>
        )}
        <button disabled={!canExport} onClick={exportSessionCsv}>
          ↓ Export CSV
        </button>
      </div>
    </section>
  );
}
