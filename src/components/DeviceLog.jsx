import React from 'react';

export function DeviceLog({ logs, onClear }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">COMUNICAȚIE</p>
          <h2>Jurnal dispozitiv</h2>
        </div>
        <button className="text-button" onClick={onClear}>
          Golește
        </button>
      </div>
      <div className="logs" aria-live="polite">
        {logs.map((entry, i) => (
          <div key={i}>
            <time>{entry.time}</time>
            <span className={entry.text.includes('#ERR') ? 'log-error' : ''}>{entry.text}</span>
          </div>
        ))}
        {!logs.length && <p>Niciun mesaj.</p>}
      </div>
    </section>
  );
}
