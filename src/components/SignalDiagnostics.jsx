import React from 'react';
import { display } from '../utils/format.js';
export function SignalDiagnostics({ measurements }) {
  return (
    <section className="panel diagnostics">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">VERIFICĂRI</p>
          <h2>În culisele semnalului</h2>
        </div>
        <span className="tag">SESIUNEA CURENTĂ</span>
      </div>
      <div className="diagnostic-grid">
        {[
          ['Rată măsurată', display(measurements.rate, 1), 'Hz'],
          ['Eșantioane pierdute', measurements.lost, ''],
          ['Linii invalide', measurements.invalid, ''],
          ['Consistență ritm', display(measurements.consistency, 1), '%'],
        ].map(([label, value, unit]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>
              {value} <small>{unit}</small>
            </strong>
          </div>
        ))}
      </div>
      <div className="hrv">
        <span>HRV orientativ</span>
        <span>
          RMSSD <b>{display(measurements.rmssd, 1)} ms</b>
        </span>
        <span>
          SDNN <b>{display(measurements.sdnn, 1)} ms</b>
        </span>
        <span>{measurements.count.toLocaleString('ro-RO')} eșantioane</span>
      </div>
    </section>
  );
}
